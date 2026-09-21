/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shop: {
          red: {
            50: '#FFEBEE',
            100: '#FFCDD2',
            200: '#EF9A9A',
            500: '#E53935',
            600: '#D32F2F',
            700: '#B71C1C',
            800: '#C62828',
            900: '#B71C1C',
          },
          grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E0E0E0',
            300: '#CCCCCC',
            500: '#757575',
            700: '#424242',
            900: '#1A1A1A',
          },
        },
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'modal': '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
