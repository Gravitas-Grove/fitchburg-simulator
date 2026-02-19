import { ScenarioGrid } from './ScenarioGrid';
import { GrowthRateSlider } from '../controls/GrowthRateSlider';
import { DensityToggle } from '../controls/DensityToggle';
import { LayerToggles } from '../controls/LayerToggles';
import { MetricsGrid } from '../metrics/MetricsGrid';

export function ScenariosTab() {
  return (
    <div className="tab-content-enter">
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
