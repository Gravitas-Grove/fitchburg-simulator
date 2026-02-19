import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config.js';
import { aiRouter } from './routes/ai.js';
import { scenarioRouter } from './routes/scenarios.js';
import { gisRouter } from './routes/gis.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initDb } from './db/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API routes
app.use('/api/ai', aiRouter);
app.use('/api/scenarios', scenarioRouter);
app.use('/api/gis', gisRouter);
app.use('/api', healthRouter);

// Serve client in production
if (!config.isDev) {
  app.use(express.static(config.clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.clientDistPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

// Start
async function start() {
  await initDb();
  app.listen(config.port, () => {
    console.log(`[server] Fitchburg Simulator API running on http://localhost:${config.port}`);
    console.log(`[server] Environment: ${config.isDev ? 'development' : 'production'}`);
    if (!config.anthropicApiKey) {
      console.log('[server] Warning: ANTHROPIC_API_KEY not set — AI features will not work');
    }
  });
}

start().catch(console.error);
