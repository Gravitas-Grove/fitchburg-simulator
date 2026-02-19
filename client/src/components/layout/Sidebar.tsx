import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { ScenariosTab } from '../scenarios/ScenariosTab';
import { ScorecardPanel } from '../scorecard/ScorecardPanel';
import { ComparePanel } from '../compare/ComparePanel';
import { AIPanel } from '../ai/AIPanel';
import { useMapStore } from '@/stores/mapStore';

export function Sidebar() {
  const collapsed = useMapStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);
  const activeTab = useMapStore((s) => s.activeTab);

  return (
    <aside
      className="w-[420px] flex-shrink-0 flex flex-col overflow-hidden sidebar-transition relative"
      style={{
        backgroundColor: 'hsl(213 27% 15%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
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
      <SidebarTabs />

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'scenarios' && <ScenariosTab />}
        {activeTab === 'scorecard' && <ScorecardPanel />}
        {activeTab === 'compare' && <ComparePanel />}
      </div>

      <AIPanel />
    </aside>
  );
}
