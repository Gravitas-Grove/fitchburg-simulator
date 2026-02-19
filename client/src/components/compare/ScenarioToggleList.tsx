import { useScenarioStore } from '@/stores/scenarioStore';

export function ScenarioToggleList() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const comparedIds = useScenarioStore((s) => s.comparedScenarioIds);
  const toggleComparison = useScenarioStore((s) => s.toggleComparison);

  return (
    <div className="space-y-1">
      <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1.5px] uppercase mb-2">
        Toggle Scenarios
      </div>
      {scenarios.map((scenario) => {
        const checked = comparedIds.has(scenario.id);
        return (
          <button
            key={scenario.id}
            onClick={() => toggleComparison(scenario.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              checked ? 'bg-[rgba(255,255,255,0.03)]' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0 transition-all duration-150"
              style={{
                backgroundColor: checked ? scenario.color : 'transparent',
                border: `2px solid ${checked ? scenario.color : 'rgba(255,255,255,0.15)'}`,
              }}
            />
            <span className="text-[11px] text-[#e8edf3]">{scenario.name}</span>
          </button>
        );
      })}
    </div>
  );
}
