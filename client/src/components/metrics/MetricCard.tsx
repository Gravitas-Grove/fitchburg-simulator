import { useAnimatedValue } from '@/hooks/useAnimatedValue';

interface MetricCardProps {
  value: number | null;
  format: (v: number) => string;
  label: string;
  colorClass: string;
  duration?: number;
}

export function MetricCard({ value, format, label, colorClass, duration = 600 }: MetricCardProps) {
  const animated = useAnimatedValue(value ?? 0, duration);

  return (
    <div className="bg-[#151c25] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
      <div className={`font-mono text-[17px] font-medium leading-none mb-1.5 ${colorClass}`}>
        {value === null ? '—' : format(animated)}
      </div>
      <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1px] uppercase leading-tight">{label}</div>
    </div>
  );
}
