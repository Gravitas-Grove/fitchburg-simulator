import { useMemo } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { computeMetrics } from '@/data/metrics';
import type { MetricsResult } from '@/types/scenario';

export function useMetrics(): MetricsResult | null {
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const growthRate = useScenarioStore((s) => s.growthRate);
  const density = useScenarioStore((s) => s.density);

  return useMemo(() => {
    if (!activeScenario) return null;
    return computeMetrics(activeScenario, growthRate, density);
  }, [activeScenario, growthRate, density]);
}
