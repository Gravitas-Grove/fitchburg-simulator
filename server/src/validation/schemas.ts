import { z } from 'zod';

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long (max 5000 characters)'),
  scenarioContext: z.object({
    scenarioId: z.string().optional(),
    scenarioName: z.string(),
    description: z.string(),
    growthRate: z.number().min(50).max(200),
    density: z.enum(['low', 'med', 'high']),
    acres: z.number(),
    units: z.number(),
    infraM: z.number(),
    agLand: z.number(),
    agImpact: z.string(),
    scorecard: z.any().optional(),
    allScenarios: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  }).optional().nullable(),
});

export const analyzeSchema = z.object({
  message: z.string().max(5000).optional(),
  scenarioContext: z.object({
    scenarioName: z.string().min(1),
    description: z.string(),
    growthRate: z.number().min(50).max(200),
    density: z.enum(['low', 'med', 'high']),
    acres: z.number(),
    units: z.number(),
    infraM: z.number(),
    agLand: z.number(),
    agImpact: z.string(),
    scorecard: z.any().optional(),
  }),
});

export const compareSchema = z.object({
  message: z.string().max(5000).optional(),
  scenarioContext: z.any().optional().nullable(),
});

export const sessionIdSchema = z.object({
  id: z.string().uuid(),
});
