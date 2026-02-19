import { Header } from './Header';
import { ScenarioGrid } from '../scenarios/ScenarioGrid';
import { GrowthRateSlider } from '../controls/GrowthRateSlider';
import { DensityToggle } from '../controls/DensityToggle';
import { LayerToggles } from '../controls/LayerToggles';
import { MetricsGrid } from '../metrics/MetricsGrid';
import { AIPanel } from '../ai/AIPanel';
import { useMapStore } from '@/stores/mapStore';

export function Sidebar() {
  const collapsed = useMapStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);

  return (
    <aside
      className="w-[420px] flex-shrink-0 flex flex-col overflow-hidden sidebar-transition relative"
      style={{
        backgroundColor: 'hsl(213 27% 15%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-0 translate-x-full z-50 w-7 h-12 flex items-center justify-center rounded-r-md text-[#8896a7] hover:text-[#e8edf3] transition-colors"
          style={{ backgroundColor: 'hsl(213 27% 15%)', borderRight: '1px solid rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          title="Expand sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 3L9 7L5 11" />
          </svg>
        </button>
      )}

      <Header />

      <div className="flex-1 overflow-y-auto min-h-0">
        <SidebarSection label="Growth Model">
          <ScenarioGrid />
        </SidebarSection>

        <SidebarSection>
          <GrowthRateSlider />
        </SidebarSection>

        <SidebarSection label="Development Density">
          <DensityToggle />
        </SidebarSection>

        <SidebarSection label="GIS Layers">
          <LayerToggles />
        </SidebarSection>

        <SidebarSection label="Projected Impact · Through 2030">
          <MetricsGrid />
        </SidebarSection>
      </div>

      <AIPanel />
    </aside>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {label && (
        <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1.5px] uppercase mb-2.5">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
