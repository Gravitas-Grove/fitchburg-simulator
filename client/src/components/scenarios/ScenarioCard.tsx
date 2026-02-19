import { useScenarioStore } from '@/stores/scenarioStore';
import type { Scenario } from '@/types/scenario';
import { cn } from '@/lib/cn';

interface ScenarioCardProps {
  scenario: Scenario;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);
  const isActive = activeScenario?.id === scenario.id;

  return (
    <button
      onClick={() => setActiveScenario(scenario)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200',
        'border hover:bg-[#1f2d3d]',
        isActive
          ? 'border-[rgba(255,255,255,0.15)] bg-[#1f2d3d]'
          : 'border-[rgba(255,255,255,0.06)] bg-[#151c25]'
      )}
    >
      {/* Color swatch */}
      <div
        className="w-7 h-7 rounded-md flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${scenario.color}, ${scenario.color}88)`,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[12.5px] font-medium leading-tight',
              isActive ? 'text-[#e8edf3]' : 'text-[#e8edf3]'
            )}
          >
            {scenario.icon} {scenario.name}
          </span>
          {isActive && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4ecdc4]/15 text-fb-teal tracking-wide uppercase"
              style={{ animation: 'badgePop 0.2s ease-out' }}
            >
              Active
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#5a6a7d] mt-0.5 truncate">
          {scenario.sub}
        </div>
      </div>
    </button>
  );
}
