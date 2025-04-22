/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores de España
        'spain-red': '#AA151B',
        'spain-yellow': '#F1BF00',
        
        // Colores de Canarias
        'canary-blue': '#0033A0',
        'canary-yellow': '#FFD100',
        'canary-gray': '#4D4D4F',
        
        // Color de EMERGE
        'emerge': '#2596be',
        
        // Paleta extendida
        'dashboard-primary': '#4059ad',
        'dashboard-secondary': '#6b9ac4',
        'dashboard-accent': '#a31621',
        'dashboard-warning': '#f4b942',
        'dashboard-success': '#97d8c4',
        'dashboard-bg': '#fffdf7',
        'dashboard-light': '#eff2f1',
      },
    },
  },
  plugins: [],
} 