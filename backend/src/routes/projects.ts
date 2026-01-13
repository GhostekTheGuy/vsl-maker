import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { ClaudeService } from '../services/claude.js';
import type { Project, Scene, CreateProjectRequest } from '../types/index.js';

const router = Router();

// Helper function to get API keys from settings or env
async function getApiKeys(): Promise<{ anthropicKey?: string; nanobananaKey?: string }> {
  const [settings] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'default'));

  return {
    anthropicKey: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    nanobananaKey: settings?.nanobananaApiKey || process.env.NANOBANANA_API_KEY,
  };
}

// Transform DB rows to Project type
function transformProject(
  project: typeof schema.projects.$inferSelect,
  scenes: (typeof schema.scenes.$inferSelect)[]
): Project {
  return {
    id: project.id,
    title: project.title,
    theme: project.theme,
    captions: project.captions,
    styleHints: project.styleHints || undefined,
    referenceImageUrl: project.referenceImageUrl || undefined,
    totalDuration: project.totalDuration,
    status: project.status as Project['status'],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    scenes: scenes.map((scene) => ({
      id: scene.id,
      number: scene.number,
      title: scene.title,
      description: scene.description,
      visualPrompt: scene.visualPrompt,
      durationSeconds: scene.durationSeconds,
      imageUrl: scene.imageUrl || undefined,
      imageStatus: scene.imageStatus as Scene['imageStatus'],
      errorMessage: scene.errorMessage || undefined,
    })),
  };
}

// GET /api/projects - Lista wszystkich projektów
router.get('/', async (_req, res) => {
  try {
    const projectRows = await db.select().from(schema.projects).orderBy(schema.projects.createdAt);

    const projects: Project[] = [];
    for (const project of projectRows) {
      const scenes = await db
        .select()
        .from(schema.scenes)
        .where(eq(schema.scenes.projectId, project.id))
        .orderBy(schema.scenes.number);
      projects.push(transformProject(project, scenes));
    }

    res.json(projects.reverse()); // Newest first
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Szczegóły projektu
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scenes = await db
      .select()
      .from(schema.scenes)
      .where(eq(schema.scenes.projectId, id))
      .orderBy(schema.scenes.number);

    res.json(transformProject(project, scenes));
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Tworzenie nowego projektu + generowanie scenariusza
router.post('/', async (req, res) => {
  try {
    const body: CreateProjectRequest = req.body;

    if (!body.captions || body.captions.length < 50) {
      return res.status(400).json({ error: 'Captions must be at least 50 characters' });
    }

    const { anthropicKey } = await getApiKeys();
    if (!anthropicKey) {
      return res.status(400).json({ error: 'Anthropic API key not configured' });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    // Create project with generating status
    await db.insert(schema.projects).values({
      id: projectId,
      title: 'Generating...',
      theme: '',
      captions: body.captions,
      styleHints: body.styleHints || null,
      referenceImageUrl: body.referenceImageUrl || null,
      totalDuration: 0,
      status: 'generating_script',
      createdAt: now,
      updatedAt: now,
    });

    // Generate script with Claude
    const claude = new ClaudeService(anthropicKey);
    const script = await claude.generateScript({
      captions: body.captions,
      numScenes: body.numScenes || 12,
      styleHints: body.styleHints,
    });

    // Update project with generated data
    await db
      .update(schema.projects)
      .set({
        title: script.title,
        theme: script.theme,
        totalDuration: script.totalDuration,
        status: 'script_ready',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.projects.id, projectId));

    // Insert scenes
    for (const scene of script.scenes) {
      await db.insert(schema.scenes).values({
        id: uuidv4(),
        projectId,
        number: scene.number,
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        durationSeconds: scene.durationSeconds,
        imageStatus: 'pending',
      });
    }

    // Fetch and return complete project
    const [updatedProject] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    const scenes = await db
      .select()
      .from(schema.scenes)
      .where(eq(schema.scenes.projectId, projectId))
      .orderBy(schema.scenes.number);

    res.status(201).json(transformProject(updatedProject!, scenes));
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: String(error) });
  }
});

// DELETE /api/projects/:id - Usunięcie projektu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete scenes first (cascade should handle this, but just in case)
    await db.delete(schema.scenes).where(eq(schema.scenes.projectId, id));
    await db.delete(schema.projects).where(eq(schema.projects.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
