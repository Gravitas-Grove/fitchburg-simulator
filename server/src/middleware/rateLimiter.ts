import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.isDev ? 100 : 20, // 20 req/min in production
  message: { error: 'Too many AI requests. Please try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDev,
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.isDev ? 500 : 120,
  message: { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDev,
});
