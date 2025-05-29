import React, { useRef, useEffect } from 'react';
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
import { Bar } from 'react-chartjs-2';
import * as d3 from 'd3';
import countryFlagsData from '../logos/country_flags.json';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';
import { CooperationPartnerType } from '../pages/Patents/index';

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Tipo para el modo de visualización de patentes
export type PatentsDisplayType = 'number' | 'per_million_inhabitants';

// Interfaz para country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Asegurar el tipo correcto
const countryFlags = countryFlagsData as CountryFlag[];

// Interfaz para los datos de patentes_europa.csv
interface PatentsData {
  STRUCTURE?: string;
  STRUCTURE_ID?: string;
  STRUCTURE_NAME?: string;
  freq?: string;
  'Time frequency'?: string;
  coop_ptn?: string;
  'Cooperation partners'?: string;
  unit?: string;
  'Unit of measure'?: string;
  geo: string;       // Código del país (AL, AT, BE, etc.)
  'Geopolitical entity (reporting)'?: string;
  TIME_PERIOD: string; // Año
  Time?: string;
  OBS_VALUE: string;   // Número de patentes
  'Observation value'?: string;
  OBS_FLAG?: string;   // Flag de observación (ej: 'p' para provisional)
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
  [key: string]: string | undefined;
}

interface PatentsRankingChartProps {
  data: PatentsData[];
  selectedYear: number;
  language: 'es' | 'en';
  patsDisplayType?: PatentsDisplayType;
  cooperationPartner?: CooperationPartnerType;
}

// Interfaz para los elementos del gráfico
interface ChartDataItem {
  code: string;
  value: number;
  flag?: string;
  isSupranational: boolean;
  isSpain: boolean;
  obsFlag?: string;
  isAverage?: boolean;
  numCountries?: number;
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

// Colores para la gráfica (igual que el mapa)
const CHART_PALETTE = {
  DEFAULT: '#37474F',      // Gris azulado para patentes
  HIGHLIGHT: '#CC0000',    // Rojo para España
  YELLOW: '#FFC107',       // Amarillo para Unión Europea
  GREEN: '#009900'         // Verde para las zonas Euro
};

// Mapeo de códigos de país a nombres (igual que el mapa)
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
  'NO': {es: 'Noruega', en: 'Norway'},
  'CH': {es: 'Suiza', en: 'Switzerland'},
  'IS': {es: 'Islandia', en: 'Iceland'},
  'TR': {es: 'Turquía', en: 'Turkey'},
  // Países de los Balcanes y Europa del Este
  'AL': {es: 'Albania', en: 'Albania'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'ME': {es: 'Montenegro', en: 'Montenegro'},
  'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'BY': {es: 'Bielorrusia', en: 'Belarus'},
  'RU': {es: 'Rusia', en: 'Russia'},
  // Países nórdicos y otros
  'FO': {es: 'Islas Feroe', en: 'Faroe Islands'},
  'GL': {es: 'Groenlandia', en: 'Greenland'},
  // Microstados europeos
  'AD': {es: 'Andorra', en: 'Andorra'},
  'LI': {es: 'Liechtenstein', en: 'Liechtenstein'},
  'MC': {es: 'Mónaco', en: 'Monaco'},
  'SM': {es: 'San Marino', en: 'San Marino'},
  'VA': {es: 'Ciudad del Vaticano', en: 'Vatican City'},
  // Otros países fuera de Europa que pueden aparecer
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CA': {es: 'Canadá', en: 'Canada'},
  'JP': {es: 'Japón', en: 'Japan'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'},
  'CN': {es: 'China', en: 'China'},
  'IN': {es: 'India', en: 'India'},
  'AU': {es: 'Australia', en: 'Australia'},
  'NZ': {es: 'Nueva Zelanda', en: 'New Zealand'},
  'IL': {es: 'Israel', en: 'Israel'},
  'SG': {es: 'Singapur', en: 'Singapore'},
  'TW': {es: 'Taiwán', en: 'Taiwan'},
  'HK': {es: 'Hong Kong', en: 'Hong Kong'},
  'BR': {es: 'Brasil', en: 'Brazil'},
  'MX': {es: 'México', en: 'Mexico'},
  'AR': {es: 'Argentina', en: 'Argentina'},
  'CL': {es: 'Chile', en: 'Chile'},
  'ZA': {es: 'Sudáfrica', en: 'South Africa'}
};

const PatentsRankingChart: React.FC<PatentsRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  patsDisplayType,
  cooperationPartner
}) => {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      const tooltip = document.getElementById('chartjs-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, []);

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de países por patentes",
      axisLabel: "Patentes",
      noData: "No hay datos disponibles para este año",
      patents: "Patentes"
    },
    en: {
      title: "Country Ranking by Patents",
      axisLabel: "Patents", 
      noData: "No data available for this year",
      patents: "Patents"
    }
  };

  const t = texts[language];

  // Funciones auxiliares copiadas del mapa
  const isSupranationalEntity = (code: string): boolean => {
    return ['EU27_2020', 'EU28', 'EU15', 'EA19', 'EA20', 'EFTA'].includes(code);
  };

  const isSpain = (code: string): boolean => {
    return code === 'ES';
  };

  const getCountryNameFromCode = (code: string, language: 'es' | 'en'): string => {
    return countryCodeMapping[code]?.[language] || code;
  };

  // Función para obtener la URL de la bandera del país (igual que el mapa)
function getCountryFlagUrl(countryCode: string): string {  
  if (countryCode === 'EL') {
    return 'https://flagcdn.com/gr.svg';
  }
  
  if (countryCode === 'UK') {
    return 'https://flagcdn.com/gb.svg';
  }
  
  if (countryCode === 'EU27_2020') {
    return 'https://flagcdn.com/eu.svg';
  }
  
  const foundFlag = countryFlags.find(flag => 
    flag.code.toUpperCase() === countryCode.toUpperCase() ||
    flag.iso3.toUpperCase() === countryCode.toUpperCase()
  );
  
  if (foundFlag) {
    return foundFlag.flag;
  }
  
  const lowerCode = countryCode.toLowerCase();
  const codeMapping: Record<string, string> = {
      'el': 'gr',
      'uk': 'gb'
  };
  
  const mappedCode = codeMapping[lowerCode] || lowerCode;
  return `https://flagcdn.com/${mappedCode}.svg`;
}

  // Funciones auxiliares del mapa (con filtro de coop_ptn = 'APPL')
  const getEUValue = (year: number): number | null => {
    if (!data || data.length === 0) return null;
    
    const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
    const euRecords = data.filter(record => {
      const matchesYear = parseInt(record.TIME_PERIOD) === year;
      const matchesAppl = record.coop_ptn === (cooperationPartner || 'APPL');
      const matchesUnit = record.unit === targetUnit;
      const isEU = record.geo === 'EU27_2020' || record.geo === 'EU' || record.geo === 'EU28';
      
      return matchesYear && matchesAppl && matchesUnit && isEU;
    });
    
    if (euRecords.length === 0) return null;
    const value = parseFloat(euRecords[0].OBS_VALUE);
    return isNaN(value) ? null : value;
  };

  const getSpainValue = (year: number): number | null => {
    if (!data || data.length === 0) return null;
    
    const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
    const spainRecords = data.filter(record => {
      const matchesYear = parseInt(record.TIME_PERIOD) === year;
      const matchesAppl = record.coop_ptn === (cooperationPartner || 'APPL');
      const matchesUnit = record.unit === targetUnit;
      const isSpain = record.geo === 'ES';
      
      return matchesYear && matchesAppl && matchesUnit && isSpain;
    });
    
    if (spainRecords.length === 0) return null;
    const value = parseFloat(spainRecords[0].OBS_VALUE);
    return isNaN(value) ? null : value;
  };

  const getPreviousYearValue = (countryCode: string | undefined, year: number): number | null => {
    if (!data || data.length === 0 || !countryCode) return null;
    
    const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
    const previousYear = year - 1;
    const previousYearRecords = data.filter(record => {
      const matchesYear = parseInt(record.TIME_PERIOD) === previousYear;
      const matchesAppl = record.coop_ptn === (cooperationPartner || 'APPL');
      const matchesUnit = record.unit === targetUnit;
      const matchesCountry = record.geo === countryCode;
      
      return matchesYear && matchesAppl && matchesUnit && matchesCountry;
    });
    
    if (previousYearRecords.length === 0) return null;
    const value = parseFloat(previousYearRecords[0].OBS_VALUE);
    return isNaN(value) ? null : value;
  };

  const formatNumberComplete = (value: number, decimals: number = 0): string => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Función para mostrar números exactamente como aparecen en el dataset
  const formatNumberAsInDataset = (value: number): string => {
    return Math.round(value).toString();
  };

  const getLabelDescription = (label: string, language: 'es' | 'en'): string => {
    const labelDescriptions: Record<string, { es: string, en: string }> = {
      'e': { es: 'Estimado', en: 'Estimated' },
      'p': { es: 'Provisional', en: 'Provisional' },
      'b': { es: 'Ruptura en la serie', en: 'Break in series' }
    };
    
    return labelDescriptions[label]?.[language] || label;
  };

  // Preparar datos del gráfico (igual que el mapa - solo datos APPL)
  const prepareChartData = (): ChartDataResult => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: '',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        }],
        sortedItems: []
      };
    }

    const targetUnit = (patsDisplayType || 'number') === 'number' ? 'NR' : 'P_MHAB';

    console.log(`[Patents Ranking Debug] Filtrando datos por unidad: ${targetUnit}`);
    console.log(`[Patents Ranking Debug] Total registros disponibles: ${data.length}`);

    // Filtrar datos para el año seleccionado, solo aplicantes y unidad específica
    const yearData = data.filter(record => {
      const yearMatch = parseInt(record.TIME_PERIOD) === selectedYear;
      const applMatch = record.coop_ptn === (cooperationPartner || 'APPL');
      const unitMatch = record.unit === targetUnit;
      const isEuropean = EUROPEAN_COUNTRY_CODES.includes(record.geo);
      
      return yearMatch && applMatch && unitMatch && record.OBS_VALUE && 
             (isEuropean || isSupranationalEntity(record.geo));
    });

    console.log(`[Patents Ranking Debug] Registros después de filtros: ${yearData.length}`);

    const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
    
    yearData.forEach(item => {
      const countryCode = item.geo;
      let value = parseFloat(item.OBS_VALUE || '0');
      if (isNaN(value) || value === 0) {
        console.log(`[Patents Ranking Debug] Valor inválido o cero para ${countryCode}: ${item.OBS_VALUE}`);
        return;
      }
      
      console.log(`[Patents Ranking Debug] Procesando ${countryCode}: valor original=${value}`);
      
      // Aplicar la misma lógica de promedio que el mapa para entidades supranacionales
      if (countryCode === 'EU27_2020') {
        value = Math.round(value / 27);
        console.log(`[Patents Ranking Debug] EU27_2020 promedio: ${value}`);
      } else if (countryCode === 'EA19') {
        value = Math.round(value / 19);
        console.log(`[Patents Ranking Debug] EA19 promedio: ${value}`);
      } else if (countryCode === 'EA20') {
        value = Math.round(value / 20);
        console.log(`[Patents Ranking Debug] EA20 promedio: ${value}`);
      }
      
      const isSupranational = countryCode === 'EU27_2020' || countryCode === 'EA19' || countryCode === 'EA20';
      
      // Si ya existe el país, mantener el valor más alto (por si hay duplicados)
      if (tempCountryMap.has(countryCode)) {
        const existing = tempCountryMap.get(countryCode)!;
        if (value > existing.value) {
          tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
          console.log(`[Patents Ranking Debug] Actualizando ${countryCode} con valor mayor: ${value}`);
        }
      } else {
        tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
        console.log(`[Patents Ranking Debug] Agregando ${countryCode}: ${value}`);
      }
    });

    console.log(`[Patents Ranking Debug] Países únicos procesados: ${tempCountryMap.size}`);
    console.log(`[Patents Ranking Debug] Países en el mapa:`, Array.from(tempCountryMap.keys()).sort());

    const sortedData = Array.from(tempCountryMap.values())
      .sort((a, b) => b.value - a.value);

    console.log(`[Patents Ranking Debug] Top 10 países por valor:`, 
      sortedData.slice(0, 10).map(item => `${item.code}: ${item.value}`));

    const chartItems: ChartDataItem[] = sortedData.map(item => {
      // Buscar datos originales con filtro de coop_ptn='APPL' para obtener flags correctamente
      const originalData = data.find(dataItem => 
        dataItem.geo === item.code && 
        parseInt(dataItem.TIME_PERIOD) === selectedYear &&
        dataItem.coop_ptn === (cooperationPartner || 'APPL')
      );
      
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

    // MOSTRAR TODOS los países (no limitar)
    const sortedItems = chartItems;

    const labels = sortedItems.map(item => getCountryNameFromCode(item.code, language));
    const values = sortedItems.map(item => item.value);
    
    const backgroundColor = sortedItems.map(item => {
      if (item.isSupranational) {
        if (item.code === 'EU27_2020') return CHART_PALETTE.YELLOW;
        if (item.code.startsWith('EA')) return CHART_PALETTE.GREEN;
      }
      
      if (item.isSpain) return CHART_PALETTE.HIGHLIGHT;
      return CHART_PALETTE.DEFAULT;
    });

    console.log(`[Patents Ranking Debug] Datos finales del gráfico:`, {
      totalCountries: sortedItems.length,
      topCountries: sortedItems.slice(0, 5).map(item => `${getCountryNameFromCode(item.code, language)}: ${item.value}`)
    });

    return {
      labels,
      datasets: [{
        label: t.patents,
        data: values,
        backgroundColor,
        borderColor: backgroundColor,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.85
      }],
      sortedItems: chartItems
    };
  };

  // Funciones para manejar el tooltip global (copiadas del mapa)
  const createGlobalTooltip = (): HTMLElement => {
    let tooltipElement = document.getElementById('patents-chart-tooltip');
    
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.id = 'patents-chart-tooltip';
      tooltipElement.className = 'patents-tooltip';
      
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
      
      // Crear hoja de estilo inline
      const styleSheet = document.createElement('style');
      styleSheet.id = 'patents-tooltip-styles';
      styleSheet.textContent = `
        #patents-chart-tooltip {
            transform-origin: top left;
          transform: scale(0.95);
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
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
        #patents-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #patents-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #patents-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #patents-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #patents-chart-tooltip .mr-2 { margin-right: 0.5rem; }
          #patents-chart-tooltip .ml-2 { margin-left: 0.5rem; }
        #patents-chart-tooltip .mt-1 { margin-top: 0.25rem; }
          #patents-chart-tooltip .mt-3 { margin-top: 0.75rem; }
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
        #patents-chart-tooltip .rounded { border-radius: 0.25rem; }
        #patents-chart-tooltip .overflow-hidden { overflow: hidden; }
        #patents-chart-tooltip .border-t { border-top-width: 1px; }
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

  const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
    const tooltipEl = createGlobalTooltip();
    tooltipEl.innerHTML = content;
    
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = mouseX + 10;
    let top = mouseY - (tooltipHeight / 2);
    
    if (left + tooltipWidth > windowWidth) {
      left = mouseX - tooltipWidth - 10;
    }
    
    if (top + tooltipHeight > windowHeight) {
      top = windowHeight - tooltipHeight - 10;
    }
    
    if (top < 10) {
      top = 10;
    }
    
    tooltipEl.style.left = `${Math.floor(left)}px`;
    tooltipEl.style.top = `${Math.floor(top)}px`;
    
    setTimeout(() => {
      tooltipEl.classList.add('visible');
    }, 10);
  };

  const hideGlobalTooltip = (): void => {
    const tooltipEl = document.getElementById('patents-chart-tooltip');
    if (tooltipEl) {
      tooltipEl.classList.remove('visible');
      
      setTimeout(() => {
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }, 150);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseLeave = () => {
      hideGlobalTooltip();
    };
    
    const handleScroll = () => {
      hideGlobalTooltip();
    };
    
    container.addEventListener('mouseleave', handleMouseLeave);
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      
      const globalTooltip = document.getElementById('patents-chart-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
      
      const tooltipStyles = document.getElementById('patents-tooltip-styles');
      if (tooltipStyles && tooltipStyles.parentNode) {
        tooltipStyles.parentNode.removeChild(tooltipStyles);
      }
    };
  }, []);

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'y',
      intersect: true
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
    scales: {
      x: {
        display: false
      },
      y: {
        grid: {
          display: false
        },
                   ticks: {
          color: '#333',
             font: {
            size: 12,
            weight: 'normal',
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          },
          autoSkip: false
        },
        border: {
          color: '#E5E7EB'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false,
        external: function(context) {
          // Tooltip Element
          let tooltipEl = document.getElementById('chartjs-tooltip');

          // Create element on first render
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = '<table></table>';
            document.body.appendChild(tooltipEl);
          }

          // Hide if no tooltip
          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          // Set caret Position
          tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add('no-transform');
          }

          // Set Text
          if (tooltipModel.body) {
            const dataIndex = tooltipModel.dataPoints[0]?.dataIndex;
            
            if (dataIndex !== undefined && chartData.sortedItems[dataIndex]) {
              const item = chartData.sortedItems[dataIndex];
              const countryName = getCountryNameFromCode(item.code, language);
              const value = item.value;
              const flagUrl = getCountryFlagUrl(item.code);
              
              const innerHtml = `
                <div style="background: white; border: 1px solid #ccc; border-radius: 8px; padding: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); font-family: Arial, sans-serif; max-width: 250px;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <img src="${flagUrl}" style="width: 24px; height: 18px; margin-right: 8px; border-radius: 2px;" alt="${countryName}" />
                    <strong style="font-size: 16px; color: #333;">${countryName}</strong>
                  </div>
                  <div style="color: #666; margin-bottom: 4px;">
                    <strong style="color: #c2410c;">${formatNumberAsInDataset(Math.round(value))}</strong> ${t.patents}
                  </div>
                  ${!item.isSupranational ? `
                  <div style="font-size: 12px; color: #888;">
                    Posición en ranking: <strong>${chartData.sortedItems.filter(i => !i.isSupranational).findIndex(i => i.code === item.code) + 1}</strong>
                  </div>
                  ` : ''}
                </div>
              `;
              
              const tableRoot = tooltipEl.querySelector('table');
              if (tableRoot) {
                tableRoot.innerHTML = innerHtml;
              }
            }
          }

          // `this` will be the overall tooltip
          const position = context.chart.canvas.getBoundingClientRect();

          // Display, position, and set styles for font
          tooltipEl.style.opacity = '1';
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
          tooltipEl.style.padding = '0';
          tooltipEl.style.pointerEvents = 'none';
          tooltipEl.style.zIndex = '9999';
        }
      }
    },
    onHover: (event: ChartEvent, elements: Array<unknown>) => {
      const chartCanvas = event.native?.target as HTMLElement;
      if (chartCanvas) {
        chartCanvas.style.cursor = elements?.length ? 'pointer' : 'default';
        
        if (!elements?.length) {
          hideGlobalTooltip();
          return;
        }

        if (elements.length > 0 && event.native) {
          const mouse = event.native as MouseEvent;
          const chartIndex = (elements[0] as { index: number }).index;
          
          const chartItem = chartData.sortedItems[chartIndex];
          if (!chartItem) {
            return;
          }

          const country = chartItem.code;
          const value = chartItem.value;
          const flagCode = chartItem.obsFlag;
          
          // Calcular el ranking
          let rank = null;
          if (!chartItem.isSupranational) {
            const allCountriesForRanking = new Map<string, number>();
            
            chartData.sortedItems.forEach(item => {
              if (!item.isSupranational) {
                allCountriesForRanking.set(item.code, item.value);
              }
            });
            
            const sortedCountries: [string, number][] = [];
            allCountriesForRanking.forEach((val, code) => {
              sortedCountries.push([code, val]);
            });
            
            sortedCountries.sort((a, b) => b[1] - a[1]);
            
            const position = sortedCountries.findIndex(([code, ]) => code === chartItem.code);
            if (position !== -1) {
              rank = position + 1;
            }
          }
          
          const flagUrl = getCountryFlagUrl(country);
          const countryName = getCountryNameFromCode(country, language);
          
          // Preparar comparación YoY
          const previousYearValue = getPreviousYearValue(country, selectedYear);
          let yoyComparisonHtml = '';
          if (value !== null && previousYearValue !== null && previousYearValue !== 0) {
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
            
            yoyComparisonHtml = `
              <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                </svg>
                <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
              </div>
            `;
          } else {
            yoyComparisonHtml = `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
          }
          
          // Preparar comparaciones
          const isSpainCountry = country === 'ES';
          const isEUEntity = country === 'EU27_2020';
          
          const euValue = !isEUEntity ? getEUValue(selectedYear) : null;
          const euAverageValue = euValue !== null ? Math.round(euValue / 27) : null;
          const spainValue = !isSpainCountry ? getSpainValue(selectedYear) : null;

          let comparisonsHtml = '';
          
          if (value !== null) {
            if (!isEUEntity && euAverageValue !== null) {
              const difference = value - euAverageValue;
              const percentDiff = (difference / euAverageValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs Media UE (${formatNumberAsInDataset(Math.round(euAverageValue))}):` : 
                    `vs Avg UE (${formatNumberAsInDataset(Math.round(euAverageValue))}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              }

            if (!isSpainCountry && spainValue !== null) {
              const difference = value - spainValue;
              const percentDiff = (difference / spainValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs España (${formatNumberAsInDataset(Math.round(spainValue))}):` : 
                    `vs Spain (${formatNumberAsInDataset(Math.round(spainValue))}):`}</span>
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
                    <span class="text-xl font-bold text-orange-700">${formatNumberAsInDataset(Math.round(value))}</span>
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
          
          positionGlobalTooltip(mouse, tooltipContent);
        }
      }
    }
  };

  // Preparar datos para el gráfico
  const chartData: ChartDataResult = prepareChartData();
  
  // Altura dinámica para el gráfico en función del número de países
  const chartHeight = Math.max(600, chartData.labels.length * 35);

  // Determinar si hay datos para mostrar (con filtro de coop_ptn = 'APPL')
  const hasData = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.coop_ptn === (cooperationPartner || 'APPL')
  ).length > 0;
  
  // Estilos para el contenedor con scroll
  const scrollContainerStyle: React.CSSProperties = {
    height: '520px',
    overflowY: 'auto',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6',
    msOverflowStyle: 'none',
  } as React.CSSProperties;

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
             style={{ backgroundColor: `${d3.color(CHART_PALETTE.DEFAULT)?.copy({ opacity: 0.15 })}` }}>
          {language === 'es' ? 'Todos los sectores' : 'All sectors'}
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