import { useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useParcelStore } from '@/stores/parcelStore';

export function TimelineSlider() {
  const currentYear = useMapStore((s) => s.currentYear);
  const isPlaying = useMapStore((s) => s.isPlaying);
  const playSpeed = useMapStore((s) => s.playSpeed);
  const setCurrentYear = useMapStore((s) => s.setCurrentYear);
  const togglePlay = useMapStore((s) => s.togglePlay);
  const setPlaySpeed = useMapStore((s) => s.setPlaySpeed);
  const parcels = useParcelStore((s) => s.parcels);
  const timerRef = useRef<number | null>(null);

  // Auto-advance when playing — must be before any conditional returns
  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = window.setInterval(() => {
      useMapStore.setState((state) => {
        const next = state.currentYear + 1;
        if (next > 2060) {
          return { isPlaying: false, currentYear: 2060 };
        }
        return { currentYear: next };
      });
    }, 500 / playSpeed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playSpeed]);

  // Don't show if no parcels loaded
  if (parcels.length === 0) return null;

  // Count developed parcels at current year
  const developedCount = parcels.filter((p) => p.developYear <= currentYear).length;
  const totalCount = parcels.length;

  const pct = ((currentYear - 2025) / 35) * 100;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
      <div className="bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-2xl min-w-[420px]">
        {/* Year display */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {currentYear}
            </span>
            <span className="text-[11px] text-[#5a6a7d] font-mono">
              {developedCount}/{totalCount} parcels
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Speed control */}
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  playSpeed === speed
                    ? 'bg-fb-teal/20 text-fb-teal'
                    : 'text-[#5a6a7d] hover:text-[#8a9ab0]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="relative mb-2">
          <input
            type="range"
            min={2025}
            max={2060}
            step={1}
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer timeline-slider"
            style={{
              background: `linear-gradient(to right, var(--color-fb-teal) 0%, var(--color-fb-teal) ${pct}%, #1e2836 ${pct}%, #1e2836 100%)`,
            }}
          />
          {/* Year markers */}
          <div className="flex justify-between mt-1 px-0.5">
            {[2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060].map((yr) => (
              <span
                key={yr}
                className={`text-[9px] font-mono cursor-pointer transition-colors ${
                  yr <= currentYear ? 'text-fb-teal/70' : 'text-[#3a4a5d]'
                }`}
                onClick={() => setCurrentYear(yr)}
              >
                {yr === 2025 ? "'25" : yr === 2060 ? "'60" : `'${yr.toString().slice(2)}`}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentYear(2025)}
            className="text-[#5a6a7d] hover:text-white transition-colors p-1"
            title="Reset to 2025"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="bg-fb-teal/20 hover:bg-fb-teal/30 text-fb-teal rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setCurrentYear(2060)}
            className="text-[#5a6a7d] hover:text-white transition-colors p-1"
            title="Jump to 2060"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,4 15,12 5,20" fill="currentColor" /><line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
