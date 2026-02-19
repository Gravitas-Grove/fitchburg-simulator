import { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useScenarioStore } from '@/stores/scenarioStore';
import { computeRadarData } from '@/data/radarData';
import type { Scenario } from '@/types/scenario';

interface ScenarioRadarChartProps {
  scenarios: Scenario[];
}

export function ScenarioRadarChart({ scenarios }: ScenarioRadarChartProps) {
  const growthRate = useScenarioStore((s) => s.growthRate);
  const density = useScenarioStore((s) => s.density);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const data = useMemo(
    () => computeRadarData(scenarios, growthRate, density),
    [scenarios, growthRate, density]
  );

  if (scenarios.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[11px] text-[#5a6a7d] italic">
        Enable scenarios below to compare
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#8896a7', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#5a6a7d', fontSize: 8 }}
            tickCount={5}
            axisLine={false}
          />
          {scenarios.map((scenario) => (
            <Radar
              key={scenario.id}
              name={scenario.name}
              dataKey={scenario.id}
              stroke={scenario.color}
              fill={scenario.color}
              fillOpacity={hoveredId === null ? 0.12 : hoveredId === scenario.id ? 0.25 : 0.03}
              strokeOpacity={hoveredId === null ? 0.9 : hoveredId === scenario.id ? 1 : 0.2}
              strokeWidth={hoveredId === scenario.id ? 2.5 : 1.5}
              onMouseEnter={() => setHoveredId(scenario.id)}
              onMouseLeave={() => setHoveredId(null)}
              animationDuration={600}
              animationEasing="ease-out"
            />
          ))}
          <Tooltip
            contentStyle={{
              background: 'rgba(12, 17, 23, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: '#e8edf3',
            }}
            itemStyle={{ color: '#8896a7', fontSize: 10 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
