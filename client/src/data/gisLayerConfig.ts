import type { PathOptions } from 'leaflet';

export interface LayerConfig {
  id: string;
  label: string;
  description?: string;
  color: string;
  gradientTo?: string;
  defaultVisible: boolean;
  style: PathOptions;
  tooltipFn: (properties: Record<string, string>) => string;
}

export interface LayerCategory {
  id: string;
  label: string;
  layers: string[];
}

export const LAYER_CATEGORIES: LayerCategory[] = [
  {
    id: 'planning',
    label: 'Planning & Land Use',
    layers: ['zoning', 'future_land_use', 'city_limits', 'tid_districts', 'vacant_land'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    layers: ['sanitary_sewer', 'transit_priority', 'rail', 'usa'],
  },
  {
    id: 'environment',
    label: 'Environment & Hazards',
    layers: ['wetlands', 'streams', 'flood_hazard', 'env_corridors', 'soils'],
  },
  {
    id: 'context',
    label: 'Context',
    layers: ['parks', 'building_footprints', 'parcels'],
  },
];

export const GIS_LAYERS: LayerConfig[] = [
  // -- Planning & Land Use --
  {
    id: 'zoning',
    label: 'Zoning',
    description: 'Current zoning districts',
    color: '#a78bfa',
    gradientTo: '#7c3aed',
    defaultVisible: false,
    style: { color: '#7c3aed', weight: 0.8, fillColor: '#a78bfa', fillOpacity: 0.3 },
    tooltipFn: (p) => p.ZoningDescription || p.ZoningDistrict || 'Zoning District',
  },
  {
    id: 'future_land_use',
    label: 'Future Land Use',
    description: 'Comp plan land use map',
    color: '#f472b6',
    gradientTo: '#be185d',
    defaultVisible: false,
    style: { color: '#be185d', weight: 0.8, fillColor: '#f472b6', fillOpacity: 0.3 },
    tooltipFn: (p) => p.LandUse || p.GLUP || 'Future Land Use',
  },
  {
    id: 'city_limits',
    label: 'City Limits',
    description: 'Municipal boundary',
    color: '#94a3b8',
    gradientTo: '#475569',
    defaultVisible: false,
    style: { color: '#94a3b8', weight: 2.5, fillOpacity: 0, dashArray: '8,4' },
    tooltipFn: () => 'City of Fitchburg',
  },
  {
    id: 'tid_districts',
    label: 'TID Districts',
    description: 'Tax increment financing',
    color: '#fb923c',
    gradientTo: '#c2410c',
    defaultVisible: false,
    style: { color: '#c2410c', weight: 1.5, fillColor: '#fb923c', fillOpacity: 0.35 },
    tooltipFn: (p) => p.TID_Name || `TID #${p.TID_Number || ''}`,
  },
  {
    id: 'vacant_land',
    label: 'Vacant Land',
    description: 'Developable parcels',
    color: '#86efac',
    gradientTo: '#16a34a',
    defaultVisible: false,
    style: { color: '#16a34a', weight: 1, fillColor: '#86efac', fillOpacity: 0.4 },
    tooltipFn: (p) => `Vacant: ${p.PropertyAddress || 'N/A'}`,
  },

  // -- Infrastructure --
  {
    id: 'sanitary_sewer',
    label: 'Sanitary Sewer',
    description: 'Sewer main network',
    color: '#a3e635',
    gradientTo: '#4d7c0f',
    defaultVisible: false,
    style: { color: '#a3e635', weight: 1.5, opacity: 0.8 },
    tooltipFn: (p) => `Sewer: ${p.Size || 'N/A'}" ${p.MATERIAL || ''}`,
  },
  {
    id: 'transit_priority',
    label: 'Transit Priority',
    description: 'High-frequency transit zones',
    color: '#38bdf8',
    gradientTo: '#0369a1',
    defaultVisible: false,
    style: { color: '#0369a1', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.25 },
    tooltipFn: () => 'Transit Priority Area',
  },
  {
    id: 'rail',
    label: 'Rail Corridor',
    description: 'Active rail lines',
    color: '#ff6b6b',
    gradientTo: '#b91c1c',
    defaultVisible: true,
    style: { color: '#ff6b6b', weight: 2, opacity: 0.9, dashArray: '8,4' },
    tooltipFn: () => 'Rail Corridor',
  },
  {
    id: 'usa',
    label: 'Urban Service Area',
    description: 'CARPC service boundary',
    color: '#888',
    gradientTo: '#555',
    defaultVisible: true,
    style: { color: '#888', weight: 2.5, fillColor: '#222', fillOpacity: 0.15, dashArray: '6,4' },
    tooltipFn: () => 'Urban Service Area',
  },

  // -- Environment & Hazards --
  {
    id: 'wetlands',
    label: 'Wetlands',
    description: 'NWI wetland areas',
    color: '#2dd4bf',
    gradientTo: '#0f766e',
    defaultVisible: true,
    style: { color: '#0f766e', weight: 1, fillColor: '#2dd4bf', fillOpacity: 0.45 },
    tooltipFn: (p) => 'Wetland: ' + (p.WETLAND_TY || 'NWI'),
  },
  {
    id: 'streams',
    label: 'Streams',
    description: 'Waterways & creeks',
    color: '#4a90d9',
    gradientTo: '#1e40af',
    defaultVisible: true,
    style: { color: '#4a90d9', weight: 1.5, opacity: 0.8 },
    tooltipFn: (p) => p.RIVER_SYS_NAME || 'Stream',
  },
  {
    id: 'flood_hazard',
    label: 'Flood Hazard',
    description: 'FEMA flood zones',
    color: '#60a5fa',
    gradientTo: '#1d4ed8',
    defaultVisible: false,
    style: { color: '#1d4ed8', weight: 1, fillColor: '#60a5fa', fillOpacity: 0.3 },
    tooltipFn: (p) => `Flood Zone: ${p.FLD_ZONE || 'N/A'}`,
  },
  {
    id: 'env_corridors',
    label: 'Env Corridors',
    description: 'CARPC environmental corridors',
    color: '#34d399',
    gradientTo: '#047857',
    defaultVisible: false,
    style: { color: '#047857', weight: 1, fillColor: '#34d399', fillOpacity: 0.35 },
    tooltipFn: (p) => p.PRIMARY_TY || 'Environmental Corridor',
  },
  {
    id: 'soils',
    label: 'Prime Ag Soils',
    description: 'Class 1 prime farmland',
    color: '#f0c674',
    gradientTo: '#92400e',
    defaultVisible: false,
    style: { color: '#92400e', weight: 1, fillColor: '#f0c674', fillOpacity: 0.4 },
    tooltipFn: (p) => p.Farmland_P || 'Farmland Preservation',
  },

  // -- Context --
  {
    id: 'parks',
    label: 'Parks',
    description: 'City parks & rec areas',
    color: '#4ade80',
    gradientTo: '#166534',
    defaultVisible: false,
    style: { color: '#166534', weight: 1, fillColor: '#4ade80', fillOpacity: 0.35 },
    tooltipFn: (p) => p.Name || 'Park',
  },
  {
    id: 'building_footprints',
    label: 'Buildings',
    description: 'Building footprints',
    color: '#fbbf24',
    gradientTo: '#92400e',
    defaultVisible: false,
    style: { color: '#92400e', weight: 0.5, fillColor: '#fbbf24', fillOpacity: 0.25 },
    tooltipFn: () => 'Building',
  },
  {
    id: 'parcels',
    label: 'Parcels',
    description: 'Property boundaries',
    color: '#666',
    gradientTo: '#333',
    defaultVisible: false,
    style: { color: '#444', weight: 0.5, fillOpacity: 0 },
    tooltipFn: (p) => p.PropertyAddress || `Parcel: ${p.PARCELNO || 'N/A'}`,
  },
];

/** Map of GeoJSON filename per layer ID */
export const GIS_FILENAMES: Record<string, string> = {
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
