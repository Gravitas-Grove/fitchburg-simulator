import { useScenarioStore } from '@/stores/scenarioStore';

export function GrowthRateSlider() {
  const growthRate = useScenarioStore((s) => s.growthRate);
  const setGrowthRate = useScenarioStore((s) => s.setGrowthRate);

  return (
    <div>
      <div className="font-mono text-[9px] text-[#5a6a7d] tracking-[1.5px] uppercase mb-2.5">
        Growth Rate · <span className="text-fb-gold font-medium">{growthRate}</span> ac/yr
      </div>
      <div className="flex justify-between text-[10px] text-[#5a6a7d] font-mono mb-1.5">
        <span>50</span>
        <span>conservative → aggressive</span>
        <span>200</span>
      </div>
      <input
        type="range"
        min={50}
        max={200}
        step={25}
        value={growthRate}
        onChange={(e) => setGrowthRate(Number(e.target.value))}
        className="w-full h-1 bg-[rgba(255,255,255,0.15)] rounded appearance-none outline-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-fb-gold [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0c1117]
          [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#f0c674]"
      />
    </div>
  );
}
