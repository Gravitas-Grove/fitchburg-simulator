import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from './MetricCard';

export function MetricsGrid() {
  const metrics = useMetrics();

  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        value={metrics?.acres ?? null}
        format={(v) => Math.round(v).toLocaleString()}
        label="Acres consumed"
        colorClass="text-fb-teal"
      />
      <MetricCard
        value={metrics?.units ?? null}
        format={(v) => Math.round(v).toLocaleString()}
        label="Housing units"
        colorClass="text-fb-gold"
        duration={700}
      />
      <MetricCard
        value={metrics?.infraM ?? null}
        format={(v) => '$' + v.toFixed(1) + 'M'}
        label="Infra cost"
        colorClass="text-fb-red"
        duration={800}
      />
      <AgLandMetric value={metrics?.agLand ?? null} />
    </div>
  );
}

function AgLandMetric({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="bg-[#151c25] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
        <div className="font-mono text-[17px] font-medium leading-none mb-1.5 text-fb-blue">—</div>
        <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1px] uppercase leading-tight">
          Ag acres impact
        </div>
      </div>
    );
  }

  const colorClass = value === 0 ? 'text-fb-teal' : value > 500 ? 'text-fb-red' : 'text-fb-gold';

  return (
    <div className="bg-[#151c25] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
      <div className={`font-mono text-[17px] font-medium leading-none mb-1.5 ${colorClass}`}>
        {value === 0 ? 'None' : value.toLocaleString()}
      </div>
      <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1px] uppercase leading-tight">
        Ag acres impact
      </div>
    </div>
  );
}
