import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { ClaudeService } from '../services/claude.js';
import { NanoBananaService } from '../services/nanobanana.js';

const router = Router();

// GET /api/settings - Pobranie ustawień (bez kluczy API w pełnej formie)
router.get('/', async (_req, res) => {
  try {
    const [settings] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'default'));

    if (!settings) {
      return res.json({
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasNanobananaKey: !!process.env.NANOBANANA_API_KEY,
        defaultModel: 'flash',
        defaultNumScenes: 12,
      });
    }

    res.json({
      hasAnthropicKey: !!(settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY),
      hasNanobananaKey: !!(settings.nanobananaApiKey || process.env.NANOBANANA_API_KEY),
      defaultModel: settings.defaultModel || 'flash',
      defaultNumScenes: settings.defaultNumScenes || 12,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Zapisanie ustawień
router.put('/', async (req, res) => {
  try {
    const { anthropicApiKey, nanobananaApiKey, defaultModel, defaultNumScenes } = req.body;

    const updates: Record<string, unknown> = {};

    if (anthropicApiKey !== undefined) {
      updates.anthropicApiKey = anthropicApiKey || null;
    }
    if (nanobananaApiKey !== undefined) {
      updates.nanobananaApiKey = nanobananaApiKey || null;
    }
    if (defaultModel !== undefined) {
      updates.defaultModel = defaultModel;
    }
    if (defaultNumScenes !== undefined) {
      updates.defaultNumScenes = defaultNumScenes;
    }

    // Upsert settings
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.id, 'default'));

    if (existing) {
      await db.update(schema.settings).set(updates).where(eq(schema.settings.id, 'default'));
    } else {
      await db.insert(schema.settings).values({
        id: 'default',
        ...updates,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// POST /api/settings/validate-keys - Walidacja kluczy API
router.post('/validate-keys', async (req, res) => {
  try {
    const { anthropicApiKey, nanobananaApiKey } = req.body;

    const results = {
      anthropic: false,
      nanobanana: false,
    };

    if (anthropicApiKey) {
      try {
        const claude = new ClaudeService(anthropicApiKey);
        results.anthropic = await claude.validateApiKey();
      } catch {
        results.anthropic = false;
      }
    }

    if (nanobananaApiKey) {
      try {
        const nanobanana = new NanoBananaService(nanobananaApiKey);
        results.nanobanana = await nanobanana.validateApiKey();
      } catch {
        results.nanobanana = false;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error validating keys:', error);
    res.status(500).json({ error: 'Failed to validate keys' });
  }
});

export default router;
