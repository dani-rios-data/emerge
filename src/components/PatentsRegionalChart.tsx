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

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Definir colores específicos para los componentes de patentes - Paleta neutral profesional
const PATENTS_SECTOR_COLORS = {
  total: '#37474F',        // Gris azulado oscuro para el total (neutral y profesional)
  business: '#FF7043',     // Naranja coral para empresas (innovación corporativa)
  government: '#5E35B1',   // Púrpura profundo para gobierno (autoridad institucional)
  education: '#1E88E5',    // Azul vibrante para educación (conocimiento y academia)
  nonprofit: '#8D6E63'     // Marrón medio para organizaciones sin fines de lucro (estabilidad social)
};

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: '#2E7D32',      // Verde tecnológico principal
  LIGHT: '#4CAF50',        // Verde más claro
  DARK: '#1B5E20',         // Verde más oscuro
  HIGHLIGHT: '#CC0000',    // Rojo para Madrid (destacar la capital)
  TEXT: '#000000',         // Color del texto (negro) 
  BORDER: '#E5E7EB',       // Color del borde (gris suave)
  YELLOW: '#FFC107',       // Amarillo para destacar
  GREEN: '#009900'         // Verde para destacar
};

// Mapeo de códigos de comunidades autónomas a nombres y banderas
const autonomousCommunitiesMapping: Record<string, {es: string, en: string, flag: string, mainCities: string[]}> = {
  'ES': {es: 'España', en: 'Spain', flag: '🇪🇸', mainCities: ['Madrid', 'Barcelona', 'Valencia']},
  'ES11': {es: 'Galicia', en: 'Galicia', flag: '🏴󠁥󠁳󠁧󠁡󠁿', mainCities: ['A Coruña', 'Vigo', 'Santiago de Compostela', 'Lugo', 'Ourense', 'Pontevedra', 'Ferrol']},
  'ES12': {es: 'Principado de Asturias', en: 'Principality of Asturias', flag: '🏴󠁥󠁳󠁡󠁳󠁿', mainCities: ['Oviedo', 'Gijón', 'Avilés', 'Langreo', 'Mieres']},
  'ES13': {es: 'Cantabria', en: 'Cantabria', flag: '🏴󠁥󠁳󠁣󠁢󠁿', mainCities: ['Santander', 'Torrelavega', 'Castro Urdiales', 'Camargo']},
  'ES21': {es: 'País Vasco', en: 'Basque Country', flag: '🏴󠁥󠁳󠁰󠁶󠁿', mainCities: ['Bilbao', 'Vitoria-Gasteiz', 'San Sebastián', 'Barakaldo', 'Getxo']},
  'ES22': {es: 'Comunidad Foral de Navarra', en: 'Chartered Community of Navarre', flag: '🏴󠁥󠁳󠁮󠁡󠁿', mainCities: ['Pamplona', 'Tudela', 'Barañáin', 'Burlada']},
  'ES23': {es: 'La Rioja', en: 'La Rioja', flag: '🏴󠁥󠁳󠁲󠁩󠁿', mainCities: ['Logroño', 'Calahorra', 'Arnedo', 'Haro']},
  'ES24': {es: 'Aragón', en: 'Aragon', flag: '🏴󠁥󠁳󠁡󠁲󠁿', mainCities: ['Zaragoza', 'Huesca', 'Teruel', 'Calatayud', 'Utebo']},
  'ES30': {es: 'Comunidad de Madrid', en: 'Community of Madrid', flag: '🏴󠁥󠁳󠁭󠁤󠁿', mainCities: ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe']},
  'ES41': {es: 'Castilla y León', en: 'Castile and León', flag: '🏴󠁥󠁳󠁣󠁬󠁿', mainCities: ['Valladolid', 'Burgos', 'Salamanca', 'León', 'Palencia', 'Zamora', 'Ávila', 'Segovia', 'Soria']},
  'ES42': {es: 'Castilla-La Mancha', en: 'Castile-La Mancha', flag: '🏴󠁥󠁳󠁣󠁭󠁿', mainCities: ['Toledo', 'Albacete', 'Guadalajara', 'Ciudad Real', 'Cuenca', 'Talavera de la Reina']},
  'ES43': {es: 'Extremadura', en: 'Extremadura', flag: '🏴󠁥󠁳󠁥󠁸󠁿', mainCities: ['Badajoz', 'Cáceres', 'Mérida', 'Plasencia', 'Don Benito']},
  'ES51': {es: 'Cataluña', en: 'Catalonia', flag: '🏴󠁥󠁳󠁣󠁴󠁿', mainCities: ['Barcelona', 'L\'Hospitalet de Llobregat', 'Badalona', 'Terrassa', 'Sabadell', 'Lleida', 'Tarragona', 'Girona']},
  'ES52': {es: 'Comunidad Valenciana', en: 'Valencian Community', flag: '🏴󠁥󠁳󠁶󠁣󠁿', mainCities: ['Valencia', 'Alicante', 'Castellón de la Plana', 'Elche', 'Torrevieja', 'Orihuela']},
  'ES53': {es: 'Illes Balears', en: 'Balearic Islands', flag: '🏴󠁥󠁳󠁩󠁢󠁿', mainCities: ['Palma', 'Calvià', 'Manacor', 'Inca', 'Llucmajor']},
  'ES61': {es: 'Andalucía', en: 'Andalusia', flag: '🏴󠁥󠁳󠁡󠁮󠁿', mainCities: ['Sevilla', 'Málaga', 'Córdoba', 'Granada', 'Almería', 'Cádiz', 'Huelva', 'Jaén']},
  'ES62': {es: 'Región de Murcia', en: 'Region of Murcia', flag: '🏴󠁥󠁳󠁭󠁣󠁿', mainCities: ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura']},
  'ES63': {es: 'Ciudad de Ceuta', en: 'City of Ceuta', flag: '🏴󠁥󠁳󠁣󠁥󠁿', mainCities: ['Ceuta']},
  'ES64': {es: 'Ciudad de Melilla', en: 'City of Melilla', flag: '🏴󠁥󠁳󠁭󠁬󠁿', mainCities: ['Melilla']},
  'ES70': {es: 'Canarias', en: 'Canary Islands', flag: '🏴󠁥󠁳󠁣󠁮󠁿', mainCities: ['Las Palmas de Gran Canaria', 'Santa Cruz de Tenerife', 'San Cristóbal de La Laguna', 'Telde', 'Santa Lucía']}
};



// Interfaz para los datos de entrada
interface RegionalData {
  TERRITORIO: string;
  TERRITORIO_CODE: string;
  TIME_PERIOD: string;
  SEXO: string;
  SECTOR_EJECUCION: string;
  SECTOR_EJECUCION_CODE: string;
  OBS_VALUE: string;
  CONFIDENCIALIDAD_OBSERVACION?: string;
  [key: string]: string | undefined;
}

// Interfaz para los elementos del gráfico
interface ChartDataItem {
  code: string;
  name: string;
  value: number;
  isMadrid: boolean;
  isCanarias: boolean;
  isConfidential: boolean;
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

interface PatentsRegionalChartProps {
  data: RegionalData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
}

const PatentsRegionalChart: React.FC<PatentsRegionalChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'Total'
}) => {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Funciones para manejar el tooltip global
  const createGlobalTooltip = (): HTMLElement => {
    let tooltipElement = document.getElementById('regional-chart-tooltip');
    
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.id = 'regional-chart-tooltip';
      tooltipElement.className = 'regional-tooltip';
      
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
        minWidth: '220px',
        maxWidth: '480px',
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
      styleSheet.id = 'regional-tooltip-styles';
      styleSheet.textContent = `
        #regional-chart-tooltip {
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
        #regional-chart-tooltip.visible {
          opacity: 1 !important;
          transform: scale(1);
        }
        
        #regional-chart-tooltip .text-green-600 { color: #059669; }
        #regional-chart-tooltip .text-red-600 { color: #DC2626; }
        #regional-chart-tooltip .text-orange-700 { color: #C2410C; }
        #regional-chart-tooltip .bg-orange-50 { background-color: #FFF7ED; }
        #regional-chart-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
        #regional-chart-tooltip .bg-gray-50 { background-color: #F9FAFB; }
        #regional-chart-tooltip .border-orange-100 { border-color: #FFEDD5; }
        #regional-chart-tooltip .border-gray-100 { border-color: #F3F4F6; }
        #regional-chart-tooltip .text-gray-500 { color: #6B7280; }
        #regional-chart-tooltip .text-gray-800 { color: #1F2937; }
        #regional-chart-tooltip .text-gray-600 { color: #4B5563; }
        #regional-chart-tooltip .text-gray-400 { color: #9CA3AF; }
        #regional-chart-tooltip .text-yellow-500 { color: #F59E0B; }
        #regional-chart-tooltip .rounded-lg { border-radius: 0.5rem; }
        #regional-chart-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        #regional-chart-tooltip .p-3 { padding: 0.75rem; }
        #regional-chart-tooltip .p-4 { padding: 1rem; }
        #regional-chart-tooltip .p-2 { padding: 0.5rem; }
        #regional-chart-tooltip .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        #regional-chart-tooltip .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        #regional-chart-tooltip .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
        #regional-chart-tooltip .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
        #regional-chart-tooltip .pt-3 { padding-top: 0.75rem; }
        #regional-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #regional-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #regional-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #regional-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #regional-chart-tooltip .mr-2 { margin-right: 0.5rem; }
        #regional-chart-tooltip .ml-2 { margin-left: 0.5rem; }
        #regional-chart-tooltip .mt-1 { margin-top: 0.25rem; }
        #regional-chart-tooltip .mt-3 { margin-top: 0.75rem; }
        #regional-chart-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
        #regional-chart-tooltip .text-xs { font-size: 0.75rem; }
        #regional-chart-tooltip .text-sm { font-size: 0.875rem; }
        #regional-chart-tooltip .text-lg { font-size: 1.125rem; }
        #regional-chart-tooltip .text-xl { font-size: 1.25rem; }
        #regional-chart-tooltip .font-bold { font-weight: 700; }
        #regional-chart-tooltip .font-medium { font-weight: 500; }
        #regional-chart-tooltip .flex { display: flex; }
        #regional-chart-tooltip .items-center { align-items: center; }
        #regional-chart-tooltip .justify-between { justify-content: space-between; }
        #regional-chart-tooltip .w-8 { width: 2rem; }
        #regional-chart-tooltip .h-6 { height: 1.5rem; }
        #regional-chart-tooltip .w-36 { width: 9rem; }
        #regional-chart-tooltip .w-44 { width: 11rem; }
        #regional-chart-tooltip .w-48 { width: 12rem; }
        #regional-chart-tooltip .w-full { width: 100%; }
        #regional-chart-tooltip .h-full { height: 100%; }
        #regional-chart-tooltip .rounded { border-radius: 0.25rem; }
        #regional-chart-tooltip .rounded-md { border-radius: 0.375rem; }
        #regional-chart-tooltip .overflow-hidden { overflow: hidden; }
        #regional-chart-tooltip .border-t { border-top-width: 1px; }
        #regional-chart-tooltip .border-b { border-bottom-width: 1px; }
        #regional-chart-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
        #regional-chart-tooltip .space-y-1 > * + * { margin-top: 0.25rem; }
        #regional-chart-tooltip .max-w-xs { max-width: 20rem; }
        #regional-chart-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
        #regional-chart-tooltip .relative { position: relative; }
        #regional-chart-tooltip .inline-block { display: inline-block; }
        #regional-chart-tooltip .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
      `;
      document.head.appendChild(styleSheet);
    }
    
    return tooltipElement;
  };

  // Posicionar el tooltip global
  const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
    const tooltipEl = createGlobalTooltip();
    
    tooltipEl.innerHTML = content;
    
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
      minWidth: '220px',
      maxWidth: '480px',
      border: '1px solid #e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
    });
    
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

  // Ocultar el tooltip global
  const hideGlobalTooltip = (): void => {
    const tooltipEl = document.getElementById('regional-chart-tooltip');
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
      
      const globalTooltip = document.getElementById('regional-chart-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
      
      const tooltipStyles = document.getElementById('regional-tooltip-styles');
      if (tooltipStyles && tooltipStyles.parentNode) {
        tooltipStyles.parentNode.removeChild(tooltipStyles);
      }
    };
  }, []);

  // Textos traducidos
  const texts = {
    es: {
      title: "Distribución regional de patentes",
      axisLabel: "Patentes",
      noData: "No hay datos disponibles para este año",
      patents: "Patentes",
      regionalRanking: "Ranking regional",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Administración Pública", 
      sector_education: "Enseñanza Superior",
      sector_nonprofit: "Instituciones Privadas sin Fines de Lucro",
      confidential: "Información confidencial"
    },
    en: {
      title: "Regional Distribution of Patents",
      axisLabel: "Patents", 
      noData: "No data available for this year",
      patents: "Patents",
      regionalRanking: "Regional Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector",
      confidential: "Confidential information"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y código en los datos
  const sectorCodeMapping: Record<string, string> = {
    'Total': '_T',
    'Enseñanza Superior': 'ENSENIANZA_SUPERIOR',
    'Administración Pública': 'ADMINISTRACION_PUBLICA',
    'Empresas': 'EMPRESAS',
    'Instituciones Privadas sin Fines de Lucro (IPSFL)': 'IPSFL'
  };

  // Función para obtener datos detallados por sectores para una comunidad autónoma
  const getRegionSectorDetails = (regionCode: string, year: number): Record<string, number> => {
    const regionData = data.filter(item => 
      item.TERRITORIO_CODE === regionCode &&
      parseInt(item.TIME_PERIOD) === year &&
      item.SEXO === 'Total' &&
      item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
    );

    const sectorDetails: Record<string, number> = {};
    
    regionData.forEach(item => {
      const value = parseFloat(item.OBS_VALUE || '0');
      if (!isNaN(value)) {
        switch (item.SECTOR_EJECUCION_CODE) {
          case '_T':
            sectorDetails['Total'] = value;
            break;
          case 'ENSENIANZA_SUPERIOR':
            sectorDetails['Enseñanza Superior'] = value;
            break;
          case 'ADMINISTRACION_PUBLICA':
            sectorDetails['Administración Pública'] = value;
            break;
          case 'EMPRESAS':
            sectorDetails['Empresas'] = value;
            break;
          case 'IPSFL':
            sectorDetails['IPSFL'] = value;
            break;
        }
      }
    });

    return sectorDetails;
  };
  
  // Obtener el código del sector seleccionado
  const sectorCode = sectorCodeMapping[selectedSector] || '_T';

  // Preparar datos del gráfico
  const prepareChartData = (): ChartDataResult => {
    // Filtrar datos para el año y sector seleccionados, excluyendo España total
    const regionalDataForYear = data.filter(item => {
      const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
      const sectorMatch = item.SECTOR_EJECUCION_CODE === sectorCode;
      const sexMatch = item.SEXO === 'Total'; // Solo datos totales, no por sexo
      const isRegional = item.TERRITORIO_CODE !== 'ES'; // Excluir España total
      
      return yearMatch && sectorMatch && sexMatch && isRegional;
    });

    // Construir mapa de comunidades autónomas
    const regionMap = new Map<string, {code: string, name: string, value: number, isConfidential: boolean}>();
    
    regionalDataForYear.forEach(item => {
      const regionCode = item.TERRITORIO_CODE;
      let value = parseFloat(item.OBS_VALUE || '0');
      const isConfidential = item.CONFIDENCIALIDAD_OBSERVACION === 'C' || !item.OBS_VALUE || item.OBS_VALUE.trim() === '';
      
      if (isNaN(value)) {
        value = 0;
      }
      
      // Solo incluir si tenemos el mapeo de la comunidad autónoma
      if (autonomousCommunitiesMapping[regionCode]) {
        regionMap.set(regionCode, {
          code: regionCode,
          name: autonomousCommunitiesMapping[regionCode][language],
          value: value,
          isConfidential: isConfidential
        });
      }
    });

    // Ordenar por valor descendente
    const sortedData = Array.from(regionMap.values())
      .sort((a, b) => b.value - a.value);

    // Crear elementos del gráfico
    const chartItems: ChartDataItem[] = sortedData.map(item => ({
      code: item.code,
      name: item.name,
      value: item.value,
      isMadrid: item.code === 'ES30',
      isCanarias: item.code === 'ES70',
      isConfidential: item.isConfidential
    }));

    // Preparar datos para Chart.js
    const labels = chartItems.map(item => item.name);
    const values = chartItems.map(item => item.value);
    
    // Determinar colores
    const backgroundColor = chartItems.map(item => {
      if (item.isCanarias) return CHART_PALETTE.YELLOW;
      if (item.isConfidential) return '#E5E7EB'; // Gris para datos confidenciales
      return getPatentsSectorColor();
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
        barPercentage: 0.5,
        categoryPercentage: 0.7
      }],
      sortedItems: chartItems
    };
  };

  // Obtener color del sector para las barras
  const getPatentsSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a IDs normalizados
    if (normalizedId === 'total' || normalizedId.includes('total')) 
      normalizedId = 'total';
    if (normalizedId.includes('empresa')) 
      normalizedId = 'business';
    if (normalizedId.includes('administración') || normalizedId.includes('pública')) 
      normalizedId = 'government';
    if (normalizedId.includes('enseñanza') || normalizedId.includes('superior')) 
      normalizedId = 'education';
    if (normalizedId.includes('privadas') || normalizedId.includes('ipsfl')) 
      normalizedId = 'nonprofit';
    
    return PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
  };

  // Función para obtener el color del sector para el título
  const getSectorTitleColor = () => {
    let normalizedId = selectedSector.toLowerCase();
    
    if (normalizedId === 'total' || normalizedId.includes('total')) 
      normalizedId = 'total';
    if (normalizedId.includes('empresa')) 
      normalizedId = 'business';
    if (normalizedId.includes('administración') || normalizedId.includes('pública')) 
      normalizedId = 'government';
    if (normalizedId.includes('enseñanza') || normalizedId.includes('superior')) 
      normalizedId = 'education';
    if (normalizedId.includes('privadas') || normalizedId.includes('ipsfl')) 
      normalizedId = 'nonprofit';
    
    const sectorColor = PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  const formatNumberComplete = (value: number, decimals: number = 0): string => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
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
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 4
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#333',
          font: {
            size: 12,
            weight: 'normal',
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          },
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45
        },
        border: {
          color: '#E5E7EB'
        }
      },
      y: {
        display: false,
        title: {
          display: false,
          text: t.axisLabel
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          display: false
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

          const regionName = chartItem.name;
          const value = chartItem.value;
          const isConfidential = chartItem.isConfidential;
          const regionCode = chartItem.code;
          
          // Obtener información adicional de la región
          const regionInfo = autonomousCommunitiesMapping[regionCode];
          const flag = regionInfo?.flag || '🏴';
          const mainCities = regionInfo?.mainCities || [];
          
          // Obtener desglose por sectores
          const sectorDetails = getRegionSectorDetails(regionCode, selectedYear);
          
          // Calcular el ranking
          let rank = null;
          const nonConfidentialItems = chartData.sortedItems.filter(item => !item.isConfidential);
          const position = nonConfidentialItems.findIndex(item => item.code === chartItem.code);
          if (position !== -1) {
            rank = position + 1;
          }
          
          // Construir el contenido del tooltip
          const tooltipContent = `
            <div class="max-w-lg bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con bandera y nombre de la región -->
              <div class="flex items-center p-3 bg-orange-50 border-b border-orange-100">
                <span class="text-2xl mr-2">${flag}</span>
                <h3 class="text-lg font-bold text-gray-800">${regionName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>${t.patents} (${selectedSector}):</span>
                  </div>
                  <div class="flex items-center">
                    ${isConfidential ? 
                      `<span class="text-lg font-bold text-gray-500">${t.confidential}</span>` :
                      `<span class="text-xl font-bold text-orange-700">${formatNumberComplete(Math.round(value), 0)}</span>`
                    }
                  </div>
                </div>
                
                <!-- Ranking (si está disponible y no es confidencial) -->
                ${rank !== null && !isConfidential ? `
                <div class="mb-3">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Posición </span>
                    <span class="font-bold text-lg mx-1">${rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${nonConfidentialItems.length}` : `of ${nonConfidentialItems.length}`}</span>
                  </div>
                </div>
                ` : ''}

                <!-- Desglose detallado por sectores (solo si no es confidencial y hay datos) -->
                ${!isConfidential && Object.keys(sectorDetails).length > 1 ? `
                <div class="mb-3">
                  <div class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                      <path d="M3 3v18h18"></path>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                    </svg>
                    ${language === 'es' ? 'Valores individuales por sector:' : 'Individual values by sector:'}
                  </div>
                  <div class="space-y-1 text-xs">
                    ${Object.entries(sectorDetails)
                      .filter(([sector]) => sector !== 'Total')
                      .sort(([,a], [,b]) => b - a)
                      .map(([sector, val]) => {
                        const percentage = sectorDetails['Total'] > 0 ? ((val / sectorDetails['Total']) * 100).toFixed(1) : '0.0';
                        const sectorColors: Record<string, string> = {
                          'Enseñanza Superior': '#1E88E5',
                          'Empresas': '#FF7043', 
                          'Administración Pública': '#5E35B1',
                          'IPSFL': '#8D6E63'
                        };
                        const color = sectorColors[sector] || '#666';
                        return `
                        <div class="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200 shadow-sm">
                          <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}"></div>
                            <span class="text-gray-700 font-medium">${sector}</span>
                          </div>
                          <div class="text-right">
                            <div class="font-bold text-gray-800">${formatNumberComplete(Math.round(val), 0)}</div>
                            <div class="text-xs text-gray-500">${percentage}% del total</div>
                          </div>
                        </div>
                      `}).join('')}
                  </div>
                  ${sectorDetails['Total'] ? `
                  <div class="mt-2 pt-2 border-t border-gray-200">
                    <div class="flex justify-between items-center text-sm font-bold">
                      <span class="text-gray-700">Total:</span>
                      <span class="text-gray-800">${formatNumberComplete(Math.round(sectorDetails['Total']), 0)}</span>
                    </div>
                  </div>
                  ` : ''}
                </div>
                ` : ''}

                <!-- Principales ciudades/provincias incluidas -->
                ${mainCities.length > 0 ? `
                <div class="border-t border-gray-100 pt-3">
                  <div class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${language === 'es' ? 'Principales ciudades/provincias incluidas:' : 'Main cities/provinces included:'}
                  </div>
                  <div class="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded">
                    ${mainCities.slice(0, 8).map(city => `<span class="inline-block bg-white px-2 py-0.5 rounded mr-1 mb-1 border border-gray-200">${city}</span>`).join('')}
                    ${mainCities.length > 8 ? `<span class="text-gray-400">+${mainCities.length - 8} más</span>` : ''}
                  </div>
                  <div class="text-xs text-gray-500 mt-1 italic">
                    ${language === 'es' ? 'Nota: Los datos se agregan a nivel de comunidad autónoma' : 'Note: Data is aggregated at autonomous community level'}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
          `;
          
          positionGlobalTooltip(mouse, tooltipContent);
        }
      }
    }
  };

  // Preparar datos para el gráfico
  const chartData: ChartDataResult = prepareChartData();
  
  // Altura fija para el gráfico horizontal
  const chartHeight = 520;

  // Determinar si hay datos para mostrar
  const hasData = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.SECTOR_EJECUCION_CODE === sectorCode &&
    item.SEXO === 'Total' &&
    item.TERRITORIO_CODE !== 'ES'
  ).length > 0;
  
  // Estilos para el contenedor con scroll horizontal
  const scrollContainerStyle: React.CSSProperties = {
    height: '520px',
    overflowX: 'auto',
    overflowY: 'hidden',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '10px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6',
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
          {selectedSector}
        </div>
      </div>
      
      <div style={scrollContainerStyle} ref={scrollContainerRef} className="custom-scrollbar">
        <div style={{ height: `${chartHeight}px`, width: `${Math.max(800, chartData.labels.length * 60)}px` }}>
          <Bar 
            ref={chartRef}
            data={chartData}
            options={options}
          />
        </div>
      </div>
      
      {/* Etiqueta del eje Y centrada */}
      <div className="text-center mt-4 mb-2 text-sm font-medium text-gray-700">
        {t.axisLabel}
      </div>
    </div>
  );
};

export default PatentsRegionalChart; 