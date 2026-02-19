import { create } from 'zustand';
import type { Scenario, DensityLevel } from '@/types/scenario';
import { SCENARIOS } from '@/data/scenarios';

interface ScenarioState {
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  growthRate: number;
  density: DensityLevel;
  comparedScenarioIds: Set<string>;
  setActiveScenario: (scenario: Scenario) => void;
  setGrowthRate: (rate: number) => void;
  setDensity: (density: DensityLevel) => void;
  toggleComparison: (id: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: SCENARIOS,
  activeScenario: null,
  growthRate: 75,
  density: 'med',
  comparedScenarioIds: new Set(SCENARIOS.map((s) => s.id)),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setGrowthRate: (rate) => set({ growthRate: rate }),
  setDensity: (density) => set({ density }),
  toggleComparison: (id) =>
    set((state) => {
      const next = new Set(state.comparedScenarioIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { comparedScenarioIds: next };
    }),
}));
