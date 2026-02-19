import { create } from 'zustand';
import type { Scenario, DensityLevel } from '@/types/scenario';
import { SCENARIOS } from '@/data/scenarios';

interface ScenarioState {
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  growthRate: number;
  density: DensityLevel;
  setActiveScenario: (scenario: Scenario) => void;
  setGrowthRate: (rate: number) => void;
  setDensity: (density: DensityLevel) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: SCENARIOS,
  activeScenario: null,
  growthRate: 75,
  density: 'med',
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setGrowthRate: (rate) => set({ growthRate: rate }),
  setDensity: (density) => set({ density }),
}));
