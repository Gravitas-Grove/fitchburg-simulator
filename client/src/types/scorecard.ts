export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type DimensionId = 'fiscal' | 'environmental' | 'social' | 'transportation';

export interface ScorecardMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  formatted: string;
}

export interface ScorecardDimension {
  id: DimensionId;
  label: string;
  icon: string;
  grade: Grade;
  score: number; // 0-100
  metrics: ScorecardMetric[];
  summary: string;
}

export interface ScorecardResult {
  dimensions: ScorecardDimension[];
  overallGrade: Grade;
  overallScore: number;
}

export interface SpatialProfile {
  wetlandOverlapAcres: number;
  floodplainOverlapAcres: number;
  streamBufferViolationCount: number;
  gravitySeweredPct: number;
  transitProximityPct: number;
  primeAgOverlapAcres: number;
  vacantLandAcres: number;
  totalDevelopableAcres: number;
  avgLandValuePerAcre: number;
  envCorridorOverlapAcres: number;
  soilClass1And2Pct: number;
  infiltrationHighPct: number;
}
