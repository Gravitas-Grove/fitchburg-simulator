import { useScenarioStore } from '@/stores/scenarioStore';
import type { DensityLevel } from '@/types/scenario';
import { cn } from '@/lib/cn';

const DENSITY_OPTIONS: { value: DensityLevel; label: string }[] = [
  { value: 'low', label: 'Low (3)' },
  { value: 'med', label: 'Med (5)' },
  { value: 'high', label: 'High (7.5)' },
];

export function DensityToggle() {
  const density = useScenarioStore((s) => s.density);
  const setDensity = useScenarioStore((s) => s.setDensity);

  return (
    <div className="flex gap-1.5">
      {DENSITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setDensity(opt.value)}
          className={cn(
            'flex-1 py-2 px-3 rounded-md text-[11px] font-mono text-center transition-all duration-200 border',
            density === opt.value
              ? 'bg-[#f0c674]/10 border-fb-gold text-fb-gold'
              : 'bg-[#151c25] border-[rgba(255,255,255,0.06)] text-[#8896a7] hover:border-[rgba(255,255,255,0.15)] hover:text-[#e8edf3]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
