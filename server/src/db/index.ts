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
  `);

  console.log('[db] SQLite database initialized at', config.dbPath);
}
