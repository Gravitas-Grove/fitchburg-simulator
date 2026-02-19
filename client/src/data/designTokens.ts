// ═══════════════════════════════════════════════════════════════
// Design Tokens — Fitchburg Growth Scenario Simulator
// Centralized color, spacing, shadow, and transition constants
// ═══════════════════════════════════════════════════════════════

// Background palette
export const BG = {
  primary: '#0c1117',
  secondary: '#151c25',
  card: '#1a2332',
  hover: '#1f2d3d',
  glass: 'rgba(12, 17, 23, 0.88)',
} as const;

// Text palette
export const TEXT = {
  primary: '#e8edf3',
  secondary: '#8896a7',
  muted: '#5a6a7d',
} as const;

// Border palette
export const BORDER = {
  default: 'rgba(255, 255, 255, 0.06)',
  active: 'rgba(255, 255, 255, 0.15)',
  subtle: 'rgba(255, 255, 255, 0.03)',
} as const;

// Accent colors
export const ACCENT = {
  teal: '#4ecdc4',
  tealDim: '#2a7a74',
  gold: '#f0c674',
  goldDim: '#8a7038',
  red: '#ff6b6b',
  blue: '#4a90d9',
} as const;

// Letter grade colors
export const GRADE_COLORS = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
} as const;

// Grade background colors (low opacity for badges)
export const GRADE_BG = {
  A: 'rgba(34, 197, 94, 0.15)',
  B: 'rgba(132, 204, 22, 0.15)',
  C: 'rgba(234, 179, 8, 0.15)',
  D: 'rgba(249, 115, 22, 0.15)',
  F: 'rgba(239, 68, 68, 0.15)',
} as const;

// Shadow depths
export const SHADOWS = {
  sidebar: '4px 0 24px rgba(0,0,0,0.3)',
  card: '0 2px 8px rgba(0,0,0,0.2)',
  mapControl: '0 4px 16px rgba(0,0,0,0.4)',
  popup: '0 8px 32px rgba(0,0,0,0.5)',
  gradeBadge: (color: string) => `0 2px 8px ${color}4d`,
} as const;

// Transitions
export const TRANSITIONS = {
  fast: '150ms ease-out',
  default: '200ms ease-out',
  medium: '300ms ease-out',
  slow: '400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

// Spacing scale (in px)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
