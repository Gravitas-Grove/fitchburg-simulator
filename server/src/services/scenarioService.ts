import { getDb } from '../db/index.js';
import { scenarios } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const scenarioService = {
  getAll() {
    return getDb().select().from(scenarios).all();
  },

  getById(id: string) {
    return getDb().select().from(scenarios).where(eq(scenarios.id, id)).get();
  },
};
