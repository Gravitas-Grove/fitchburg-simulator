import { useState } from 'react';
import type { ScorecardDimension as DimensionType } from '@/types/scorecard';
import { GradeBadge } from './GradeBadge';
import { ScorecardMetricRow } from './ScorecardMetricRow';
import { DollarSign, Leaf, Home, Car, ChevronDown } from 'lucide-react';

const ICONS = {
  DollarSign,
  Leaf,
  Home,
  Car,
} as const;

interface ScorecardDimensionProps {
  dimension: DimensionType;
  isOpen: boolean;
  onToggle: () => void;
}

export function ScorecardDimension({ dimension, isOpen, onToggle }: ScorecardDimensionProps) {
  const Icon = ICONS[dimension.icon as keyof typeof ICONS] || DollarSign;

  return (
    <div
      className="rounded-lg border transition-all duration-200"
      style={{
        backgroundColor: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderColor: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors duration-150"
      >
        <Icon size={14} className="text-[#5a6a7d] flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="text-[11px] font-medium text-[#e8edf3]">{dimension.label}</div>
          <div className="text-[9px] text-[#5a6a7d] mt-0.5">{dimension.summary}</div>
        </div>
        <GradeBadge grade={dimension.grade} size="sm" />
        <ChevronDown
          size={12}
          className={`text-[#5a6a7d] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 tab-content-enter">
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-2 mt-1">
            {dimension.metrics.map((metric) => (
              <ScorecardMetricRow key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-[#151c25] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${dimension.score}%`,
                  backgroundColor: dimension.score >= 75 ? '#22c55e' : dimension.score >= 60 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="font-mono text-[9px] text-[#5a6a7d]">{Math.round(dimension.score)}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
