import React, { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import * as d3 from 'd3';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartEvent
} from 'chart.js';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';

// Definir colores específicos para los componentes de patentes - Paleta neutral profesional
const PATENTS_SECTOR_COLORS = {
  total: '#37474F',        // Gris azulado oscuro para el total (neutral y profesional)
  business: '#FF7043',     // Naranja coral para empresas (innovación corporativa)
  government: '#5E35B1',   // Púrpura profundo para gobierno (autoridad institucional)
  education: '#1E88E5',    // Azul vibrante para educación (conocimiento y academia)
  nonprofit: '#8D6E63'     // Marrón medio para organizaciones sin fines de lucro (estabilidad social)
};

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Interfaz para los elementos del gráfico
interface ChartDataItem {
  code: string;
  value: number;
  flag?: string;
  isSupranational: boolean;
  isSpain: boolean;
  obsFlag?: string;
  isAverage?: boolean;  // Indicador si el valor es un promedio
  numCountries?: number; // Número de países usados para calcular el promedio
}

// Interfaz para el resultado del procesamiento de datos del gráfico
interface ChartDataResult {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
    borderRadius: number;
    barPercentage: number;
    categoryPercentage: number;
  }[];
  sortedItems: ChartDataItem[];
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: '#2E7D32',      // Verde tecnológico principal
  LIGHT: '#4CAF50',        // Verde más claro
  DARK: '#1B5E20',         // Verde más oscuro
  HIGHLIGHT: '#CC0000',    // Mantener el rojo para España
  TEXT: '#000000',         // Color del texto (negro) 
  BORDER: '#E5E7EB',       // Color del borde (gris suave)
  YELLOW: '#FFC107',       // Amarillo para Unión Europea
  GREEN: '#009900'         // Verde para las zonas Euro
};



// Mapeo de códigos de país a nombres en español e inglés - Sincronizado con PatentsEuropeanMap
const countryCodeMapping: Record<string, {es: string, en: string}> = {
  'AT': {es: 'Austria', en: 'Austria'},
  'BE': {es: 'Bélgica', en: 'Belgium'},
  'BG': {es: 'Bulgaria', en: 'Bulgaria'},
  'CY': {es: 'Chipre', en: 'Cyprus'},
  'CZ': {es: 'República Checa', en: 'Czech Republic'},
  'DE': {es: 'Alemania', en: 'Germany'},
  'DK': {es: 'Dinamarca', en: 'Denmark'},
  'EE': {es: 'Estonia', en: 'Estonia'},
  'EL': {es: 'Grecia', en: 'Greece'},
  'ES': {es: 'España', en: 'Spain'},
  'FI': {es: 'Finlandia', en: 'Finland'},
  'FR': {es: 'Francia', en: 'France'},
  'HR': {es: 'Croacia', en: 'Croatia'},
  'HU': {es: 'Hungría', en: 'Hungary'},
  'IE': {es: 'Irlanda', en: 'Ireland'},
  'IT': {es: 'Italia', en: 'Italy'},
  'LT': {es: 'Lituania', en: 'Lithuania'},
  'LU': {es: 'Luxemburgo', en: 'Luxembourg'},
  'LV': {es: 'Letonia', en: 'Latvia'},
  'MT': {es: 'Malta', en: 'Malta'},
  'NL': {es: 'Países Bajos', en: 'Netherlands'},
  'PL': {es: 'Polonia', en: 'Poland'},
  'PT': {es: 'Portugal', en: 'Portugal'},
  'RO': {es: 'Rumanía', en: 'Romania'},
  'SE': {es: 'Suecia', en: 'Sweden'},
  'SI': {es: 'Eslovenia', en: 'Slovenia'},
  'SK': {es: 'Eslovaquia', en: 'Slovakia'},
  'UK': {es: 'Reino Unido', en: 'United Kingdom'},
  'EU27_2020': {es: 'Unión Europea (27)', en: 'European Union (27)'},
  'EA19': {es: 'Zona Euro (19)', en: 'Euro Area (19)'},
  'EA20': {es: 'Zona Euro (20)', en: 'Euro Area (20)'},
  'NO': {es: 'Noruega', en: 'Norway'},
  'CH': {es: 'Suiza', en: 'Switzerland'},
  'IS': {es: 'Islandia', en: 'Iceland'},
  'TR': {es: 'Turquía', en: 'Turkey'},
  'ME': {es: 'Montenegro', en: 'Montenegro'},
  'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'MKD': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'AL': {es: 'Albania', en: 'Albania'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'SRB': {es: 'Serbia', en: 'Serbia'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'BIH': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'MDA': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'UKR': {es: 'Ucrania', en: 'Ukraine'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'XKX': {es: 'Kosovo', en: 'Kosovo'},
  'RU': {es: 'Rusia', en: 'Russia'},
  'RUS': {es: 'Rusia', en: 'Russia'},
  'JP': {es: 'Japón', en: 'Japan'},
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'},
  'MNE': {es: 'Montenegro', en: 'Montenegro'}
};

// Definir la interfaz para los datos de entrada (usando datos de investigadores)
interface PatentsData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  [key: string]: string | undefined;
}

interface PatentsRankingChartProps {
  data: PatentsData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
}

// Función para obtener la URL de la bandera del país
function getCountryFlagUrl(countryCode: string): string {  
  // Manejar casos especiales
  if (countryCode === 'EL') {
    return 'https://flagcdn.com/gr.svg';
  }
  
  if (countryCode === 'UK') {
    return 'https://flagcdn.com/gb.svg';
  }
  
  if (countryCode === 'EU27_2020') {
    return 'https://flagcdn.com/eu.svg';
  }
  
  if (countryCode === 'EA19' || countryCode === 'EA20') {
    return 'https://flagcdn.com/eu.svg';
  }
  
  // Buscar en el archivo de banderas por código ISO2
  const foundFlag = countryFlags.find(flag => 
    flag.code.toUpperCase() === countryCode.toUpperCase() ||
    flag.iso3.toUpperCase() === countryCode.toUpperCase()
  );
  
  if (foundFlag) {
    return foundFlag.flag;
  }
  
  // Fallback: usar flagcdn con código en minúsculas
  const lowerCode = countryCode.toLowerCase();
  
  // Mapeo especial para códigos que no coinciden
  const codeMapping: Record<string, string> = {
    'el': 'gr',  // Grecia
    'uk': 'gb'   // Reino Unido
  };
  
  const mappedCode = codeMapping[lowerCode] || lowerCode;
  return `https://flagcdn.com/${mappedCode}.svg`;
}

const PatentsRankingChart: React.FC<PatentsRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total'
}) => {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Funciones para manejar el tooltip global con implementación mejorada
  const createGlobalTooltip = (): HTMLElement => {
    // Verificar si ya existe un tooltip global
    let tooltipElement = document.getElementById('patents-chart-tooltip');
    
    if (!tooltipElement) {
      // Crear nuevo tooltip y agregarlo al body
      tooltipElement = document.createElement('div');
      tooltipElement.id = 'patents-chart-tooltip';
      tooltipElement.className = 'patents-tooltip';
      
      // Aplicar estilos base manualmente
      Object.assign(tooltipElement.style, {
        position: 'fixed',
        display: 'none',
        opacity: '0',
        zIndex: '999999',
        pointerEvents: 'none',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '8px',
        padding: '0',
        minWidth: '150px',
        maxWidth: '350px',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#333',
        transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
      });
      
      document.body.appendChild(tooltipElement);
      
              // Crear hoja de estilo inline idéntica a PatentsEuropeanMap
      const styleSheet = document.createElement('style');
      styleSheet.id = 'patents-tooltip-styles';
      styleSheet.textContent = `
        #patents-chart-tooltip {
            transform-origin: top left;
          transform: scale(0.95);
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
            opacity: 0;
            z-index: 9999;
        pointer-events: none;
            position: fixed;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border-radius: 8px;
        }
        #patents-chart-tooltip.visible {
          opacity: 1 !important;
          transform: scale(1);
        }
          
          /* Estilos mejorados para el scroll del chart */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db #f3f4f6;
            scroll-behavior: smooth;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
        #patents-chart-tooltip .text-green-600 { color: #059669; }
        #patents-chart-tooltip .text-red-600 { color: #DC2626; }
        #patents-chart-tooltip .text-orange-700 { color: #C2410C; }
        #patents-chart-tooltip .bg-orange-50 { background-color: #FFF7ED; }
        #patents-chart-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
          #patents-chart-tooltip .bg-gray-50 { background-color: #F9FAFB; }
        #patents-chart-tooltip .border-orange-100 { border-color: #FFEDD5; }
        #patents-chart-tooltip .border-gray-100 { border-color: #F3F4F6; }
        #patents-chart-tooltip .text-gray-500 { color: #6B7280; }
        #patents-chart-tooltip .text-gray-800 { color: #1F2937; }
        #patents-chart-tooltip .text-gray-600 { color: #4B5563; }
          #patents-chart-tooltip .text-gray-400 { color: #9CA3AF; }
        #patents-chart-tooltip .text-yellow-500 { color: #F59E0B; }
        #patents-chart-tooltip .rounded-lg { border-radius: 0.5rem; }
        #patents-chart-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        #patents-chart-tooltip .p-3 { padding: 0.75rem; }
        #patents-chart-tooltip .p-4 { padding: 1rem; }
        #patents-chart-tooltip .p-2 { padding: 0.5rem; }
          #patents-chart-tooltip .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          #patents-chart-tooltip .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          #patents-chart-tooltip .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
          #patents-chart-tooltip .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
        #patents-chart-tooltip .pt-3 { padding-top: 0.75rem; }
        #patents-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #patents-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #patents-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #patents-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #patents-chart-tooltip .mr-2 { margin-right: 0.5rem; }
          #patents-chart-tooltip .ml-2 { margin-left: 0.5rem; }
        #patents-chart-tooltip .mt-1 { margin-top: 0.25rem; }
          #patents-chart-tooltip .mt-3 { margin-top: 0.75rem; }
          #patents-chart-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
        #patents-chart-tooltip .text-xs { font-size: 0.75rem; }
        #patents-chart-tooltip .text-sm { font-size: 0.875rem; }
        #patents-chart-tooltip .text-lg { font-size: 1.125rem; }
        #patents-chart-tooltip .text-xl { font-size: 1.25rem; }
        #patents-chart-tooltip .font-bold { font-weight: 700; }
        #patents-chart-tooltip .font-medium { font-weight: 500; }
        #patents-chart-tooltip .flex { display: flex; }
        #patents-chart-tooltip .items-center { align-items: center; }
        #patents-chart-tooltip .justify-between { justify-content: space-between; }
        #patents-chart-tooltip .w-8 { width: 2rem; }
        #patents-chart-tooltip .h-6 { height: 1.5rem; }
          #patents-chart-tooltip .w-36 { width: 9rem; }
        #patents-chart-tooltip .w-44 { width: 11rem; }
          #patents-chart-tooltip .w-48 { width: 12rem; }
        #patents-chart-tooltip .w-full { width: 100%; }
          #patents-chart-tooltip .h-full { height: 100%; }
        #patents-chart-tooltip .rounded { border-radius: 0.25rem; }
        #patents-chart-tooltip .rounded-md { border-radius: 0.375rem; }
        #patents-chart-tooltip .overflow-hidden { overflow: hidden; }
        #patents-chart-tooltip .border-t { border-top-width: 1px; }
        #patents-chart-tooltip .border-b { border-bottom-width: 1px; }
        #patents-chart-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
          #patents-chart-tooltip .space-y-1 > * + * { margin-top: 0.25rem; }
        #patents-chart-tooltip .max-w-xs { max-width: 20rem; }
          #patents-chart-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
          #patents-chart-tooltip .relative { position: relative; }
        #patents-chart-tooltip .inline-block { display: inline-block; }
      `;
      document.head.appendChild(styleSheet);
    }
    
    return tooltipElement;
  };

  // Posicionar el tooltip global
  const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
    const tooltipEl = createGlobalTooltip();
    
    // Actualizar contenido
    tooltipEl.innerHTML = content;
    
    // Aplicar estilos base
    Object.assign(tooltipEl.style, {
      position: 'fixed',
      display: 'block',
      opacity: '0',
      zIndex: '999999',
      pointerEvents: 'none',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '0',
      minWidth: '150px',
      maxWidth: '350px',
      border: '1px solid #e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
    });
    
    // No necesitamos manejar temporizadores en esta versión simplificada
    
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    
    // Obtener posición del mouse
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Obtener tamaño de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Posicionar más cerca del elemento - similar a RegionRankingChart
    let left = mouseX + 10;
    let top = mouseY - (tooltipHeight / 2); // Centrar verticalmente respecto al cursor
    
    // Ajustar horizontal si se sale por la derecha
    if (left + tooltipWidth > windowWidth) {
      // Si no cabe a la derecha, colocar a la izquierda del cursor
      left = mouseX - tooltipWidth - 10;
    }
    
    // Ajustar vertical si se sale por abajo o arriba
    if (top + tooltipHeight > windowHeight) {
      top = windowHeight - tooltipHeight - 10;
    }
    
    if (top < 10) {
      top = 10;
    }
    
    // Establecer posición y visibilidad con precisión
    tooltipEl.style.left = `${Math.floor(left)}px`;
    tooltipEl.style.top = `${Math.floor(top)}px`;
    
    // Agregar clase visible tras un pequeño delay para activar la animación
    setTimeout(() => {
      tooltipEl.classList.add('visible');
    }, 10);
  };

  // Ocultar el tooltip global
  const hideGlobalTooltip = (): void => {
    const tooltipEl = document.getElementById('patents-chart-tooltip');
    if (tooltipEl) {
      // Quitar la clase visible primero para la animación
      tooltipEl.classList.remove('visible');
      
      // Después de la transición, ocultar el tooltip
      setTimeout(() => {
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }, 150); // Tiempo suficiente para la animación
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseLeave = () => {
      hideGlobalTooltip();
    };
    
    // Definir handleScroll fuera del bloque if
    const handleScroll = () => {
      hideGlobalTooltip();
    };
    
    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Añadir manejador de eventos de scroll para ocultar el tooltip
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      
      // Limpiar tooltip global al desmontar
      const globalTooltip = document.getElementById('patents-chart-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
      
      // Limpiar estilos del tooltip
      const tooltipStyles = document.getElementById('patents-tooltip-styles');
      if (tooltipStyles && tooltipStyles.parentNode) {
        tooltipStyles.parentNode.removeChild(tooltipStyles);
      }
    };
  }, []);

  // Agregar estilos específicos para el scrollbar con CSS en useEffect
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-scrollbar-styles';
    
    // Definir estilos para el scrollbar
    styleElement.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 8px;
        border: 2px solid #f3f4f6;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
      }
    `;
    
    // Agregar al head del documento
    document.head.appendChild(styleElement);
    
    // Limpiar al desmontar
    return () => {
      const existingStyle = document.getElementById('custom-scrollbar-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Función para verificar si es una entidad supranacional
  const isSupranationalEntity = (code: string): boolean => {
    return ['EU27_2020', 'EU28', 'EU15', 'EA19', 'EA20', 'EFTA'].includes(code);
  };

  // Función para verificar si es España
  const isSpain = (code: string): boolean => {
    return code === 'ES';
  };

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de países por patentes",
      axisLabel: "Patentes",
      noData: "No hay datos disponibles para este año",
      patents: "Patentes",
      countryRanking: "Ranking de países",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Sector gubernamental", 
      sector_education: "Sector educativo superior",
      sector_nonprofit: "Sector privado sin ánimo de lucro"
    },
    en: {
      title: "Country Ranking by Patents",
      axisLabel: "Patents", 
      noData: "No data available for this year",
      patents: "Patents",
      countryRanking: "Country Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y código en los datos
  const sectorCodeMapping: Record<string, string> = {
    'total': 'TOTAL',
    'business': 'BES',
    'government': 'GOV',
    'education': 'HES',
    'nonprofit': 'PNP'
  };
  
  // Obtener el código del sector seleccionado
  // Si selectedSector ya es un código (TOTAL, BES, etc.), usarlo directamente
  // Si es un ID normalizado (total, business, etc.), mapearlo
  const sectorCode = selectedSector.length <= 3 ? selectedSector : (sectorCodeMapping[selectedSector] || 'TOTAL');

  // Preparar datos del gráfico - SINCRONIZADO CON EL MAPA
  const prepareChartData = (): ChartDataResult => {
    // Filtrar datos exactamente igual que en el mapa
    const countryDataForYear = data.filter(item => {
      const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
      const sectorMatch = item.sectperf === sectorCode;
      const isEuropean = EUROPEAN_COUNTRY_CODES.includes(item.geo);
      
      return yearMatch && sectorMatch && (isEuropean || isSupranationalEntity(item.geo));
    });

    // Construir mapa de países exactamente igual que en el mapa
    const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
    
    countryDataForYear.forEach(item => {
      const countryCode = item.geo;
      let value = parseFloat(item.OBS_VALUE || '0');
      if (isNaN(value) || value === 0) return; // Filtrar valores en 0
      
      // Aplicar el mismo cálculo de promedios que en el mapa
      if (countryCode === 'EU27_2020') {
        value = Math.round(value / 27);
      } else if (countryCode === 'EA19') {
        value = Math.round(value / 19);
      } else if (countryCode === 'EA20') {
        value = Math.round(value / 20);
      }
      
      const isSupranational = countryCode === 'EU27_2020' || countryCode === 'EA19' || countryCode === 'EA20';
      tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
    });

    // Ordenar exactamente igual que en el mapa
    const sortedData = Array.from(tempCountryMap.values())
      .sort((a, b) => b.value - a.value);

    // Crear elementos del gráfico con información adicional
    const chartItems: ChartDataItem[] = sortedData.map(item => {
      // Buscar información adicional en los datos originales con mejor matching
      let originalData = data.find(dataItem => 
        dataItem.geo === item.code && 
        parseInt(dataItem.TIME_PERIOD) === selectedYear &&
        dataItem.sectperf === sectorCode
      );
      
      // Si no se encuentra, intentar con códigos alternativos
      if (!originalData) {
        const alternativeCodes = [];
        
        // Mapeo de códigos comunes
        const codeMapping: Record<string, string[]> = {
          'EL': ['GRC'], 'GRC': ['EL'],
          'UK': ['GBR'], 'GBR': ['UK'],
          'DE': ['DEU'], 'DEU': ['DE'],
          'FR': ['FRA'], 'FRA': ['FR'],
          'ES': ['ESP'], 'ESP': ['ES'],
          'IT': ['ITA'], 'ITA': ['IT'],
          'CZ': ['CZE'], 'CZE': ['CZ'],
          'SE': ['SWE'], 'SWE': ['SE'],
          'DK': ['DNK'], 'DNK': ['DK'],
          'FI': ['FIN'], 'FIN': ['FI'],
          'AT': ['AUT'], 'AUT': ['AT'],
          'BE': ['BEL'], 'BEL': ['BE'],
          'BG': ['BGR'], 'BGR': ['BG'],
          'HR': ['HRV'], 'HRV': ['HR'],
          'CY': ['CYP'], 'CYP': ['CY'],
          'EE': ['EST'], 'EST': ['EE'],
          'HU': ['HUN'], 'HUN': ['HU'],
          'IE': ['IRL'], 'IRL': ['IE'],
          'LV': ['LVA'], 'LVA': ['LV'],
          'LT': ['LTU'], 'LTU': ['LT'],
          'LU': ['LUX'], 'LUX': ['LU'],
          'MT': ['MLT'], 'MLT': ['MT'],
          'NL': ['NLD'], 'NLD': ['NL'],
          'PL': ['POL'], 'POL': ['PL'],
          'PT': ['PRT'], 'PRT': ['PT'],
          'RO': ['ROU'], 'ROU': ['RO'],
          'SK': ['SVK'], 'SVK': ['SK'],
          'SI': ['SVN'], 'SVN': ['SI'],
          'CH': ['CHE'], 'CHE': ['CH'],
          'NO': ['NOR'], 'NOR': ['NO'],
          'IS': ['ISL'], 'ISL': ['IS'],
          'TR': ['TUR'], 'TUR': ['TR'],
          'MK': ['MKD'], 'MKD': ['MK'],
          'RS': ['SRB'], 'SRB': ['RS'],
          'ME': ['MNE'], 'MNE': ['ME'],
          'AL': ['ALB'], 'ALB': ['AL'],
          'BA': ['BIH'], 'BIH': ['BA'],
          'MD': ['MDA'], 'MDA': ['MD'],
          'UA': ['UKR'], 'UKR': ['UA'],
          'XK': ['XKX'], 'XKX': ['XK'],
          'RU': ['RUS'], 'RUS': ['RU']
        };
        
        if (codeMapping[item.code]) {
          alternativeCodes.push(...codeMapping[item.code]);
        }
        
        for (const altCode of alternativeCodes) {
          originalData = data.find(dataItem => 
            dataItem.geo === altCode && 
            parseInt(dataItem.TIME_PERIOD) === selectedYear &&
            dataItem.sectperf === sectorCode
          );
                     if (originalData) break;
         }
      }
      
      return {
        code: item.code,
        value: item.value,
        isSupranational: item.isSupranational,
        isSpain: isSpain(item.code),
        obsFlag: originalData?.OBS_FLAG,
        isAverage: item.isSupranational,
        numCountries: item.code === 'EU27_2020' ? 27 : (item.code === 'EA19' ? 19 : (item.code === 'EA20' ? 20 : 0))
      };
    });

    // Mostrar TODOS los países disponibles para el ranking completo
    const sortedItems = chartItems; // Sin límite, mostrar todos
    


    // Preparar datos para Chart.js
    const labels = sortedItems.map(item => getCountryNameFromCode(item.code, language));
    const values = sortedItems.map(item => item.value);
    
    // Determinar colores
    const backgroundColor = sortedItems.map(item => {
      if (item.isSupranational) {
        if (item.code === 'EU27_2020') return CHART_PALETTE.YELLOW;
        if (item.code.startsWith('EA')) return CHART_PALETTE.GREEN;
      }
      
      if (item.isSpain) return CHART_PALETTE.HIGHLIGHT;
      return getPatentsSectorColor(); // Usar color del sector
    });

    const borderColor = backgroundColor.map(color => color);

    return {
      labels,
      datasets: [{
        label: t.patents,
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.85
      }],
      sortedItems: chartItems // Devolver TODOS los países para cálculo de ranking correcto
    };
  };



  // Función para obtener nombre localizado del país - Sincronizada con PatentsEuropeanMap
  const getCountryNameFromCode = (code: string, language: 'es' | 'en'): string => {
    // Primero buscar directamente en el mapeo
    if (code in countryCodeMapping) {
      return countryCodeMapping[code][language];
    }
    
    // Mapeo de ISO3 a ISO2 para códigos comunes
    const codeMapping: Record<string, string> = {
      'AUT': 'AT', 'BEL': 'BE', 'BGR': 'BG', 'CYP': 'CY', 'CZE': 'CZ',
      'DEU': 'DE', 'DNK': 'DK', 'EST': 'EE', 'GRC': 'EL', 'ESP': 'ES',
      'FIN': 'FI', 'FRA': 'FR', 'HRV': 'HR', 'HUN': 'HU', 'IRL': 'IE',
      'ITA': 'IT', 'LTU': 'LT', 'LUX': 'LU', 'LVA': 'LV', 'MLT': 'MT',
      'NLD': 'NL', 'POL': 'PL', 'PRT': 'PT', 'ROU': 'RO', 'SWE': 'SE',
      'SVN': 'SI', 'SVK': 'SK', 'GBR': 'UK', 'CHE': 'CH', 'NOR': 'NO',
      'IS': 'IS', 'TUR': 'TR', 'MNE': 'ME', 'MKD': 'MK', 'ALB': 'AL',
      'SRB': 'RS', 'BIH': 'BA', 'MDA': 'MD', 'UKR': 'UA', 'XKX': 'XK',
      'RUS': 'RU'
    };
    
    // Si es ISO3, convertir a ISO2 y buscar
    if (code.length === 3 && code in codeMapping) {
      const iso2Code = codeMapping[code];
      if (iso2Code in countryCodeMapping) {
        return countryCodeMapping[iso2Code][language];
      }
    }
    
    // Buscar en las banderas
    const flagInfo = countryFlags.find(flag => flag.code === code || flag.iso3 === code);
    if (flagInfo) {
      // Si estamos en inglés, usamos el nombre del país directamente
      if (language === 'en') {
        return flagInfo.country;
      }
      
      // Para español, intentamos encontrar una traducción
      // Primero verificamos si podemos encontrar un mapeo por el código ISO2
      if (flagInfo.code && countryCodeMapping[flagInfo.code]) {
        return countryCodeMapping[flagInfo.code].es;
      }
      
      // Si no hay mapeo, usamos el nombre en el archivo de banderas
      return flagInfo.country;
    }
    
    // Fallback: devolver el código si no se encuentra
    return code;
  };

  // Funciones auxiliares sincronizadas con el mapa
  const getEUValue = (year: number, sector: string): number | null => {
    const euData = data.filter(item => {
      const isEU = item.geo === 'EU27_2020';
      const yearMatch = parseInt(item.TIME_PERIOD) === year;
      const sectorMatch = item.sectperf === sector;
      
      return isEU && yearMatch && sectorMatch;
    });
    
    if (euData.length > 0 && euData[0].OBS_VALUE) {
      return parseFloat(euData[0].OBS_VALUE);
    }
    
    return null;
  };

  const getSpainValue = (year: number, sector: string): number | null => {
    const spainData = data.filter(item => {
      const isSpain = item.geo === 'ES';
      const yearMatch = parseInt(item.TIME_PERIOD) === year;
      const sectorMatch = item.sectperf === sector;
      
      return isSpain && yearMatch && sectorMatch;
    });
    
    if (spainData.length > 0 && spainData[0].OBS_VALUE) {
      return parseFloat(spainData[0].OBS_VALUE);
    }
    
    return null;
  };

  const formatNumberComplete = (value: number, decimals: number = 0): string => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Obtener color del sector para las barras
  const getPatentsSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear códigos de sector a IDs normalizados
    if (normalizedId === 'total' || normalizedId === 'all sectors' || normalizedId === 'all') 
      normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'business enterprise sector') 
      normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'government sector') 
      normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'higher education sector') 
      normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'private non-profit sector') 
      normalizedId = 'nonprofit';
    
    // Obtener color del sector usando los nuevos colores de patentes
    return PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
  };

  // Función para obtener el color del sector para el título
  const getSectorTitleColor = () => {
    // Normalizar el sector de la misma manera que getSectorColor
    let normalizedId = selectedSector.toLowerCase();
    
    if (normalizedId === 'total' || normalizedId === 'all sectors' || normalizedId === 'all') 
      normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'business enterprise sector') 
      normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'government sector') 
      normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'higher education sector') 
      normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'private non-profit sector') 
      normalizedId = 'nonprofit';
    
    // Obtener el color base del sector usando los nuevos colores de patentes
    const sectorColor = PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Función para obtener descripción de flags - Sincronizada con PatentsEuropeanMap
  const getLabelDescription = (label: string, language: 'es' | 'en'): string => {
    const labelDescriptions: Record<string, { es: string, en: string }> = {
      'e': { es: 'Estimado', en: 'Estimated' },
      'p': { es: 'Provisional', en: 'Provisional' },
      'b': { es: 'Ruptura en la serie', en: 'Break in series' },
      'd': { es: 'Definición difiere', en: 'Definition differs' },
      'u': { es: 'Baja fiabilidad', en: 'Low reliability' },
      'bd': { es: 'Ruptura en la serie y definición difiere', en: 'Break in series and definition differs' },
      'bp': { es: 'Ruptura en la serie y provisional', en: 'Break in series and provisional' },
      'dp': { es: 'Definición difiere y provisional', en: 'Definition differs and provisional' },
      'ep': { es: 'Estimado y provisional', en: 'Estimated and provisional' }
    };
    
    return labelDescriptions[label]?.[language] || label;
  };

  // Función para obtener el valor del año anterior idéntica a PatentsEuropeanMap
  const getPreviousYearValue = (
    countryCode: string | undefined,
    year: number,
    sector: string
  ): number | null => {
    if (!data || data.length === 0 || !countryCode || year <= 1) {
      return null;
    }
    
    const previousYear = year - 1;
    
    // Crear un array de posibles códigos alternativos para el país
    const possibleCodes = [countryCode];
    
    // Códigos ISO mapeados más comunes
    const codeMapping: Record<string, string[]> = {
      'GRC': ['EL', 'GR'],
      'GBR': ['UK', 'GB'],
      'DEU': ['DE'],
      'FRA': ['FR'],
      'ESP': ['ES'],
      'ITA': ['IT'],
      'CZE': ['CZ'],
      'SWE': ['SE'],
      'DNK': ['DK'],
      'FIN': ['FI'],
      'AUT': ['AT'],
      'BEL': ['BE'],
      'BGR': ['BG'],
      'HRV': ['HR'],
      'CYP': ['CY'],
      'EST': ['EE'],
      'HU': ['HUN'],
      'IRL': ['IE'],
      'LV': ['LVA'],
      'LT': ['LTU'],
      'LUX': ['LU'],
      'MT': ['MLT'],
      'NLD': ['NL'],
      'PL': ['POL'],
      'PT': ['PRT'],
      'RO': ['ROU'],
      'SK': ['SVK'],
      'SI': ['SVN'],
      'CH': ['CHE'],
      'NO': ['NOR'],
      'IS': ['ISL'],
      'TR': ['TUR'],
      'MK': ['MKD'],
      'RS': ['SRB'],
      'ME': ['MNE'],
      'AL': ['ALB'],
      'BA': ['BIH'],
      'UA': ['UKR'],
      'RU': ['RUS']
    };

    // Mapeo inverso - ISO2 a ISO3
    const codeMapping2to3: Record<string, string> = {
      'EL': 'GRC',
      'UK': 'GBR',
      'GB': 'GBR',
      'DE': 'DEU',
      'FR': 'FRA',
      'ES': 'ESP',
      'IT': 'ITA',
      'CZ': 'CZE',
      'SE': 'SWE',
      'DK': 'DNK',
      'FI': 'FIN',
      'AT': 'AUT',
      'BE': 'BEL',
      'BG': 'BGR',
      'HR': 'HRV',
      'CY': 'CYP',
      'EE': 'EST',
      'HU': 'HUN',
      'IE': 'IRL',
      'LV': 'LVA',
      'LT': 'LTU',
      'LU': 'LUX',
      'MT': 'MLT',
      'NL': 'NLD',
      'PL': 'POL',
      'PT': 'PRT',
      'RO': 'ROU',
      'SK': 'SVK',
      'SI': 'SVN',
      'CH': 'CHE',
      'NO': 'NOR',
      'IS': 'ISL',
      'TR': 'TUR',
      'MK': 'MKD',
      'RS': 'SRB',
      'ME': 'MNE',
      'AL': 'ALB',
      'BA': 'BIH',
      'UA': 'UKR',
      'RU': 'RUS'
    };
    
    // Añadir códigos alternativos del mapeo
    if (countryCode.length === 3 && countryCode in codeMapping) {
      possibleCodes.push(...codeMapping[countryCode]);
    } else if (countryCode.length === 2 && countryCode in codeMapping2to3) {
      possibleCodes.push(codeMapping2to3[countryCode]);
    }
    
    // Buscar datos del año anterior utilizando todos los códigos alternativos
    for (const code of possibleCodes) {
      const prevYearData = data.filter(item => {
        const geoMatch = item.geo === code;
        const yearMatch = parseInt(item.TIME_PERIOD) === previousYear;
        const sectorMatch = item.sectperf === sector;
        
        return geoMatch && yearMatch && sectorMatch;
      });
      
      if (prevYearData.length > 0 && prevYearData[0].OBS_VALUE) {
        const prevValue = parseFloat(prevYearData[0].OBS_VALUE);
        return prevValue;
      }
    }
    
    return null;
  };

  const getYoyComparison = (country: string, value: number): string => {
    const previousYearValue = getPreviousYearValue(country, selectedYear, sectorCode);
    
    if (previousYearValue !== null && previousYearValue !== 0) {
      // Aplicar el mismo cálculo de promedios que en el valor actual
      let adjustedPrevValue = previousYearValue;
      if (country === 'EU27_2020') {
        adjustedPrevValue = Math.round(previousYearValue / 27);
      } else if (country === 'EA19') {
        adjustedPrevValue = Math.round(previousYearValue / 19);
      } else if (country === 'EA20') {
        adjustedPrevValue = Math.round(previousYearValue / 20);
      }
      
      const difference = value - adjustedPrevValue;
      const percentDiff = (difference / adjustedPrevValue) * 100;
      const formattedDiff = percentDiff.toFixed(1);
      const isPositive = difference > 0;
      
      return `
        <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
          </svg>
          <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
        </div>
      `;
    }
    
    return `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',  // solo busca la barra más cercana
      axis: 'y',        // solo considera la coordenada vertical
      intersect: true   // exige que el puntero esté dentro de la barra
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    layout: {
      padding: {
        top: 15,
        right: 20,
        bottom: 35,
        left: 15
      }
    },
    // Asegurar que no hay límites en la visualización
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 4
      }
    },
    scales: {
      x: {
        display: false, // Ocultar todo el eje X
        title: {
          display: false,
          text: t.axisLabel
        },
        grid: {
          display: false // Eliminar líneas de cuadrícula
        },
        border: {
          display: false // Ocultar el borde del eje
        },
        ticks: {
          display: false // Ocultar los valores numéricos del eje
        }
      },
      y: {
        grid: {
          display: false, // Eliminar líneas de cuadrícula
        },
                   ticks: {
          color: '#333',
             font: {
            size: 12,
            weight: 'normal',
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          },
          // Asegurar que se muestren todas las etiquetas
          autoSkip: false
        },
        border: {
          color: '#E5E7EB' // Borde de eje más suave
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false // Desactivamos el tooltip nativo de Chart.js
      }
    },
    onHover: (event: ChartEvent, elements: Array<unknown>) => {
      // Actualizar el estilo del cursor 
      const chartCanvas = event.native?.target as HTMLElement;
      if (chartCanvas) {
        chartCanvas.style.cursor = elements?.length ? 'pointer' : 'default';
        
        // Si no hay elementos activos, ocultar el tooltip
        if (!elements?.length) {
          hideGlobalTooltip();
          return;
        }

        // Procesar el tooltip solo si hay un elemento activo
        if (elements.length > 0 && event.native) {
          const mouse = event.native as MouseEvent;
          const chartIndex = (elements[0] as { index: number }).index;
          
          // Usar directamente el índice de Chart.js
          const chartItem = chartData.sortedItems[chartIndex];
          if (!chartItem) {
            return;
          }

          const country = chartItem.code;
          const value = chartItem.value;
          const flagCode = chartItem.obsFlag;
          
          // Calcular el ranking exactamente igual que en el mapa
          let rank = null;
          if (!chartItem.isSupranational) {
            // Usar el mismo sistema de ranking que el mapa
            const allCountriesForRanking = new Map<string, number>();
            
            // Poblar el mapa con todos los países (sin entidades supranacionales)
            chartData.sortedItems.forEach(item => {
              if (!item.isSupranational) {
                allCountriesForRanking.set(item.code, item.value);
              }
            });
            
            // Crear array ordenado para calcular posición
            const sortedCountries: [string, number][] = [];
            allCountriesForRanking.forEach((val, code) => {
              sortedCountries.push([code, val]);
            });
            
            sortedCountries.sort((a, b) => b[1] - a[1]);
            
            // Encontrar posición del país actual
            const position = sortedCountries.findIndex(([code, ]) => code === chartItem.code);
            if (position !== -1) {
              rank = position + 1;
            }
          }
          
          // Construir el contenido del tooltip
          const flagUrl = getCountryFlagUrl(country);
          const countryName = getCountryNameFromCode(country, language);
          
          // Preparar comparación YoY
          const yoyComparisonHtml = getYoyComparison(country, value);
          
          // Preparar comparaciones exactamente igual que en el mapa
          const isSpainCountry = country === 'ES';
          const isEUEntity = country === 'EU27_2020';
          
          const euValue = !isEUEntity ? getEUValue(selectedYear, sectorCode) : null;
          const euAverageValue = euValue !== null ? Math.round(euValue / 27) : null;
          const spainValue = !isSpainCountry ? getSpainValue(selectedYear, sectorCode) : null;

          let comparisonsHtml = '';
          
          // Solo mostrar comparaciones si el país actual tiene datos
          if (value !== null) {
            // Comparación con la UE
            if (!isEUEntity && euAverageValue !== null) {
              const difference = value - euAverageValue;
              const percentDiff = (difference / euAverageValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs Media UE (${formatNumberComplete(Math.round(euAverageValue), 0)}):` : 
                    `vs Avg UE (${formatNumberComplete(Math.round(euAverageValue), 0)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              }

            // Comparación con España
            if (!isSpainCountry && spainValue !== null) {
              const difference = value - spainValue;
              const percentDiff = (difference / spainValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs España (${formatNumberComplete(Math.round(spainValue), 0)}):` : 
                    `vs Spain (${formatNumberComplete(Math.round(spainValue), 0)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
            }
              }

          // Descripción de flag si existe
          let flagDescription = '';
          if (flagCode && getLabelDescription(flagCode, language)) {
            flagDescription = getLabelDescription(flagCode, language);
          }
          
          // Obtener información de competencia idéntica a PatentsEuropeanMap
          const getCompetitorCountries = (): string => {
            if (chartItem.isSupranational || value === null) return '';
            
            // Crear array ordenado de países (sin entidades supranacionales)
            const sortedValues: [string, number][] = [];
            chartData.sortedItems.forEach(item => {
              if (!item.isSupranational) {
                sortedValues.push([item.code, item.value]);
              }
            });
            
            sortedValues.sort((a, b) => b[1] - a[1]);
            
            const currentPosition = sortedValues.findIndex(([code, ]) => code === chartItem.code);
            
            if (currentPosition === -1) return '';
            
            // Obtener competidores cercanos (1 por arriba y 1 por abajo)
            const competitors: Array<{code: string, value: number, position: number, type: 'above' | 'below'}> = [];
            
            // País por arriba (mejor ranking)
            if (currentPosition > 0) {
              const [aboveCode, aboveValue] = sortedValues[currentPosition - 1];
              competitors.push({
                code: aboveCode, 
                value: aboveValue, 
                position: currentPosition, 
                type: 'above'
              });
            }
            
            // País por abajo (peor ranking)
            if (currentPosition < sortedValues.length - 1) {
              const [belowCode, belowValue] = sortedValues[currentPosition + 1];
              competitors.push({
                code: belowCode, 
                value: belowValue, 
                position: currentPosition + 2, 
                type: 'below'
              });
            }
            
            if (competitors.length === 0) return '';
            
            // Construir HTML para competidores
            let competitorsHtml = `
              <div class="space-y-1 border-t border-gray-100 pt-3 mt-3">
                <div class="text-xs text-gray-500 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                    <path d="M8 3l4 8 5-5v7H3V6l5 5 4-8z"></path>
                  </svg>
                  ${language === 'es' ? 'Comparación con el ranking' : 'Ranking comparison'}
                </div>
            `;
            
            competitors.forEach(competitor => {
              const competitorName = getCountryNameFromCode(competitor.code, language);
              const formattedValue = formatNumberComplete(Math.round(competitor.value), 0);
              const difference = Math.abs(value - competitor.value);
              const percentDiff = value > 0 ? ((difference / value) * 100).toFixed(1) : '0.0';
              
              const isAbove = competitor.type === 'above';
              const arrowIcon = isAbove ? 
                'M12 19V5M5 12l7-7 7 7' : // Flecha hacia arriba
                'M12 5v14M5 12l7 7 7-7'; // Flecha hacia abajo
              
              // Calcular la posición real en el ranking
              const competitorPosition = isAbove ? currentPosition : currentPosition + 2;
              
              // Textos explicativos según la posición
              const positionLabel = isAbove ? 
                (language === 'es' ? 'Lugar superior' : 'Position above') :
                (language === 'es' ? 'Lugar inferior' : 'Position below');
              
              const gapText = isAbove ?
                (language === 'es' ? `+${percentDiff}% más` : `+${percentDiff}% more`) :
                (language === 'es' ? `${percentDiff}% menos` : `${percentDiff}% less`);
              
              competitorsHtml += `
                <div class="bg-gray-50 p-2 rounded mb-1">
                  <div class="flex justify-between items-center text-xs">
                    <div class="flex items-center">
                      <div class="flex items-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 ${isAbove ? 'text-red-500' : 'text-green-500'}">
                          <path d="${arrowIcon}"></path>
                        </svg>
                        <span class="text-xs text-gray-500">#${competitorPosition}</span>
                      </div>
                      <span class="font-medium text-gray-700">${competitorName}</span>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-gray-800">${formattedValue}</div>
                    </div>
                  </div>
                  <div class="flex justify-between items-center mt-1">
                    <span class="text-xs text-gray-400">${positionLabel}</span>
                    <span class="text-xs font-medium ${isAbove ? 'text-red-600' : 'text-green-600'}">${gapText}</span>
                  </div>
                </div>
              `;
            });
            
            competitorsHtml += '</div>';
            
            return competitorsHtml;
          };

          const competitorsHtml = getCompetitorCountries();
          
          const tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-orange-50 border-b border-orange-100">
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${countryName}" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>${t.patents}:</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-orange-700">${formatNumberComplete(Math.round(value), 0)}</span>
                    ${flagCode ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${flagCode}</span>` : ''}
                  </div>
                  ${yoyComparisonHtml}
                </div>
                
                <!-- Ranking (si está disponible y no es entidad supranacional) -->
                ${rank !== null ? `
                <div class="mb-4">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Rank </span>
                    <span class="font-bold text-lg mx-1">${rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${chartData.sortedItems.filter(i => !i.isSupranational).length}` : `of ${chartData.sortedItems.filter(i => !i.isSupranational).length}`}</span>
                  </div>
                </div>
                ` : ''}
                
                <!-- Si hay comparaciones, mostrarlas -->
                ${comparisonsHtml ? `
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${comparisonsHtml}
                </div>
                ` : ''}
                
                <!-- Competidores directos -->
                ${competitorsHtml}
              </div>
              
              <!-- Footer con información de la bandera de observación -->
              ${flagCode && flagDescription ? `
              <div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                <span>${flagCode} - ${flagDescription}</span>
              </div>
              ` : ''}
            </div>
          `;
          
          // Posicionar el tooltip usando el evento del mouse
          positionGlobalTooltip(mouse, tooltipContent);
        }
      }
    }
  };

  // Preparar datos para el gráfico
  const chartData: ChartDataResult = prepareChartData();
  
  // Altura dinámica para el gráfico en función del número de países
  const chartHeight = Math.max(520, chartData.labels.length * 28); // Altura mínima ajustada a 520px

  // Determinar si hay datos para mostrar
  const hasData = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.sectperf === sectorCode
  ).length > 0;
  
  // Estilos para el contenedor con scroll
  const scrollContainerStyle: React.CSSProperties = {
    height: '520px', // Reducido de 540px a 520px para compensar el padding adicional
    overflowY: 'auto', // Permitir scroll vertical
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px',
    // Estilos para el scrollbar en diferentes navegadores
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: '#d1d5db #f3f4f6', // Firefox
    // Los siguientes estilos son para Webkit (Chrome, Safari, Edge)
    // No son estándar pero mejoran la apariencia
    msOverflowStyle: 'none',
  } as React.CSSProperties;

  // Si no hay datos, mostrar mensaje de no disponibilidad
  if (!hasData) {
  return (
      <div className="flex justify-center items-center bg-gray-50 rounded-lg border border-gray-200" style={{ height: '620px' }}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: '620px' }} ref={containerRef}>
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {t.title} · {selectedYear}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorTitleColor())?.copy({ opacity: 0.15 })}` }}>
          {(() => {
            // Mapeo directo para códigos de sector y nombres normalizados
            const getSectorDisplayName = (sector: string) => {
              const normalizedSector = sector.toLowerCase();
              
              if (language === 'es') {
                switch (normalizedSector) {
                  case 'total':
                  case 'all sectors':
                    return 'Todos los sectores';
                  case 'bes':
                  case 'business':
                  case 'business enterprise sector':
                    return 'Sector empresarial';
                  case 'gov':
                  case 'government':
                  case 'government sector':
                    return 'Administración Pública';
                  case 'hes':
                  case 'education':
                  case 'higher education sector':
                    return 'Enseñanza Superior';
                                     case 'pnp':
                   case 'nonprofit':
                   case 'private non-profit sector':
                     return 'Instituciones Privadas sin Fines de Lucro';
                  default:
                    return 'Todos los sectores';
                }
              } else {
                                 switch (normalizedSector) {
                   case 'total':
                   case 'all sectors':
                     return 'All sectors';
                   case 'bes':
                   case 'business':
                   case 'business enterprise sector':
                     return 'Business enterprise sector';
                   case 'gov':
                   case 'government':
                   case 'government sector':
                     return 'Government sector';
                   case 'hes':
                   case 'education':
                   case 'higher education sector':
                     return 'Higher education sector';
                   case 'pnp':
                   case 'nonprofit':
                   case 'private non-profit sector':
                     return 'Private non-profit sector';
                  default:
                    return 'All Sectors';
                }
              }
            };
            
            return getSectorDisplayName(selectedSector);
          })()}
        </div>
      </div>
      
      <div style={scrollContainerStyle} ref={scrollContainerRef} className="custom-scrollbar">
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
          <Bar 
            ref={chartRef}
            data={chartData}
            options={options}
          />
            </div>
          </div>
          
          {/* Etiqueta del eje X centrada */}
      <div className="text-center mt-4 mb-2 text-sm font-medium text-gray-700">
            {t.axisLabel}
          </div>
    </div>
  );
};

export default PatentsRankingChart; 