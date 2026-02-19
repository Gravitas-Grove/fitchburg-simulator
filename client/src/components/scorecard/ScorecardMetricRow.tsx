import type { ScorecardMetric } from '@/types/scorecard';

interface ScorecardMetricRowProps {
  metric: ScorecardMetric;
}

export function ScorecardMetricRow({ metric }: ScorecardMetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-[#8896a7]">{metric.label}</span>
      <span className="font-mono text-[11px] text-[#e8edf3] font-medium tabular-nums">
        {metric.formatted}
      </span>
    </div>
  );
}
