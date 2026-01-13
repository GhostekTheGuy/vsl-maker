import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  theme: text('theme').notNull(),
  captions: text('captions').notNull(),
  styleHints: text('style_hints'),
  referenceImageUrl: text('reference_image_url'),
  totalDuration: real('total_duration').notNull(),
  status: text('status').notNull().default('idle'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  visualPrompt: text('visual_prompt').notNull(),
  durationSeconds: real('duration_seconds').notNull(),
  imageUrl: text('image_url'),
  imageStatus: text('image_status').notNull().default('pending'),
  errorMessage: text('error_message'),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  anthropicApiKey: text('anthropic_api_key'),
  nanobananaApiKey: text('nanobanana_api_key'),
  defaultModel: text('default_model').default('flash'),
  defaultNumScenes: integer('default_num_scenes').default(12),
});

export type ProjectRow = typeof projects.$inferSelect;
export type SceneRow = typeof scenes.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
