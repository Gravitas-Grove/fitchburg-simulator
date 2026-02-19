import type { SpatialProfile } from './scorecard';

export type DensityLevel = 'low' | 'med' | 'high';

export type AgImpact = 'none' | 'very low' | 'low' | 'medium-low' | 'medium' | 'high';

export interface Scenario {
  id: string;
  name: string;
  sub: string;
  color: string;
  icon: string;
  poly2030: [number, number][];
  poly2060: [number, number][];
  infraMult: number;
  agAcres: number;
  agImpact: AgImpact;
  description: string;
  spatialProfile?: SpatialProfile | null;
}

export interface MetricsResult {
  acres: number;
  units: number;
  infraM: number;
  agLand: number;
}
