import React, { useRef, useEffect, useState } from 'react';
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

// Definir colores específicos para los componentes de patentes - Paleta de innovación y tecnología
const PATENTS_SECTOR_COLORS = {
  total: '#2E7D32',        // Verde tecnológico para el total (representa innovación sostenible)
  business: '#FF6F00',     // Naranja vibrante para empresas (representa emprendimiento e innovación corporativa)
  government: '#1565C0',   // Azul institucional para gobierno (representa políticas de innovación)
  education: '#7B1FA2',    // Púrpura para educación (representa investigación académica avanzada)
  nonprofit: '#D32F2F'     // Rojo para organizaciones sin fines de lucro (representa impacto social)
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
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

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
      
      // Crear hoja de estilo inline para las clases de Tailwind
      const styleSheet = document.createElement('style');
      styleSheet.id = 'patents-tooltip-styles';
      styleSheet.textContent = `
        #patents-chart-tooltip {
          transform-origin: center;
          transform: scale(0.95);
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
        pointer-events: none;
        }
        #patents-chart-tooltip.visible {
          opacity: 1 !important;
          transform: scale(1);
        }
        #patents-chart-tooltip .text-green-600 { color: #059669; }
        #patents-chart-tooltip .text-red-600 { color: #DC2626; }
        #patents-chart-tooltip .text-orange-700 { color: #C2410C; }
        #patents-chart-tooltip .bg-orange-50 { background-color: #FFF7ED; }
        #patents-chart-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
        #patents-chart-tooltip .border-orange-100 { border-color: #FFEDD5; }
        #patents-chart-tooltip .border-gray-100 { border-color: #F3F4F6; }
        #patents-chart-tooltip .text-gray-500 { color: #6B7280; }
        #patents-chart-tooltip .text-gray-800 { color: #1F2937; }
        #patents-chart-tooltip .text-gray-600 { color: #4B5563; }
        #patents-chart-tooltip .text-yellow-500 { color: #F59E0B; }
        #patents-chart-tooltip .rounded-lg { border-radius: 0.5rem; }
        #patents-chart-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        #patents-chart-tooltip .p-3 { padding: 0.75rem; }
        #patents-chart-tooltip .p-4 { padding: 1rem; }
        #patents-chart-tooltip .p-2 { padding: 0.5rem; }
        #patents-chart-tooltip .pt-3 { padding-top: 0.75rem; }
        #patents-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #patents-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #patents-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #patents-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #patents-chart-tooltip .mr-2 { margin-right: 0.5rem; }
        #patents-chart-tooltip .mt-1 { margin-top: 0.25rem; }
        #patents-chart-tooltip .mt-2 { margin-top: 0.5rem; }
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
        #patents-chart-tooltip .w-44 { width: 11rem; }
        #patents-chart-tooltip .w-full { width: 100%; }
        #patents-chart-tooltip .rounded { border-radius: 0.25rem; }
        #patents-chart-tooltip .rounded-md { border-radius: 0.375rem; }
        #patents-chart-tooltip .overflow-hidden { overflow: hidden; }
        #patents-chart-tooltip .border-t { border-top-width: 1px; }
        #patents-chart-tooltip .border-b { border-bottom-width: 1px; }
        #patents-chart-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
        #patents-chart-tooltip .max-w-xs { max-width: 20rem; }
        #patents-chart-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
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
    
    // Cancelar cualquier temporizador pendiente
    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    // Actualizar estado de visibilidad
    setIsTooltipVisible(true);
    
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
  const hideGlobalTooltip = (immediately: boolean = false): void => {
    // Si el tooltip no está visible según el estado, no hacemos nada
    if (!isTooltipVisible) return;
    
    const tooltipEl = document.getElementById('patents-chart-tooltip');
    if (!tooltipEl) return;
    
    // Limpiar cualquier temporizador pendiente
    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
      if (immediately) {
      // Ocultar inmediatamente si se solicita
      tooltipEl.style.display = 'none';
      tooltipEl.style.opacity = '0';
      tooltipEl.classList.remove('visible');
      setIsTooltipVisible(false);
      } else {
      // Quitar la clase visible primero para la animación
      tooltipEl.classList.remove('visible');
      
      // Después de la transición, ocultar el tooltip
      tooltipTimeoutRef.current = window.setTimeout(() => {
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
          setIsTooltipVisible(false);
          tooltipTimeoutRef.current = null;
        }
      }, 150); // Tiempo suficiente para la animación
    }
  };

  // Añadir escuchadores para eventos del contenedor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Ocultar tooltip cuando el ratón sale del contenedor
    const handleMouseLeave = () => {
      hideGlobalTooltip();
    };
    
    // Ocultar tooltip al hacer scroll
    const handleScroll = () => {
      hideGlobalTooltip(true); // Ocultar inmediatamente en scroll
    };
    
    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Obtener el contenedor de scroll si existe
    const scrollContainer = container.querySelector('.custom-scrollbar');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    // Añadir un detector global para clicks fuera
    const handleDocumentClick = (e: MouseEvent) => {
      // Si el click es fuera del contenedor, ocultar el tooltip
      if (container && !container.contains(e.target as Node)) {
        hideGlobalTooltip(true);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    
    // Ocultar tooltip al cambiar de pestaña
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hideGlobalTooltip(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Limpiar el tooltip al desmontar el componente
      if (tooltipTimeoutRef.current !== null) {
        window.clearTimeout(tooltipTimeoutRef.current);
      }
      
      const tooltipEl = document.getElementById('patents-chart-tooltip');
      const styleSheet = document.getElementById('patents-tooltip-styles');
      
      if (tooltipEl && tooltipEl.parentNode) {
        tooltipEl.parentNode.removeChild(tooltipEl);
      }
      
      if (styleSheet && styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, [isTooltipVisible]);

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

  // Preparar datos del gráfico
  const prepareChartData = (): ChartDataResult => {
    // Filtrar y procesar datos
    const filteredData = data.filter(item => 
      parseInt(item.TIME_PERIOD) === selectedYear &&
      item.sectperf === sectorCode &&
      item.OBS_VALUE && 
      item.OBS_VALUE !== ':' &&
      (EUROPEAN_COUNTRY_CODES.includes(item.geo) || isSupranationalEntity(item.geo))
    );

    // Crear elementos del gráfico con manejo de promedios
    const chartItems: ChartDataItem[] = filteredData.map(item => {
      let value = parseFloat(item.OBS_VALUE);
      let isAverage = false;
      let numCountries = 0;
      
      // Calcular promedios para entidades supranacionales
      if (item.geo === 'EU27_2020') {
        // Promedio para Unión Europea (27 países)
        value = Math.round(value / 27);
        isAverage = true;
        numCountries = 27;
      } else if (item.geo === 'EA19') {
        // Promedio para Zona Euro 2015-2022 (19 países)
        value = Math.round(value / 19);
        isAverage = true;
        numCountries = 19;
      } else if (item.geo === 'EA20') {
        // Promedio para Zona Euro desde 2023 (20 países)
        value = Math.round(value / 20);
        isAverage = true;
        numCountries = 20;
      }
      
      return {
      code: item.geo,
        value: value,
      isSupranational: isSupranationalEntity(item.geo),
      isSpain: isSpain(item.geo),
        obsFlag: item.OBS_FLAG,
        isAverage: isAverage,
        numCountries: numCountries
      };
    });

    // Ordenar por valor descendente y limitar a 25
    const sortedItems = chartItems
      .filter(item => !isNaN(item.value) && item.value >= 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);

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
      return getSectorColor(); // Usar color del sector
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
      sortedItems
    };
  };

  // Formatear valores
  const formatValue = (value: number): string => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return value.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
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
      'ISL': 'IS', 'TUR': 'TR', 'MNE': 'ME', 'MKD': 'MK', 'ALB': 'AL',
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

  // Obtener valor del año anterior para comparación
  // Obtener color del sector
  const getSectorColor = (): string => {
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

  const getYoyComparison = (country: string, value: number): string => {
    const previousYear = selectedYear - 1;
    const previousRecord = data.find(item => 
      item.geo === country && 
      parseInt(item.TIME_PERIOD) === previousYear &&
      item.sectperf === sectorCode
    );
    
    if (previousRecord && previousRecord.OBS_VALUE && previousRecord.OBS_VALUE !== ':') {
      const previousValue = parseFloat(previousRecord.OBS_VALUE);
      if (!isNaN(previousValue) && previousValue > 0) {
        const change = ((value - previousValue) / previousValue) * 100;
        const changeText = change >= 0 ? '+' : '';
        return `${changeText}${change.toFixed(1)}%`;
      }
    }
    
    return language === 'es' ? 'N/D' : 'N/A';
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        right: 15,
        bottom: 10,
        left: 10
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
          }
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
          const index = (elements[0] as { index: number }).index;
          
          // Usar los datos ordenados almacenados en chartData
          const chartItem = chartData.sortedItems[index];
          if (!chartItem) {
            return;
          }

          const country = chartItem.code;
          const value = chartItem.value;
          const flagCode = chartItem.obsFlag;
          const isAverage = chartItem.isAverage;
          const numCountries = chartItem.numCountries;
          
          // Calcular el ranking excluyendo entidades supranacionales para coherencia con el mapa
          let rank = index + 1;
          if (!chartItem.isSupranational) {
            // Contar solo países (no entidades supranacionales) antes de este elemento
            const countriesBeforeThis = chartData.sortedItems.slice(0, index).filter(item => !item.isSupranational).length;
            rank = countriesBeforeThis + 1;
          }
          
          // Construir el contenido del tooltip
          const flagUrl = getCountryFlagUrl(country);
          const countryName = getCountryNameFromCode(country, language);
          
          // Preparar etiqueta OBS_FLAG
          let obsTagHtml = '';
          if (flagCode) {
            obsTagHtml = `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${flagCode}</span>`;
          }
          
          // Preparar comparación YoY
          const yoyComparisonHtml = getYoyComparison(country, value);
          
          // Preparar nota sobre promedio si aplica
          let averageNote = '';
          if (isAverage && numCountries) {
            averageNote = `
              <div class="text-xs text-gray-500 mt-2 bg-orange-50 p-2 rounded">
                <span class="font-medium">${language === 'es' ? 'Promedio' : 'Average'}</span>: 
                ${language === 'es' 
                  ? `Valor calculado dividiendo el total por ${numCountries} países` 
                  : `Value calculated by dividing the total by ${numCountries} countries`}
                </div>
              `;
          }
          
          // Preparar comparaciones con UE y España
          const euItem = chartData.sortedItems.find(item => item.code === 'EU27_2020');
          const spainItem = chartData.sortedItems.find(item => item.code === 'ES');
          let comparisonsHtml = '';
          
          // Comparativa con la UE (media) - usar el mismo cálculo que en el mapa
          if (euItem && !chartItem.isSupranational) {
            // Usar el valor promedio calculado (ya dividido por 27 en prepareChartData)
            const euValue = euItem.value;
            const difference = value - euValue;
            const percentDiff = (difference / euValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs Media UE (${formatValue(Math.round(euValue))}):` : 
                  `vs Avg UE (${formatValue(Math.round(euValue))}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              }

          // Comparativa con España
          if (spainItem && country !== 'ES' && !chartItem.isSupranational) {
            const difference = value - spainItem.value;
            const percentDiff = (difference / spainItem.value) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs España (${formatValue(Math.round(spainItem.value))}):` : 
                  `vs Spain (${formatValue(Math.round(spainItem.value))}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              }

          // Descripción de flag si existe
          let flagDescription = '';
          if (flagCode && getLabelDescription(flagCode, language)) {
            flagDescription = getLabelDescription(flagCode, language);
          }
          
          const tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-orange-50 border-b border-orange-100">
                ${flagUrl ? `<div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" alt="${country}" class="w-full h-full object-cover" />
                </div>` : ''}
                <h3 class="text-lg font-bold text-gray-800">${countryName}</h3>
              </div>
              
              <!-- Contenido del tooltip -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m3 17 6-6 4 4 8-8"></path><path d="m14 7 3 3 3-3"></path></svg>
                    <span>${t.patents}:</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-orange-700">
                      ${formatValue(Math.round(value))}
                    </span>
                    ${isAverage ? `<span class="text-xs ml-1 text-gray-600">${language === 'es' ? '(promedio)' : '(average)'}</span>` : ''}
                    ${obsTagHtml}
                  </div>
                  ${yoyComparisonHtml}
                </div>
                
                ${averageNote}
                
                <!-- Ranking (si está disponible y no es entidad supranacional) -->
                ${!chartItem.isSupranational ? `
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
                
                <!-- Comparativas -->
                ${comparisonsHtml ? `
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${comparisonsHtml}
                </div>
                ` : ''}
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
  const chartHeight = Math.max(400, chartData.labels.length * 25);

  // Determinar si hay datos para mostrar
  const hasData = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.sectperf === sectorCode
  ).length > 0;
  
  // Estilos para el contenedor con scroll
  const scrollContainerStyle: React.CSSProperties = {
    height: '400px',
    overflowY: 'auto',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6',
    msOverflowStyle: 'none',
  } as React.CSSProperties;

  return (
    <div ref={containerRef} className="relative h-full w-full">
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
      
      {hasData ? (
        <>
          <div className="custom-scrollbar" style={scrollContainerStyle}>
            <div className="w-full" style={{ minHeight: `${chartHeight}px` }}>
              <Bar ref={chartRef} data={chartData} options={options} />
            </div>
          </div>
          
          {/* Etiqueta del eje X centrada */}
          <div className="text-center mt-2 mb-2 text-sm font-medium text-gray-700">
            {t.axisLabel}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[450px] bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg">{t.noData}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatentsRankingChart; 