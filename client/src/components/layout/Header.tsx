import { useMapStore } from '@/stores/mapStore';

export function Header() {
  const gisStatus = useMapStore((s) => s.gisStatus);
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);

  return (
    <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-fb-teal mb-0.5">
            Fitchburg, WI
          </div>
          <h1 className="font-display text-2xl font-normal leading-tight">
            Growth Simulator
          </h1>
          <div className="text-[12px] text-[#8896a7] mt-0.5">
            Comprehensive Plan Update · 2025
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill status={gisStatus} />
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1f2d3d] text-[#8896a7] hover:text-[#e8edf3] transition-all duration-200"
          title="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3L5 7L9 11" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isLoaded = status.includes('loaded') || status.includes('✓');
  return (
    <div
      className={`px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase border ${
        isLoaded
          ? 'bg-[#4ecdc4]/15 text-fb-teal border-[#4ecdc4]/25'
          : 'bg-[#151c25] text-[#8896a7] border-[rgba(255,255,255,0.06)]'
      }`}
    >
      {status}
    </div>
  );
}
