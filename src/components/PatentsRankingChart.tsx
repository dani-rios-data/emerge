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

// Aseguramos el tipo correcto para el array de flags
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
  language
}) => {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Funciones auxiliares del mapa
  const getEUValue = (year: number): number | null => {
    const euData = data.filter(item => {
      const isEU = item.geo === 'EU27_2020';
      const yearMatch = parseInt(item.TIME_PERIOD) === year;
      const isApplicant = item.coop_ptn === 'APPL';
      
      return isEU && yearMatch && isApplicant;
    });
    
    if (euData.length > 0 && euData[0].OBS_VALUE) {
      return parseFloat(euData[0].OBS_VALUE);
    }
    
    return null;
  };

  const getSpainValue = (year: number): number | null => {
    const spainData = data.filter(item => {
      const isSpain = item.geo === 'ES';
      const yearMatch = parseInt(item.TIME_PERIOD) === year;
      const isApplicant = item.coop_ptn === 'APPL';
      
      return isSpain && yearMatch && isApplicant;
    });
    
    if (spainData.length > 0 && spainData[0].OBS_VALUE) {
      return parseFloat(spainData[0].OBS_VALUE);
    }
    
    return null;
  };

  const getPreviousYearValue = (countryCode: string | undefined, year: number): number | null => {
    if (!data || data.length === 0 || !countryCode || year <= 1) {
      return null;
    }
    
    const previousYear = year - 1;
    const possibleCodes = [countryCode];
    
    // Códigos alternativos
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
      'FIN': ['FI']
    };

    const codeMapping2to3: Record<string, string> = {
      'EL': 'GRC',
      'UK': 'GBR',
      'DE': 'DEU',
      'FR': 'FRA',
      'ES': 'ESP',
      'IT': 'ITA',
      'CZ': 'CZE',
      'SE': 'SWE',
      'DK': 'DNK',
      'FI': 'FIN'
    };
    
    if (countryCode.length === 3 && countryCode in codeMapping) {
      possibleCodes.push(...codeMapping[countryCode]);
    } else if (countryCode.length === 2 && countryCode in codeMapping2to3) {
      possibleCodes.push(codeMapping2to3[countryCode]);
    }
    
    for (const code of possibleCodes) {
      const prevYearData = data.filter(item => {
        const geoMatch = item.geo === code;
        const yearMatch = parseInt(item.TIME_PERIOD) === previousYear;
        const isApplicant = item.coop_ptn === 'APPL';
        
        return geoMatch && yearMatch && isApplicant;
      });
      
      if (prevYearData.length > 0 && prevYearData[0].OBS_VALUE) {
        return parseFloat(prevYearData[0].OBS_VALUE);
      }
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

  const getLabelDescription = (label: string, language: 'es' | 'en'): string => {
    const labelDescriptions: Record<string, { es: string, en: string }> = {
      'e': { es: 'Estimado', en: 'Estimated' },
      'p': { es: 'Provisional', en: 'Provisional' },
      'b': { es: 'Ruptura en la serie', en: 'Break in series' }
    };
    
    return labelDescriptions[label]?.[language] || label;
  };

  // Preparar datos del gráfico (igual que el mapa)
  const prepareChartData = (): ChartDataResult => {
    const countryDataForYear = data.filter(item => {
      const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
      const isApplicant = item.coop_ptn === 'APPL';
      const isEuropean = EUROPEAN_COUNTRY_CODES.includes(item.geo);
      
      return yearMatch && isApplicant && (isEuropean || isSupranationalEntity(item.geo));
    });

    const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
    
    countryDataForYear.forEach(item => {
      const countryCode = item.geo;
      let value = parseFloat(item.OBS_VALUE || '0');
      if (isNaN(value) || value === 0) return;
      
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

    const sortedData = Array.from(tempCountryMap.values())
      .sort((a, b) => b.value - a.value);

    const chartItems: ChartDataItem[] = sortedData.map(item => {
      const originalData = data.find(dataItem => 
        dataItem.geo === item.code && 
        parseInt(dataItem.TIME_PERIOD) === selectedYear &&
        dataItem.coop_ptn === 'APPL'
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
        enabled: false
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
                      `vs Media UE (${formatNumberComplete(Math.round(euAverageValue), 0)}):` : 
                      `vs Avg UE (${formatNumberComplete(Math.round(euAverageValue), 0)}):`}</span>
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

  // Determinar si hay datos para mostrar
  const hasData = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.coop_ptn === 'APPL'
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