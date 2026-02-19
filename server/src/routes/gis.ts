import { Router } from 'express';
import { gisService } from '../services/gisService.js';

export const gisRouter = Router();

const ALLOWED_LAYERS = [
  // Original layers
  'wetlands', 'streams', 'usa', 'soils', 'rail', 'parcels',
  // Fitchburg ArcGIS layers
  'city_limits', 'parks', 'tid_districts', 'flood_hazard',
  'transit_priority', 'vacant_land', 'zoning', 'future_land_use',
  'building_footprints', 'sanitary_sewer', 'env_corridors',
];

const FILENAMES: Record<string, string> = {
  wetlands: 'wetlands.geojson',
  streams: 'streams.geojson',
  usa: 'urban_service_area.geojson',
  soils: 'prime_ag_soils.geojson',
  rail: 'rail.geojson',
  parcels: 'parcels.geojson',
  city_limits: 'city_limits.geojson',
  parks: 'parks.geojson',
  tid_districts: 'tid_districts.geojson',
  flood_hazard: 'flood_hazard.geojson',
  transit_priority: 'transit_priority.geojson',
  vacant_land: 'vacant_land.geojson',
  zoning: 'zoning.geojson',
  future_land_use: 'future_land_use.geojson',
  building_footprints: 'building_footprints.geojson',
  sanitary_sewer: 'sanitary_sewer.geojson',
  env_corridors: 'env_corridors.geojson',
};

gisRouter.get('/layers', (_req, res) => {
  res.json(ALLOWED_LAYERS.map(id => ({ id, filename: FILENAMES[id] })));
});

gisRouter.get('/:layer', (req, res) => {
  const { layer } = req.params;

  if (!ALLOWED_LAYERS.includes(layer)) {
    return res.status(400).json({ error: `Invalid layer: ${layer}` });
  }

  const filename = FILENAMES[layer];
  const data = gisService.getLayer(filename);

  if (!data) {
    return res.status(404).json({ error: `Layer data not available: ${layer}` });
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(data);
});
