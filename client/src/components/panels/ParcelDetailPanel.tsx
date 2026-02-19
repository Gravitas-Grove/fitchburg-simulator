import { useParcelStore } from '@/stores/parcelStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { StreetViewEmbed } from '../map/StreetViewEmbed';

function formatCurrency(val: number | null): string {
  if (val === null || val === undefined) return '—';
  return '$' + Math.round(val).toLocaleString();
}

export function ParcelDetailPanel() {
  const selectedParcelNo = useParcelStore((s) => s.selectedParcelNo);
  const parcels = useParcelStore((s) => s.parcels);
  const setSelectedParcel = useParcelStore((s) => s.setSelectedParcel);
  const activeScenario = useScenarioStore((s) => s.activeScenario);

  if (!selectedParcelNo) return null;

  const parcel = parcels.find((p) => p.parcelNo === selectedParcelNo);
  if (!parcel) return null;

  const color = activeScenario?.color || '#4ecdc4';

  return (
    <div className="absolute top-3 right-3 z-[1001] w-[340px] parcel-panel-enter">
      <div className="bg-[#0d1117]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-white/10"
          style={{ borderTopColor: color, borderTopWidth: 3, borderTopStyle: 'solid' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-semibold text-[#e8edf3] truncate">
                {parcel.address}
              </h3>
              <p className="text-[10px] font-mono text-[#5a6a7d] mt-0.5">
                Parcel {parcel.parcelNo}
              </p>
            </div>
            <button
              onClick={() => setSelectedParcel(null)}
              className="text-[#5a6a7d] hover:text-[#e8edf3] transition-colors ml-2 p-1 -mt-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="px-4 py-3 space-y-2">
          <DetailRow label="Owner" value={parcel.owner} />
          <DetailRow label="School District" value={parcel.schoolDistrict} />
          <DetailRow label="Area" value={`${parcel.areaAcres.toFixed(2)} acres`} />
          <DetailRow label="Land Value" value={formatCurrency(parcel.landValue)} />
          <DetailRow
            label="Dev. Year"
            value={parcel.developYear.toString()}
            highlight
            color={color}
          />
          <DetailRow
            label="Priority"
            value={`${parcel.priorityScore.toFixed(0)}/100`}
          />
          <div className="pt-1">
            <span className="text-[10px] text-[#5a6a7d] block mb-0.5">Scenario Reason</span>
            <p className="text-[11px] text-[#8896a7] leading-relaxed">
              {parcel.scenarioReason}
            </p>
          </div>
        </div>

        {/* Street View */}
        <div className="border-t border-white/10">
          <StreetViewEmbed lat={parcel.centroid[1]} lng={parcel.centroid[0]} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[#5a6a7d] flex-shrink-0">{label}</span>
      <span
        className={`text-[11px] font-mono truncate ${
          highlight ? 'font-semibold' : 'text-[#e8edf3]'
        }`}
        style={highlight && color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
