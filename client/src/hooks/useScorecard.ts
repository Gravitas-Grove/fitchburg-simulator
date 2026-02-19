import { useMemo } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useMapStore } from '@/stores/mapStore';
import { computeScorecard } from '@/data/scorecard';
import type { ScorecardResult } from '@/types/scorecard';

export function useScorecard(): ScorecardResult | null {
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const growthRate = useScenarioStore((s) => s.growthRate);
  const density = useScenarioStore((s) => s.density);
  const currentYear = useMapStore((s) => s.currentYear);

  return useMemo(() => {
    if (!activeScenario) return null;
    return computeScorecard(activeScenario, growthRate, density, currentYear);
  }, [activeScenario, growthRate, density, currentYear]);
}
