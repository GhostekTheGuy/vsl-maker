import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { ClaudeService } from '../services/claude.js';
import { NanoBananaService } from '../services/nanobanana.js';
import { StorageService } from '../services/storage.js';
import type { GenerationStatus } from '../types/index.js';

const router = Router();
const storage = new StorageService();

// Helper function to get API keys from settings or env
async function getApiKeys(): Promise<{ anthropicKey?: string; nanobananaKey?: string }> {
  const [settings] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'default'));

  return {
    anthropicKey: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    nanobananaKey: settings?.nanobananaApiKey || process.env.NANOBANANA_API_KEY,
  };
}

// POST /api/projects/:id/generate-script - Regenerowanie scenariusza
router.post('/:id/generate-script', async (req, res) => {
  try {
    const { id } = req.params;
    const { styleHints, numScenes } = req.body;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { anthropicKey } = await getApiKeys();
    if (!anthropicKey) {
      return res.status(400).json({ error: 'Anthropic API key not configured' });
    }

    // Update status
    await db
      .update(schema.projects)
      .set({ status: 'generating_script', updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, id));

    // Generate new script
    const claude = new ClaudeService(anthropicKey);
    const script = await claude.generateScript({
      captions: project.captions,
      numScenes: numScenes || 12,
      styleHints: styleHints || project.styleHints || undefined,
    });

    // Delete old scenes
    await db.delete(schema.scenes).where(eq(schema.scenes.projectId, id));

    // Insert new scenes
    for (const scene of script.scenes) {
      await db.insert(schema.scenes).values({
        id: uuidv4(),
        projectId: id,
        number: scene.number,
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        durationSeconds: scene.durationSeconds,
        imageStatus: 'pending',
      });
    }

    // Update project
    await db
      .update(schema.projects)
      .set({
        title: script.title,
        theme: script.theme,
        totalDuration: script.totalDuration,
        styleHints: styleHints || project.styleHints,
        status: 'script_ready',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.projects.id, id));

    // Fetch and return complete project
    const [updatedProject] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    const scenes = await db
      .select()
      .from(schema.scenes)
      .where(eq(schema.scenes.projectId, id))
      .orderBy(schema.scenes.number);

    res.json({
      id: updatedProject!.id,
      title: updatedProject!.title,
      theme: updatedProject!.theme,
      captions: updatedProject!.captions,
      styleHints: updatedProject!.styleHints,
      totalDuration: updatedProject!.totalDuration,
      status: updatedProject!.status,
      createdAt: updatedProject!.createdAt,
      updatedAt: updatedProject!.updatedAt,
      scenes: scenes.map((s) => ({
        id: s.id,
        number: s.number,
        title: s.title,
        description: s.description,
        visualPrompt: s.visualPrompt,
        durationSeconds: s.durationSeconds,
        imageUrl: s.imageUrl,
        imageStatus: s.imageStatus,
        errorMessage: s.errorMessage,
      })),
    });
  } catch (error) {
    console.error('Error regenerating script:', error);
    res.status(500).json({ error: 'Failed to regenerate script', details: String(error) });
  }
});

// POST /api/projects/:id/generate-images - Rozpoczęcie generowania obrazów dla wszystkich scen
router.post('/:id/generate-images', async (req, res) => {
  try {
    const { id } = req.params;
    const { model = 'flash', referenceImageUrl } = req.body;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { nanobananaKey } = await getApiKeys();
    if (!nanobananaKey) {
      return res.status(400).json({ error: 'NanoBanana API key not configured' });
    }

    const scenes = await db
      .select()
      .from(schema.scenes)
      .where(eq(schema.scenes.projectId, id))
      .orderBy(schema.scenes.number);

    // Update project status
    await db
      .update(schema.projects)
      .set({ status: 'generating_images', updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, id));

    // Start generating images in background
    generateImagesInBackground(id, scenes, model, nanobananaKey, referenceImageUrl || project.referenceImageUrl);

    res.json({ status: 'started', totalScenes: scenes.length });
  } catch (error) {
    console.error('Error starting image generation:', error);
    res.status(500).json({ error: 'Failed to start image generation' });
  }
});

// Background image generation
async function generateImagesInBackground(
  projectId: string,
  scenes: (typeof schema.scenes.$inferSelect)[],
  model: 'flash' | 'pro',
  apiKey: string,
  referenceImageUrl?: string | null
) {
  const nanobanana = new NanoBananaService(apiKey);

  for (const scene of scenes) {
    try {
      // Mark scene as generating
      await db
        .update(schema.scenes)
        .set({ imageStatus: 'generating' })
        .where(eq(schema.scenes.id, scene.id));

      // Submit generation
      const taskId = await nanobanana.submitGeneration({
        prompt: scene.visualPrompt,
        model,
        referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : undefined,
      });

      // Wait for image
      const imageUrl = await nanobanana.waitForImage(taskId);

      // Save image locally
      const localUrl = await storage.downloadAndSaveImage(imageUrl, projectId);

      // Update scene with image URL
      await db
        .update(schema.scenes)
        .set({ imageUrl: localUrl, imageStatus: 'completed' })
        .where(eq(schema.scenes.id, scene.id));
    } catch (error) {
      console.error(`Error generating image for scene ${scene.number}:`, error);
      await db
        .update(schema.scenes)
        .set({
          imageStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(schema.scenes.id, scene.id));
    }
  }

  // Check if all scenes completed
  const updatedScenes = await db
    .select()
    .from(schema.scenes)
    .where(eq(schema.scenes.projectId, projectId));

  const allCompleted = updatedScenes.every((s) => s.imageStatus === 'completed');
  const hasErrors = updatedScenes.some((s) => s.imageStatus === 'error');

  const newStatus: GenerationStatus = allCompleted ? 'completed' : hasErrors ? 'error' : 'completed';

  await db
    .update(schema.projects)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(schema.projects.id, projectId));
}

// POST /api/projects/:id/scenes/:sceneId/generate-image - Generowanie obrazu dla pojedynczej sceny
router.post('/:id/scenes/:sceneId/generate-image', async (req, res) => {
  try {
    const { id, sceneId } = req.params;
    const { model = 'flash' } = req.body;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [scene] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, sceneId));

    if (!scene || scene.projectId !== id) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const { nanobananaKey } = await getApiKeys();
    if (!nanobananaKey) {
      return res.status(400).json({ error: 'NanoBanana API key not configured' });
    }

    // Mark scene as generating
    await db.update(schema.scenes).set({ imageStatus: 'generating' }).where(eq(schema.scenes.id, sceneId));

    const nanobanana = new NanoBananaService(nanobananaKey);

    try {
      const taskId = await nanobanana.submitGeneration({
        prompt: scene.visualPrompt,
        model,
        referenceImageUrls: project.referenceImageUrl ? [project.referenceImageUrl] : undefined,
      });

      const imageUrl = await nanobanana.waitForImage(taskId);
      const localUrl = await storage.downloadAndSaveImage(imageUrl, id);

      await db
        .update(schema.scenes)
        .set({ imageUrl: localUrl, imageStatus: 'completed', errorMessage: null })
        .where(eq(schema.scenes.id, sceneId));

      const [updatedScene] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, sceneId));

      res.json({
        id: updatedScene!.id,
        number: updatedScene!.number,
        title: updatedScene!.title,
        description: updatedScene!.description,
        visualPrompt: updatedScene!.visualPrompt,
        durationSeconds: updatedScene!.durationSeconds,
        imageUrl: updatedScene!.imageUrl,
        imageStatus: updatedScene!.imageStatus,
        errorMessage: updatedScene!.errorMessage,
      });
    } catch (error) {
      await db
        .update(schema.scenes)
        .set({
          imageStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(schema.scenes.id, sceneId));

      res.status(500).json({ error: 'Failed to generate image', details: String(error) });
    }
  } catch (error) {
    console.error('Error generating single image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// GET /api/projects/:id/generation-status - Status generowania
router.get('/:id/generation-status', async (req, res) => {
  try {
    const { id } = req.params;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scenes = await db.select().from(schema.scenes).where(eq(schema.scenes.projectId, id));

    const completedScenes = scenes.filter((s) => s.imageStatus === 'completed').length;

    res.json({
      status: project.status,
      completedScenes,
      totalScenes: scenes.length,
    });
  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({ error: 'Failed to fetch generation status' });
  }
});

// PATCH /api/projects/:id/scenes/:sceneId - Edycja sceny
router.patch('/:id/scenes/:sceneId', async (req, res) => {
  try {
    const { id, sceneId } = req.params;
    const updates = req.body;

    const [scene] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, sceneId));

    if (!scene || scene.projectId !== id) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const allowedFields = ['title', 'description', 'visualPrompt', 'durationSeconds'];
    const filteredUpdates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await db.update(schema.scenes).set(filteredUpdates).where(eq(schema.scenes.id, sceneId));

    // Update project timestamp
    await db
      .update(schema.projects)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, id));

    const [updatedScene] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, sceneId));

    res.json({
      id: updatedScene!.id,
      number: updatedScene!.number,
      title: updatedScene!.title,
      description: updatedScene!.description,
      visualPrompt: updatedScene!.visualPrompt,
      durationSeconds: updatedScene!.durationSeconds,
      imageUrl: updatedScene!.imageUrl,
      imageStatus: updatedScene!.imageStatus,
      errorMessage: updatedScene!.errorMessage,
    });
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

export default router;
