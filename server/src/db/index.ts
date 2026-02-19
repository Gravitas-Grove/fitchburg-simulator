import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config.js';
import * as schema from './schema.js';
import fs from 'fs';
import path from 'path';

let db: ReturnType<typeof drizzle<typeof schema>>;
let sqlite: Database.Database;

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export async function initDb() {
  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqlite = new Database(config.dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_built_in INTEGER NOT NULL DEFAULT 1,
      poly_2030 TEXT NOT NULL,
      poly_2060 TEXT NOT NULL,
      infra_mult REAL NOT NULL,
      ag_acres INTEGER NOT NULL,
      ag_impact TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      scenario_id TEXT,
      growth_rate INTEGER NOT NULL DEFAULT 75,
      density TEXT NOT NULL DEFAULT 'med',
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      default_growth_rate INTEGER DEFAULT 75,
      default_density TEXT DEFAULT 'med',
      visible_layers TEXT,
      last_scenario_id TEXT
    );

    CREATE TABLE IF NOT EXISTS scenario_parcels (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      parcel_no TEXT NOT NULL,
      address TEXT,
      owner TEXT,
      school_district TEXT,
      area_acres REAL,
      land_value REAL,
      coordinates TEXT,
      centroid TEXT,
      priority_score REAL,
      develop_year INTEGER,
      scenario_reason TEXT
    );
  `);

  // Add new columns if they don't exist (safe migration)
  try {
    sqlite.exec(`ALTER TABLE scenarios ADD COLUMN spatial_profile TEXT`);
  } catch { /* column already exists */ }
  try {
    sqlite.exec(`ALTER TABLE scenarios ADD COLUMN generation_method TEXT DEFAULT 'procedural'`);
  } catch { /* column already exists */ }

  // Create indices for performance
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_scenario_id ON chat_sessions(scenario_id);
    CREATE INDEX IF NOT EXISTS idx_scenario_parcels_scenario_year ON scenario_parcels(scenario_id, develop_year);
    CREATE INDEX IF NOT EXISTS idx_scenario_parcels_scenario_id ON scenario_parcels(scenario_id);
  `);

  console.log('[db] SQLite database initialized at', config.dbPath);
}
