/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
          primary: '#DC2626', // Vibrant Hardware Red
          dark: '#B91C1C',
          light: '#FEF2F2',
        },
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(220, 38, 38, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 25px -5px rgba(220, 38, 38, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        'red-glow': '0 0 15px rgba(220, 38, 38, 0.35)',
      },
    },
  },
  plugins: [],
};
