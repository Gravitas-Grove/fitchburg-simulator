import * as turf from '@turf/turf';
import { gisService } from './gisService.js';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, LineString, MultiLineString, Point } from 'geojson';

// ── Types ──

export interface ScenarioParcel {
  parcelNo: string;
  address: string;
  owner: string;
  schoolDistrict: string;
  areaAcres: number;
  landValue: number | null;
  coordinates: number[][][];
  centroid: [number, number];
  priorityScore: number;
  developYear: number;
  scenarioReason: string;
}

interface ParcelFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    PARCELNO?: string;
    PropertyAddress?: string;
    Owner?: string;
    SchoolDistrict?: string;
    Shape__Area?: number;
    Assessed_Acres?: number;
    Sum_LandValue?: number;
    Sum_ImprovementValue?: number;
    [key: string]: unknown;
  };
}

type ScenarioId = 'fuda-lateral' | 'concentric' | 'rail-corridor' | 'utility-service' | 'ag-preservation' | 'infill' | 'resource-based';

// ── GIS Data Loader ──

interface GISData {
  parcels: FeatureCollection;
  vacantLand: FeatureCollection;
  urbanServiceArea: FeatureCollection;
  sanitarySewer: FeatureCollection;
  primeAgSoils: FeatureCollection;
  rail: FeatureCollection;
  transitPriority: FeatureCollection;
  wetlands: FeatureCollection;
  floodHazard: FeatureCollection;
  envCorridors: FeatureCollection;
  futureLandUse: FeatureCollection;
  cityLimits: FeatureCollection;
  streams: FeatureCollection;
}

function loadGISData(): GISData | null {
  const layers: Record<string, string> = {
    parcels: 'parcels.geojson',
    vacantLand: 'vacant_land.geojson',
    urbanServiceArea: 'urban_service_area.geojson',
    sanitarySewer: 'sanitary_sewer.geojson',
    primeAgSoils: 'prime_ag_soils.geojson',
    rail: 'rail.geojson',
    transitPriority: 'transit_priority.geojson',
    wetlands: 'wetlands.geojson',
    floodHazard: 'flood_hazard.geojson',
    envCorridors: 'env_corridors.geojson',
    futureLandUse: 'future_land_use.geojson',
    cityLimits: 'city_limits.geojson',
    streams: 'streams.geojson',
  };

  const data: Record<string, FeatureCollection> = {};
  const missing: string[] = [];

  for (const [key, filename] of Object.entries(layers)) {
    const layer = gisService.getLayer(filename) as FeatureCollection | null;
    if (!layer) {
      missing.push(filename);
    } else {
      data[key] = layer;
    }
  }

  // parcels and urbanServiceArea are required; others can degrade gracefully
  if (!data.parcels || !data.urbanServiceArea) {
    console.log(`[spatial] Missing critical GIS data (${missing.join(', ')}). Falling back to procedural.`);
    return null;
  }

  if (missing.length > 0) {
    console.log(`[spatial] Warning: Missing optional layers: ${missing.join(', ')}`);
  }

  return data as unknown as GISData;
}

// ── Geometry Helpers ──

function getUnionPolygon(fc: FeatureCollection): Feature<Polygon | MultiPolygon> | null {
  try {
    const polys = fc.features.filter(
      (f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );
    if (polys.length === 0) return null;
    if (polys.length === 1) return polys[0] as Feature<Polygon | MultiPolygon>;

    let result = polys[0] as Feature<Polygon | MultiPolygon>;
    for (let i = 1; i < polys.length; i++) {
      try {
        const u = turf.union(
          turf.featureCollection([result, polys[i] as Feature<Polygon | MultiPolygon>])
        );
        if (u) result = u;
      } catch {
        // skip problematic geometries
      }
    }
    return result;
  } catch {
    return null;
  }
}

function getBufferedLines(fc: FeatureCollection, distanceKm: number): Feature<Polygon | MultiPolygon> | null {
  try {
    const buffered: Feature<Polygon | MultiPolygon>[] = [];
    for (const f of fc.features) {
      if (!f.geometry) continue;
      try {
        const b = turf.buffer(f, distanceKm, { units: 'kilometers' });
        if (b) buffered.push(b as Feature<Polygon | MultiPolygon>);
      } catch {
        // skip
      }
    }
    if (buffered.length === 0) return null;

    let result = buffered[0];
    for (let i = 1; i < buffered.length; i++) {
      try {
        const u = turf.union(turf.featureCollection([result, buffered[i]]));
        if (u) result = u;
      } catch {
        // skip
      }
    }
    return result;
  } catch {
    return null;
  }
}

function featureIntersects(
  parcel: Feature<Polygon | MultiPolygon>,
  zone: Feature<Polygon | MultiPolygon> | null
): boolean {
  if (!zone) return false;
  try {
    return turf.booleanIntersects(parcel, zone);
  } catch {
    return false;
  }
}

// Fast spatial index: precompute bounding boxes for a feature set
interface SpatialIndex {
  features: Feature<Polygon | MultiPolygon>[];
  bboxes: [number, number, number, number][]; // [minX, minY, maxX, maxY]
}

function buildSpatialIndex(features: Feature<Polygon | MultiPolygon>[]): SpatialIndex {
  const bboxes = features.map((f) => {
    try {
      return turf.bbox(f) as [number, number, number, number];
    } catch {
      return [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number];
    }
  });
  return { features, bboxes };
}

// Check if a parcel centroid falls inside ANY feature (centroid-based, much faster than polygon intersection)
function centroidInAnyFeature(
  centroid: Feature<Point>,
  index: SpatialIndex
): boolean {
  const [cx, cy] = centroid.geometry.coordinates;
  for (let i = 0; i < index.features.length; i++) {
    const [minX, minY, maxX, maxY] = index.bboxes[i];
    // Fast bbox rejection
    if (cx < minX || cx > maxX || cy < minY || cy > maxY) continue;
    try {
      if (turf.booleanPointInPolygon(centroid, index.features[i])) return true;
    } catch {
      // skip bad geometries
    }
  }
  return false;
}

// Check if a parcel intersects ANY feature in a list (avoids bad union geometry)
function intersectsAnyFeature(
  parcel: Feature<Polygon | MultiPolygon>,
  features: Feature<Polygon | MultiPolygon>[]
): boolean {
  for (const f of features) {
    try {
      if (turf.booleanIntersects(parcel, f)) return true;
    } catch {
      // skip bad geometries
    }
  }
  return false;
}

function distanceToLine(
  point: Feature<Point>,
  line: Feature<LineString | MultiLineString>
): number {
  if (line.geometry.type === 'MultiLineString') {
    let minDist = Infinity;
    for (const coords of line.geometry.coordinates) {
      const segment = turf.lineString(coords);
      const d = turf.pointToLineDistance(point, segment, { units: 'kilometers' });
      if (d < minDist) minDist = d;
    }
    return minDist;
  }
  return turf.pointToLineDistance(point, line as Feature<LineString>, { units: 'kilometers' });
}

function distanceToFeature(
  point: Feature<Point>,
  target: Feature<Polygon | MultiPolygon | LineString | MultiLineString>
): number {
  try {
    if (target.geometry.type === 'LineString' || target.geometry.type === 'MultiLineString') {
      return distanceToLine(point, target as Feature<LineString | MultiLineString>);
    }
    // For polygons, convert boundary to line and measure distance
    const boundary = turf.polygonToLine(target as Feature<Polygon | MultiPolygon>);
    if (boundary.type === 'FeatureCollection') {
      let minDist = Infinity;
      for (const line of boundary.features) {
        const d = distanceToLine(point, line as Feature<LineString | MultiLineString>);
        if (d < minDist) minDist = d;
      }
      return minDist;
    }
    return distanceToLine(point, boundary as Feature<LineString | MultiLineString>);
  } catch {
    return Infinity;
  }
}

function getParcelCentroid(parcel: Feature<Polygon | MultiPolygon>): Feature<Point> {
  try {
    return turf.centroid(parcel);
  } catch {
    // Fallback: use first coordinate
    const coords = parcel.geometry.type === 'MultiPolygon'
      ? parcel.geometry.coordinates[0][0][0]
      : parcel.geometry.coordinates[0][0];
    return turf.point(coords);
  }
}

function getParcelAcres(parcel: ParcelFeature): number {
  if (parcel.properties.Assessed_Acres && parcel.properties.Assessed_Acres > 0) {
    return parcel.properties.Assessed_Acres;
  }
  if (parcel.properties.Shape__Area && parcel.properties.Shape__Area > 0) {
    // Shape__Area is in square feet for Dane County data
    return parcel.properties.Shape__Area / 43560;
  }
  try {
    const areaSqM = turf.area(parcel);
    return areaSqM / 4046.86;
  } catch {
    return 0;
  }
}

function simplifyCoords(parcel: Feature<Polygon | MultiPolygon>): number[][][] {
  try {
    const simplified = turf.simplify(parcel, { tolerance: 0.0001, highQuality: false });
    if (simplified.geometry.type === 'MultiPolygon') {
      // Return just the largest polygon ring
      return simplified.geometry.coordinates[0];
    }
    return simplified.geometry.coordinates;
  } catch {
    if (parcel.geometry.type === 'MultiPolygon') {
      return parcel.geometry.coordinates[0];
    }
    return parcel.geometry.coordinates;
  }
}

// ── Parcel Filtering ──

function isValidParcel(f: Feature): f is ParcelFeature {
  return (
    f.geometry !== null &&
    (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
    f.properties !== null
  );
}

function buildExclusionFeatures(gis: GISData): Feature<Polygon | MultiPolygon>[] {
  // Collect individual wetland + flood hazard features (don't union — turf.union can produce bad geometry)
  const features: Feature<Polygon | MultiPolygon>[] = [];

  if (gis.wetlands) {
    for (const f of gis.wetlands.features) {
      if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
        features.push(f as Feature<Polygon | MultiPolygon>);
      }
    }
  }

  if (gis.floodHazard) {
    for (const f of gis.floodHazard.features) {
      if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
        // Only include actual flood hazard zones (A, AE, AH, AO, V, VE)
        // Zone X = minimal flood hazard — should NOT be excluded
        const zone = String(f.properties?.FLD_ZONE || '').toUpperCase();
        if (zone === 'X' || zone.startsWith('X')) continue;
        features.push(f as Feature<Polygon | MultiPolygon>);
      }
    }
  }

  return features;
}

// ── Scenario-Specific Selection Logic ──

function selectFudaLateral(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  const usaFeature = gis.urbanServiceArea.features[0] as Feature<Polygon | MultiPolygon> | undefined;
  const cityLimitFeature = gis.cityLimits?.features[0] as Feature<Polygon | MultiPolygon> | undefined;
  const exclusionIdx = buildSpatialIndex(buildExclusionFeatures(gis));
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  // Build future land use exclusion (parks)
  const parkZones: Feature<Polygon | MultiPolygon>[] = [];
  if (gis.futureLandUse) {
    for (const f of gis.futureLandUse.features) {
      if (f.properties?.GLUP === 'PARK' && f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
        parkZones.push(f as Feature<Polygon | MultiPolygon>);
      }
    }
  }
  const parkIdx = buildSpatialIndex(parkZones);

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.25) continue;

    const centroid = getParcelCentroid(f);

    // Must be outside USA (centroid check for speed)
    if (usaFeature) {
      try {
        if (turf.booleanPointInPolygon(centroid, usaFeature)) continue;
      } catch { /* skip */ }
    }
    // Must be inside city limits (if available)
    if (cityLimitFeature) {
      try {
        if (!turf.booleanPointInPolygon(centroid, cityLimitFeature)) continue;
      } catch { /* skip */ }
    }
    // Exclude wetland/flood
    if (centroidInAnyFeature(centroid, exclusionIdx)) continue;
    // Exclude parks
    if (centroidInAnyFeature(centroid, parkIdx)) continue;

    // Priority = distance from USA edge (closer = higher priority)
    const dist = usaFeature ? distanceToFeature(centroid, usaFeature) : 10;
    const score = Math.max(0, 100 - dist * 20);

    const distMi = (dist * 0.621371).toFixed(1);
    results.push({
      parcel: f,
      score,
      reason: `${distMi}mi from Urban Service Area edge`,
    });
  }

  return results;
}

function selectConcentric(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  const centerPoint = turf.point([-89.520, 43.003]); // Fish Hatchery & Lacy
  const exclusionIdx = buildSpatialIndex(buildExclusionFeatures(gis));
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.25) continue;

    const centroid = getParcelCentroid(f);

    // Fast distance check first (cheapest filter)
    const dist = turf.distance(centroid, centerPoint, { units: 'kilometers' });
    if (dist > 8) continue;

    // Exclude wetland/flood
    if (centroidInAnyFeature(centroid, exclusionIdx)) continue;

    const score = Math.max(0, 100 - dist * 12.5);
    const distMi = (dist * 0.621371).toFixed(1);
    results.push({
      parcel: f,
      score,
      reason: `${distMi}mi from Fish Hatchery/Lacy center`,
    });
  }

  return results;
}

function selectRailCorridor(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  const exclusionIdx = buildSpatialIndex(buildExclusionFeatures(gis));
  const transitIdx = buildSpatialIndex(
    gis.transitPriority
      ? gis.transitPriority.features.filter(
          (f): f is Feature<Polygon | MultiPolygon> =>
            f.geometry !== null && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        )
      : []
  );
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  if (!gis.rail || gis.rail.features.length === 0) {
    console.log('[spatial] No rail data for rail-corridor scenario');
    return results;
  }

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.1) continue;

    const centroid = getParcelCentroid(f);

    // Distance to nearest rail feature
    let minRailDist = Infinity;
    for (const rf of gis.rail.features) {
      if (!rf.geometry) continue;
      const d = distanceToFeature(centroid, rf as Feature<LineString | MultiLineString>);
      if (d < minRailDist) minRailDist = d;
    }

    // Must be within ~1 mile (1.6km) of rail
    if (minRailDist > 1.6) continue;

    // Exclude wetland/flood
    if (centroidInAnyFeature(centroid, exclusionIdx)) continue;

    let score = Math.max(0, 100 - minRailDist * 62.5);

    // Transit priority zone bonus
    if (centroidInAnyFeature(centroid, transitIdx)) score = Math.min(100, score + 15);

    const distMi = (minRailDist * 0.621371).toFixed(2);
    const transitNote = centroidInAnyFeature(centroid, transitIdx) ? ', transit priority zone' : '';
    results.push({
      parcel: f,
      score,
      reason: `${distMi}mi from rail${transitNote}`,
    });
  }

  return results;
}

function selectUtilityService(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  // Collect gravity sewer segments
  const gravitySegments: Feature[] = [];
  if (gis.sanitarySewer) {
    for (const f of gis.sanitarySewer.features) {
      if (f.properties?.FlowType === 'Gravity' && f.geometry) {
        gravitySegments.push(f);
      }
    }
  }

  const sewerFeatures = gravitySegments.length > 0 ? gravitySegments : (gis.sanitarySewer?.features || []);
  const exclusionIdx = buildSpatialIndex(buildExclusionFeatures(gis));
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  if (sewerFeatures.length === 0) {
    console.log('[spatial] No sewer data for utility-service scenario');
    return results;
  }

  console.log(`[spatial]   utility-service: ${sewerFeatures.length} sewer segments`);

  // Pre-build a bounding box around all sewer features for fast rejection
  const allSewerFC = { type: 'FeatureCollection' as const, features: sewerFeatures };
  const sewerBbox = turf.bbox(allSewerFC);
  const sewerPadding = 0.005; // ~0.5km padding in degrees

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.25) continue;

    const centroid = getParcelCentroid(f);
    const [cx, cy] = centroid.geometry.coordinates;

    // Fast bbox rejection - skip parcels far from any sewer
    if (cx < sewerBbox[0] - sewerPadding || cx > sewerBbox[2] + sewerPadding ||
        cy < sewerBbox[1] - sewerPadding || cy > sewerBbox[3] + sewerPadding) continue;

    // Distance to nearest gravity sewer
    let minDist = Infinity;
    let bestSlope = 0;
    for (const sf of sewerFeatures) {
      if (!sf.geometry) continue;
      const d = distanceToFeature(centroid, sf as Feature<LineString | MultiLineString>);
      if (d < minDist) {
        minDist = d;
        bestSlope = typeof sf.properties?.SLOPE === 'number' ? sf.properties.SLOPE : 0;
      }
    }

    // Must be within 500m of gravity sewer
    if (minDist > 0.5) continue;

    // Exclude wetland/flood
    if (centroidInAnyFeature(centroid, exclusionIdx)) continue;

    let score = Math.max(0, 100 - minDist * 200);
    if (bestSlope > 0.5) score = Math.min(100, score + 10);

    const distFt = Math.round(minDist * 3280.84);
    const slopeNote = bestSlope > 0 ? `, ${bestSlope.toFixed(1)}% slope` : '';
    results.push({
      parcel: f,
      score,
      reason: `${distFt}ft from gravity sewer${slopeNote}`,
    });
  }

  return results;
}

function selectAgPreservation(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  // Build farmland preservation overlay
  const preservedAgPolys: Feature<Polygon | MultiPolygon>[] = [];
  if (gis.primeAgSoils) {
    for (const f of gis.primeAgSoils.features) {
      const farmlandP = String(f.properties?.Farmland_P || '');
      // Match exactly "Farmland Preservation" — NOT "Not Farmland Preservation"
      if (farmlandP === 'Farmland Preservation' && f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
        preservedAgPolys.push(f as Feature<Polygon | MultiPolygon>);
      }
    }
  }
  console.log(`[spatial] ag-preservation: found ${preservedAgPolys.length} farmland preservation features`);

  const usaFeature = gis.urbanServiceArea.features[0] as Feature<Polygon | MultiPolygon> | undefined;
  const exclusionIdx = buildSpatialIndex(buildExclusionFeatures(gis));
  const preservedIdx = buildSpatialIndex(preservedAgPolys);
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.25) continue;

    const centroid = getParcelCentroid(f);

    if (centroidInAnyFeature(centroid, exclusionIdx)) continue;

    // Check if parcel centroid falls in farmland preservation
    const overlapsFarmland = centroidInAnyFeature(centroid, preservedIdx);

    const distToUSA = usaFeature ? distanceToFeature(centroid, usaFeature) : 5;
    const distMi = (distToUSA * 0.621371).toFixed(1);

    if (overlapsFarmland) {
      results.push({
        parcel: f,
        score: Math.max(0, 30 - distToUSA * 10),
        reason: `Overlaps farmland preservation, ${distMi}mi from USA (deprioritized)`,
      });
    } else {
      results.push({
        parcel: f,
        score: Math.max(0, 100 - distToUSA * 15),
        reason: `Non-preserved soil, ${distMi}mi from USA`,
      });
    }
  }

  return results;
}

function selectInfill(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  const usaFeature = gis.urbanServiceArea.features[0] as Feature<Polygon | MultiPolygon> | undefined;
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  // Use vacant_land.geojson — only parcels inside USA
  const source = gis.vacantLand || gis.parcels;

  for (const f of source.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.1) continue;

    // Must be inside USA
    if (usaFeature && !featureIntersects(f, usaFeature)) continue;

    const score = Math.min(100, acres * 10);

    results.push({
      parcel: f,
      score,
      reason: `Vacant ${acres.toFixed(1)}ac inside Urban Service Area`,
    });
  }

  return results;
}

function selectResourceBased(gis: GISData): { parcel: ParcelFeature; score: number; reason: string }[] {
  const envCorridorIdx = buildSpatialIndex(
    gis.envCorridors
      ? gis.envCorridors.features.filter(
          (f): f is Feature<Polygon | MultiPolygon> =>
            f.geometry !== null && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        )
      : []
  );
  const wetlandIdx = buildSpatialIndex(
    gis.wetlands
      ? gis.wetlands.features.filter(
          (f): f is Feature<Polygon | MultiPolygon> =>
            f.geometry !== null && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        )
      : []
  );
  const floodIdx = buildSpatialIndex(
    gis.floodHazard
      ? gis.floodHazard.features.filter(
          (f): f is Feature<Polygon | MultiPolygon> => {
            if (!f.geometry || (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon')) return false;
            const zone = String(f.properties?.FLD_ZONE || '').toUpperCase();
            return !zone.startsWith('X'); // Exclude Zone X (minimal flood hazard)
          }
        )
      : []
  );

  // Buffer streams by 75ft (~23m = 0.023km)
  const streamBuffer = gis.streams ? getBufferedLines(gis.streams, 0.023) : null;

  const usaFeature = gis.urbanServiceArea.features[0] as Feature<Polygon | MultiPolygon> | undefined;
  const results: { parcel: ParcelFeature; score: number; reason: string }[] = [];

  for (const f of gis.parcels.features) {
    if (!isValidParcel(f)) continue;
    const acres = getParcelAcres(f);
    if (acres < 0.25) continue;

    const centroid = getParcelCentroid(f);

    // Exclude parcels in env corridors, wetlands, or flood hazard
    if (centroidInAnyFeature(centroid, envCorridorIdx)) continue;
    if (centroidInAnyFeature(centroid, wetlandIdx)) continue;
    if (centroidInAnyFeature(centroid, floodIdx)) continue;

    let envScore = 100;
    const issues: string[] = [];

    if (streamBuffer && featureIntersects(f, streamBuffer)) {
      envScore -= 40;
      issues.push('near stream');
    }

    const distToUSA = usaFeature ? distanceToFeature(centroid, usaFeature) : 5;

    const score = Math.max(0, envScore - distToUSA * 10);
    const distMi = (distToUSA * 0.621371).toFixed(1);
    const issueNote = issues.length > 0 ? ` (${issues.join(', ')})` : '';
    results.push({
      parcel: f,
      score,
      reason: `Clear of env corridors/wetlands/flood${issueNote}, ${distMi}mi from USA`,
    });
  }

  return results;
}

// ── Year Assignment ──

function assignDevelopmentYears(
  parcels: { parcel: ParcelFeature; score: number; reason: string }[],
  growthRateAcPerYr: number,
  maxParcels: number = 800
): ScenarioParcel[] {
  // Sort by priority (highest first)
  const sorted = [...parcels].sort((a, b) => b.score - a.score);

  // Limit to top N parcels to keep DB reasonable
  const limited = sorted.slice(0, maxParcels);

  let cumulativeAcres = 0;
  const results: ScenarioParcel[] = [];

  for (const { parcel, score, reason } of limited) {
    const acres = getParcelAcres(parcel);
    cumulativeAcres += acres;

    const year = Math.min(2060, 2025 + Math.ceil(cumulativeAcres / growthRateAcPerYr));
    const centroid = getParcelCentroid(parcel);
    const centroidCoords = centroid.geometry.coordinates as [number, number];

    results.push({
      parcelNo: parcel.properties.PARCELNO || `unknown-${results.length}`,
      address: parcel.properties.PropertyAddress || 'Unknown address',
      owner: parcel.properties.Owner || 'Unknown',
      schoolDistrict: parcel.properties.SchoolDistrict || 'Fitchburg',
      areaAcres: parseFloat(acres.toFixed(2)),
      landValue: parcel.properties.Sum_LandValue ?? null,
      coordinates: simplifyCoords(parcel),
      centroid: centroidCoords,
      priorityScore: parseFloat(score.toFixed(1)),
      developYear: year,
      scenarioReason: reason,
    });
  }

  return results;
}

// ── Main Entry Point ──

const SCENARIO_SELECTORS: Record<ScenarioId, (gis: GISData) => { parcel: ParcelFeature; score: number; reason: string }[]> = {
  'fuda-lateral': selectFudaLateral,
  'concentric': selectConcentric,
  'rail-corridor': selectRailCorridor,
  'utility-service': selectUtilityService,
  'ag-preservation': selectAgPreservation,
  'infill': selectInfill,
  'resource-based': selectResourceBased,
};

export async function runSpatialAnalysis(
  growthRate: number = 75 // acres per year default
): Promise<Map<string, ScenarioParcel[]> | null> {
  console.log('[spatial] Loading GIS data...');
  const gis = loadGISData();

  if (!gis) {
    console.log('[spatial] GIS data unavailable. Spatial analysis skipped.');
    return null;
  }

  console.log(`[spatial] Loaded GIS data: ${gis.parcels.features.length} parcels`);

  const results = new Map<string, ScenarioParcel[]>();

  for (const [scenarioId, selector] of Object.entries(SCENARIO_SELECTORS)) {
    console.log(`[spatial] Processing ${scenarioId}...`);
    const startTime = Date.now();

    try {
      const candidates = selector(gis);
      console.log(`[spatial]   ${scenarioId}: ${candidates.length} candidate parcels found`);

      const assigned = assignDevelopmentYears(candidates, growthRate);
      results.set(scenarioId, assigned);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[spatial]   ${scenarioId}: ${assigned.length} parcels assigned (${elapsed}s)`);
    } catch (err) {
      console.error(`[spatial] Error processing ${scenarioId}:`, err);
      results.set(scenarioId, []);
    }
  }

  // Clear GIS cache to free memory
  gisService.clearCache();

  return results;
}

// Compute convex hull boundary from scenario parcels (for map outline)
export function computeScenarioBoundary(
  parcels: ScenarioParcel[],
  maxYear: number
): [number, number][] {
  const points: [number, number][] = [];
  for (const p of parcels) {
    if (p.developYear <= maxYear) {
      points.push(p.centroid);
    }
  }

  if (points.length < 3) return points;

  try {
    const fc = turf.featureCollection(points.map((c) => turf.point(c)));
    const hull = turf.convex(fc);
    if (hull) {
      return hull.geometry.coordinates[0] as [number, number][];
    }
  } catch {
    // fallback
  }

  return points;
}
