import { useScenarioStore } from '@/stores/scenarioStore';
import { ScenarioCard } from './ScenarioCard';

export function ScenarioGrid() {
  const scenarios = useScenarioStore((s) => s.scenarios);

  return (
    <div className="flex flex-col gap-1.5">
      {scenarios.map((scenario) => (
        <ScenarioCard key={scenario.id} scenario={scenario} />
      ))}
    </div>
  );
}
