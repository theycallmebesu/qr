/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        restrox: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff5722', // signature RestroX orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          dark: '#0B0F19',
          surface: '#111827',
          card: '#182234',
          border: '#26354D',
          hover: '#1F2E45',
        },
        primary: {
          DEFAULT: '#ff5722',
          hover: '#f44336',
          light: '#ff8a65',
        }
      },
      boxShadow: {
        'glow-orange': '0 0 20px -3px rgba(255, 87, 34, 0.4)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
