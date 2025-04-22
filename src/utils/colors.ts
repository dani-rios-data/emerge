/**
 * Paleta de colores para el Dashboard BI
 * 
 * Este archivo contiene todas las definiciones de colores utilizados en el proyecto,
 * organizados por contexto para facilitar su uso en diferentes componentes.
 */

// Colores institucionales de España
export const SPAIN_COLORS = {
  RED: '#AA151B',
  YELLOW: '#F1BF00'
};

// Colores institucionales de Canarias
export const CANARY_COLORS = {
  BLUE: '#0033A0',
  YELLOW: '#FFD100',
  WHITE: '#FFFFFF',
  DARK_GRAY: '#4D4D4F'
};

// Color corporativo de EMERGE (cliente)
export const EMERGE_COLOR = '#2596be';

// Paleta extendida para el dashboard
export const DASHBOARD_PALETTE = {
  PRIMARY: '#4059ad',
  SECONDARY: '#6b9ac4',
  ACCENT: '#a31621',
  WARNING: '#f4b942',
  SUCCESS: '#97d8c4',
  BACKGROUND: '#fffdf7',
  LIGHT_BACKGROUND: '#eff2f1'
};

// Objeto combinado para facilitar importación
const COLORS = {
  SPAIN: SPAIN_COLORS,
  CANARY: CANARY_COLORS,
  EMERGE: EMERGE_COLOR,
  DASHBOARD: DASHBOARD_PALETTE
};

export default COLORS;

// Función para obtener colores por contexto
export const getContextColors = (context: 'spain' | 'canary' | 'emerge' | 'dashboard'): Record<string, string> => {
  switch (context) {
    case 'spain':
      return SPAIN_COLORS;
    case 'canary':
      return CANARY_COLORS;
    case 'emerge':
      return { PRIMARY: EMERGE_COLOR };
    case 'dashboard':
      return DASHBOARD_PALETTE;
    default:
      return DASHBOARD_PALETTE;
  }
}; 