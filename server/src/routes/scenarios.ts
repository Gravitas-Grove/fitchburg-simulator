import { Router } from 'express';
import { getDb } from '../db/index.js';
import { scenarios, scenarioParcels } from '../db/schema.js';
import { eq, and, lte, gte } from 'drizzle-orm';

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

// GET /api/scenarios/:id/parcels?yearStart=2025&yearEnd=2060
scenarioRouter.get('/:id/parcels', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const yearStart = parseInt(req.query.yearStart as string) || 2025;
    const yearEnd = parseInt(req.query.yearEnd as string) || 2060;

    // Verify scenario exists
    const scenario = db.select().from(scenarios).where(eq(scenarios.id, id)).get();
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Fetch parcels with year range filter
    const parcels = db
      .select()
      .from(scenarioParcels)
      .where(
        and(
          eq(scenarioParcels.scenarioId, id),
          gte(scenarioParcels.developYear, yearStart),
          lte(scenarioParcels.developYear, yearEnd)
        )
      )
      .all();

    res.json({
      scenarioId: id,
      totalParcels: parcels.length,
      yearRange: { start: yearStart, end: yearEnd },
      parcels: parcels.map((p) => ({
        parcelNo: p.parcelNo,
        address: p.address,
        owner: p.owner,
        schoolDistrict: p.schoolDistrict,
        areaAcres: p.areaAcres,
        landValue: p.landValue,
        developYear: p.developYear,
        priorityScore: p.priorityScore,
        scenarioReason: p.scenarioReason,
        centroid: p.centroid,
        coordinates: p.coordinates,
      })),
    });
  } catch (err) {
    console.error('[scenarios] Error fetching parcels:', err);
    res.status(500).json({ error: 'Failed to fetch scenario parcels' });
  }
});
