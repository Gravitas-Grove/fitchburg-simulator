import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err.message);
  res.status(500).json({
    error: 'Internal server error',
    ...(config.isDev ? { message: err.message } : {}),
  });
}
