import { useState, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { BASEMAP_LIST, type BasemapId } from '@/data/basemapConfig';
import { Map } from 'lucide-react';

export function BasemapSwitcher() {
  const [open, setOpen] = useState(false);
  const basemap = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const current = BASEMAP_LIST.find((b) => b.id === basemap)!;

  function select(id: BasemapId) {
    setBasemap(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-4 z-[1000]">
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 grid grid-cols-2 gap-1.5 p-2 rounded-lg"
          style={{
            background: 'rgba(12, 17, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {BASEMAP_LIST.map((b) => (
            <button
              key={b.id}
              onClick={() => select(b.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 ${
                b.id === basemap
                  ? 'bg-[#4ecdc4]/15 border border-[#4ecdc4]/30'
                  : 'border border-transparent hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-lg"
                style={{
                  background: b.id === 'dark' ? '#1a2332' : b.id === 'light' ? '#e2e8f0' : b.id === 'satellite' ? '#2d4a2e' : '#8b7355',
                }}
              >
                {b.id === 'dark' ? '🌙' : b.id === 'light' ? '☀️' : b.id === 'satellite' ? '🛰' : '⛰'}
              </div>
              <span className={`text-[9px] font-mono tracking-wider uppercase ${
                b.id === basemap ? 'text-[#4ecdc4]' : 'text-[#8896a7]'
              }`}>
                {b.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)]"
        style={{
          background: 'rgba(12, 17, 23, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <Map size={14} className="text-[#8896a7]" />
        <span className="text-[10px] font-mono text-[#8896a7] tracking-wider uppercase">
          {current.label}
        </span>
      </button>
    </div>
  );
}
