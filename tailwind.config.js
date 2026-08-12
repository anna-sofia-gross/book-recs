/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4EEE2',
          dim: '#EAE2D0',
          card: '#FBF8F1',
        },
        ink: {
          DEFAULT: '#211C15',
          soft: '#4A4234',
          faint: '#8A7F6A',
        },
        rust: {
          DEFAULT: '#B4502A',
          dark: '#8C3A1E',
          light: '#D97B4F',
        },
        moss: {
          DEFAULT: '#5B6B4F',
          dark: '#3F4A37',
          light: '#8B9A7A',
        },
        gold: {
          DEFAULT: '#B68A2E',
          light: '#D9B463',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,28,21,0.06), 0 8px 24px -12px rgba(33,28,21,0.18)',
        stamp: '0 0 0 1px rgba(33,28,21,0.08)',
      },
    },
  },
  plugins: [],
}
