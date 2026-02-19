import type { Scenario, DensityLevel, MetricsResult } from '@/types/scenario';

export const DENSITY_MAP: Record<DensityLevel, number> = {
  low: 3,
  med: 5,
  high: 7.5,
};

/**
 * Pure function to compute projected metrics for a scenario.
 * Matches the original index.html updateMetrics() logic exactly.
 */
export function computeMetrics(
  scenario: Scenario,
  growthRate: number,
  density: DensityLevel
): MetricsResult {
  const yrs = 2030 - 2025;
  const du = DENSITY_MAP[density];
  const acres = growthRate * yrs;
  const units = Math.round(acres * du);
  const infraM = parseFloat(((acres * 68000 * scenario.infraMult) / 1e6).toFixed(1));
  const agLand = Math.round(scenario.agAcres * (growthRate / 75));

  return { acres, units, infraM, agLand };
}
