import type { Scenario, DensityLevel } from '@/types/scenario';
import { computeScorecard } from './scorecard';
import type { DimensionId } from '@/types/scorecard';

export interface RadarDataPoint {
  axis: string;
  axisId: DimensionId;
  fullMark: 100;
  [scenarioId: string]: number | string;
}

const AXES: { id: DimensionId; label: string }[] = [
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'social', label: 'Housing' },
  { id: 'transportation', label: 'Transport' },
];

export function computeRadarData(
  scenarios: Scenario[],
  growthRate: number,
  density: DensityLevel
): RadarDataPoint[] {
  return AXES.map(({ id, label }) => {
    const point: RadarDataPoint = { axis: label, axisId: id, fullMark: 100 };

    for (const scenario of scenarios) {
      const scorecard = computeScorecard(scenario, growthRate, density);
      const dim = scorecard.dimensions.find((d) => d.id === id);
      point[scenario.id] = dim ? Math.round(dim.score) : 0;
    }

    return point;
  });
}
