import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const cache: Record<string, object | null> = {};

export const gisService = {
  getLayer(filename: string): object | null {
    if (filename in cache) return cache[filename];

    const filePath = path.join(config.gisDataPath, filename);
    try {
      if (!fs.existsSync(filePath)) {
        cache[filename] = null;
        return null;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      cache[filename] = data;
      return data;
    } catch {
      cache[filename] = null;
      return null;
    }
  },

  clearCache() {
    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
  },
};
