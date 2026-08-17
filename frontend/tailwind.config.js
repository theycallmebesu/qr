export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8", // blue-700
        secondary: "#9333EA", // purple-600
        background: "#0F172A", // slate-900 for modern dark mode
        surface: "#1E293B", // slate-800
        textPrimary: "#F8FAFC", // slate-50
        textSecondary: "#94A3B8", // slate-400
      }
    },
  },
  plugins: [],
}
