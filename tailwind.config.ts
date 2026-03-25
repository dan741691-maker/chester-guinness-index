import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c875',
          dark: '#a07830',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          muted: '#c4bfb7',
        },
        surface: {
          DEFAULT: '#111111',
          2: '#1a1a1a',
          3: '#222222',
        },
        border: {
          DEFAULT: '#2a2a2a',
          gold: '#c9a84c40',
        },
        tier: {
          legendary: '#FFD700',
          elite: '#C9A84C',
          strong: '#A0AEC0',
          decent: '#8B7355',
          weak: '#718096',
          avoid: '#E53E3E',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
