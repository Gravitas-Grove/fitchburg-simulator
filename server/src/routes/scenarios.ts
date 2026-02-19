import { Router } from 'express';
import { getDb } from '../db/index.js';
import { scenarios } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const scenarioRouter = Router();

scenarioRouter.get('/', (_req, res) => {
  try {
    const db = getDb();
    const all = db.select().from(scenarios).all();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

scenarioRouter.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = db.select().from(scenarios).where(eq(scenarios.id, id)).get();

    if (!result) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});
