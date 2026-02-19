import { useState } from 'react';
import { useScorecard } from '@/hooks/useScorecard';
import { useScenarioStore } from '@/stores/scenarioStore';
import { GradeBadge } from './GradeBadge';
import { ScorecardDimension } from './ScorecardDimension';
import type { DimensionId } from '@/types/scorecard';

export function ScorecardPanel() {
  const scorecard = useScorecard();
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const [openDimension, setOpenDimension] = useState<DimensionId | null>(null);

  if (!activeScenario) {
    return (
      <div className="px-5 py-8 text-center">
        <div className="text-[#5a6a7d] text-[11px] italic">
          Select a growth model to view its scorecard analysis.
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  return (
    <div className="px-4 py-4 space-y-4 tab-content-enter">
      {/* Overall grade header */}
      <div className="flex items-center gap-4 px-1">
        <GradeBadge grade={scorecard.overallGrade} size="lg" />
        <div>
          <div className="text-[13px] font-medium text-[#e8edf3]">{activeScenario.name}</div>
          <div className="text-[10px] text-[#5a6a7d] mt-0.5">
            Overall Score: <span className="font-mono text-[#8896a7]">{Math.round(scorecard.overallScore)}/100</span>
          </div>
        </div>
      </div>

      {/* Quick grade overview — 4 badges in a row */}
      <div className="grid grid-cols-4 gap-2">
        {scorecard.dimensions.map((dim) => (
          <button
            key={dim.id}
            onClick={() => setOpenDimension(openDimension === dim.id ? null : dim.id)}
            className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <GradeBadge grade={dim.grade} size="sm" />
            <span className="text-[8px] font-mono text-[#5a6a7d] tracking-wider uppercase">{dim.id.slice(0, 5)}</span>
          </button>
        ))}
      </div>

      {/* Dimension accordion */}
      <div className="space-y-1.5">
        {scorecard.dimensions.map((dim) => (
          <ScorecardDimension
            key={dim.id}
            dimension={dim}
            isOpen={openDimension === dim.id}
            onToggle={() => setOpenDimension(openDimension === dim.id ? null : dim.id)}
          />
        ))}
      </div>
    </div>
  );
}
