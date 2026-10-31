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
          navy: '#0B132B',
          dark: '#1C2541',
          slate: '#3A506B',
          teal: '#059669',
          tealLight: '#10B981',
          accent: '#14B8A6',
          danger: '#DC2626',
          warning: '#D97706',
          surface: '#F8FAFC',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      fontSize: {
        '3xs': '0.625rem', // 10px
        '2xs': '0.6875rem', // 11px
      }
    },
  },
  plugins: [],
}