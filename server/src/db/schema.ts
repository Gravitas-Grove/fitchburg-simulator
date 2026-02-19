import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).notNull().default(true),
  poly2030: text('poly_2030', { mode: 'json' }).notNull().$type<[number, number][]>(),
  poly2060: text('poly_2060', { mode: 'json' }).notNull().$type<[number, number][]>(),
  infraMult: real('infra_mult').notNull(),
  agAcres: integer('ag_acres').notNull(),
  agImpact: text('ag_impact').notNull(),
});

export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  scenarioId: text('scenario_id'),
  growthRate: integer('growth_rate').notNull().default(75),
  density: text('density').notNull().default('med'),
  title: text('title').notNull().default('New Chat'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => chatSessions.id),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at').notNull(),
});

export const preferences = sqliteTable('preferences', {
  id: text('id').primaryKey().default('default'),
  defaultGrowthRate: integer('default_growth_rate').default(75),
  defaultDensity: text('default_density').default('med'),
  visibleLayers: text('visible_layers', { mode: 'json' }).$type<string[]>(),
  lastScenarioId: text('last_scenario_id'),
});
