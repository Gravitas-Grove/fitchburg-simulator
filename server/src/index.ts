import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config.js';
import { aiRouter } from './routes/ai.js';
import { scenarioRouter } from './routes/scenarios.js';
import { gisRouter } from './routes/gis.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { aiRateLimiter, generalRateLimiter } from './middleware/rateLimiter.js';
import { initDb } from './db/index.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Handled by Vite in dev, configure properly in production
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.isDev ? true : config.allowedOrigins,
  credentials: true,
}));

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/ai', aiRateLimiter);
app.use('/api', generalRateLimiter);

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
