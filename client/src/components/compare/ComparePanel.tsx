import { useScenarioStore } from '@/stores/scenarioStore';
import { ScenarioRadarChart } from './ScenarioRadarChart';
import { ScenarioToggleList } from './ScenarioToggleList';

export function ComparePanel() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const comparedIds = useScenarioStore((s) => s.comparedScenarioIds);

  const comparedScenarios = scenarios.filter((s) => comparedIds.has(s.id));

  return (
    <div className="px-4 py-4 space-y-4 tab-content-enter">
      <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1.5px] uppercase">
        Scenario Comparison
      </div>

      <ScenarioRadarChart scenarios={comparedScenarios} />
      <ScenarioToggleList />
    </div>
  );
}
