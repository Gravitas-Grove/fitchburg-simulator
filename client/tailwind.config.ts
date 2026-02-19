import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255, 255, 255, 0.06)',
        'border-active': 'rgba(255, 255, 255, 0.15)',
        input: 'rgba(255, 255, 255, 0.06)',
        ring: 'hsl(var(--accent-teal))',
        background: 'hsl(var(--bg-primary))',
        foreground: 'hsl(var(--text-primary))',
        primary: {
          DEFAULT: 'hsl(var(--accent-teal))',
          foreground: 'hsl(var(--bg-primary))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--bg-secondary))',
          foreground: 'hsl(var(--text-primary))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--accent-warm))',
          foreground: 'hsl(var(--text-primary))',
        },
        muted: {
          DEFAULT: 'hsl(var(--bg-secondary))',
          foreground: 'hsl(var(--text-secondary))',
        },
        accent: {
          DEFAULT: 'hsl(var(--bg-hover))',
          foreground: 'hsl(var(--text-primary))',
        },
        card: {
          DEFAULT: 'hsl(var(--bg-card))',
          foreground: 'hsl(var(--text-primary))',
        },
        // Fitchburg theme accent colors
        fb: {
          teal: '#4ecdc4',
          'teal-dim': '#2a7a74',
          gold: '#f0c674',
          'gold-dim': '#8a7038',
          red: '#ff6b6b',
          blue: '#4a90d9',
        },
        // Letter grade colors
        grade: {
          A: '#22c55e',
          B: '#84cc16',
          C: '#eab308',
          D: '#f97316',
          F: '#ef4444',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
