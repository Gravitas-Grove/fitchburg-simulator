import type { Grade } from '@/types/scorecard';
import { GRADE_COLORS, GRADE_BG, SHADOWS } from '@/data/designTokens';

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const color = GRADE_COLORS[grade];
  const bg = GRADE_BG[grade];

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center font-mono font-bold grade-badge-enter`}
      style={{
        backgroundColor: bg,
        color,
        border: `1px solid ${color}40`,
        boxShadow: SHADOWS.gradeBadge(color),
      }}
    >
      {grade}
    </div>
  );
}
