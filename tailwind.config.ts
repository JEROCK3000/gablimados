import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta GABLIMADOS
        verde: {
          50:  '#f2fae8',
          100: '#e2f4cc',
          200: '#c5e89e',
          300: '#a0d86a',
          400: '#7dc43f',
          500: '#5cb830', // verde principal
          600: '#4a9424',
          700: '#3a721c',
          800: '#2e5716',
          900: '#234012',
        },
        purpura: {
          50:  '#f5f0fd',
          100: '#ece0fb',
          200: '#d8c2f6',
          300: '#be9eef',
          400: '#a87ae5',
          500: '#8b6bc4', // púrpura principal
          600: '#7557ad',
          700: '#5e4490',
          800: '#4a3572',
          900: '#382857',
        },
        dorado: {
          50:  '#fdf9e8',
          100: '#faf1c5',
          200: '#f4e08a',
          300: '#ecc94b',
          400: '#d4a520', // dorado principal
          500: '#c9a227',
          600: '#a07c1a',
          700: '#7a5e14',
          800: '#5d4710',
          900: '#46350c',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glow-verde': '0 0 20px rgba(92, 184, 48, 0.3)',
        'glow-purpura': '0 0 20px rgba(139, 107, 196, 0.3)',
        'glow-dorado': '0 0 20px rgba(212, 165, 32, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-gab': 'linear-gradient(135deg, #5cb830 0%, #8b6bc4 100%)',
        'gradient-hero': 'linear-gradient(135deg, #2e5716 0%, #4a3572 100%)',
        'gradient-dorado': 'linear-gradient(135deg, #c9a227 0%, #d4a520 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
