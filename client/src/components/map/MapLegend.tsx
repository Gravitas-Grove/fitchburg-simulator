import { useScenarioStore } from '@/stores/scenarioStore';
import { useMapStore } from '@/stores/mapStore';

export function MapLegend() {
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const sidebarCollapsed = useMapStore((s) => s.sidebarCollapsed);

  if (!activeScenario) return null;

  return (
    <div
      className="fixed bottom-6 z-[1000]"
      style={{
        left: sidebarCollapsed ? 32 : 444,
        transition: 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
        style={{
          background: 'rgba(12, 17, 23, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="font-mono text-[9px] text-[#5a6a7d] tracking-[1px] uppercase">
          Active
        </span>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-3 rounded-sm transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, ${activeScenario.color}88, ${activeScenario.color})`,
            }}
          />
          <span className="text-[11px] font-medium text-[#e8edf3]">
            {activeScenario.icon} {activeScenario.name}
          </span>
        </div>
        <span className="text-[10px] text-[#5a6a7d]">
          2030 / 2060
        </span>
      </div>
    </div>
  );
}
