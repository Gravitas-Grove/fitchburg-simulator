import { useMapStore, type SidebarTab } from '@/stores/mapStore';
import { LayoutGrid, BarChart3, Radar } from 'lucide-react';

const TABS: { id: SidebarTab; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'scenarios', label: 'Scenarios', Icon: LayoutGrid },
  { id: 'scorecard', label: 'Scorecard', Icon: BarChart3 },
  { id: 'compare', label: 'Compare', Icon: Radar },
];

export function SidebarTabs() {
  const activeTab = useMapStore((s) => s.activeTab);
  const setActiveTab = useMapStore((s) => s.setActiveTab);

  return (
    <div
      className="flex flex-shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-all duration-200 relative ${
            activeTab === id
              ? 'text-[#4ecdc4]'
              : 'text-[#5a6a7d] hover:text-[#8896a7]'
          }`}
        >
          <Icon size={13} />
          {label}
          {activeTab === id && (
            <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#4ecdc4] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
