import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dsl-blue': '#38bdf8',
        'dsl-blue-glow': '#7dd3fc',
        'dark-bg': '#050b18',
        'dark-panel': '#0b1635',
        'dark-border': '#1b2b4b',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 6px #38bdf8, 0 0 12px #38bdf8' },
          '50%': { boxShadow: '0 0 12px #38bdf8, 0 0 24px #38bdf8, 0 0 36px #38bdf8' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backgroundImage: {
        'arena-pattern': "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='120' height='120' fill='none'/%3E%3Cg stroke='%2338bdf8' stroke-opacity='0.08' stroke-width='1'%3E%3Cpath d='M0 30h120M0 60h120M0 90h120'/%3E%3Cpath d='M30 0v120M60 0v120M90 0v120'/%3E%3Ccircle cx='60' cy='60' r='18'/%3E%3Cpath d='M10 60h20M90 60h20'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
export default config
