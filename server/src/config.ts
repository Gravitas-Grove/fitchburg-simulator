import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'fitchburg.db'),
  gisDataPath: process.env.GIS_DATA_PATH || path.resolve(__dirname, '..', '..', 'data', 'processed'),
  clientDistPath: path.resolve(__dirname, '..', '..', 'client', 'dist'),
  isDev: process.env.NODE_ENV !== 'production',
};
