import { useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { GIS_LAYERS, LAYER_CATEGORIES } from '@/data/gisLayerConfig';
import { cn } from '@/lib/cn';

export function LayerToggles() {
  const layerVisibility = useMapStore((s) => s.layerVisibility);
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('environment');

  const layerMap = Object.fromEntries(GIS_LAYERS.map((l) => [l.id, l]));

  return (
    <div className="space-y-1">
      {LAYER_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.id;
        const activeCount = cat.layers.filter((id) => layerVisibility[id]).length;

        return (
          <div key={cat.id}>
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              className="w-full flex items-center justify-between py-1.5 text-[10px] font-mono tracking-wide uppercase text-[#8896a7] hover:text-[#e8edf3] transition-colors"
            >
              <span>{cat.label}</span>
              <div className="flex items-center gap-1.5">
                {activeCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4ecdc4]/10 text-fb-teal">
                    {activeCount}
                  </span>
                )}
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  stroke="currentColor" strokeWidth="1.5"
                  className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-0.5 pb-1.5">
                {cat.layers.map((layerId) => {
                  const layer = layerMap[layerId];
                  if (!layer) return null;
                  const isOn = layerVisibility[layerId];

                  return (
                    <button
                      key={layerId}
                      onClick={() => toggleLayer(layerId)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-200',
                        isOn
                          ? 'bg-[#1f2d3d] border border-[rgba(255,255,255,0.15)]'
                          : 'border border-transparent hover:bg-[#151c25]'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${layer.color}, ${layer.gradientTo || layer.color})`,
                          opacity: isOn ? 1 : 0.5,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'text-[11px] font-medium',
                            isOn ? 'text-[#e8edf3]' : 'text-[#8896a7]'
                          )}>
                            {layer.label}
                          </span>
                          {isOn && (
                            <span
                              className="text-[8px] font-mono px-1 py-0.5 rounded bg-[#4ecdc4]/10 text-fb-teal uppercase tracking-wider"
                              style={{ animation: 'badgePop 0.2s ease-out' }}
                            >
                              On
                            </span>
                          )}
                        </div>
                        {layer.description && (
                          <div className="text-[10px] text-[#5a6a7d] truncate">
                            {layer.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
