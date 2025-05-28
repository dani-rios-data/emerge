import React, { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
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
// Importar datos de banderas de comunidades autónomas
import autonomousCommunitiesFlagsData from '../logos/autonomous_communities_flags.json';

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

// Mapeo de códigos NUTS de provincias a comunidades autónomas
const provinceToAutonomousCommunityMapping: Record<string, string> = {
  // Andalucía (ES61)
  'ES611': 'ES61', 'ES612': 'ES61', 'ES613': 'ES61', 'ES614': 'ES61', 
  'ES615': 'ES61', 'ES616': 'ES61', 'ES617': 'ES61', 'ES618': 'ES61',
  // Aragón (ES24)
  'ES241': 'ES24', 'ES242': 'ES24', 'ES243': 'ES24',
  // Asturias (ES12)
  'ES120': 'ES12',
  // Canarias (ES70)
  'ES705': 'ES70', 'ES709': 'ES70',
  // Cantabria (ES13)
  'ES130': 'ES13',
  // Castilla-La Mancha (ES42)
  'ES421': 'ES42', 'ES422': 'ES42', 'ES423': 'ES42', 'ES424': 'ES42', 'ES425': 'ES42',
  // Castilla y León (ES41)
  'ES411': 'ES41', 'ES412': 'ES41', 'ES413': 'ES41', 'ES414': 'ES41', 
  'ES415': 'ES41', 'ES416': 'ES41', 'ES417': 'ES41', 'ES418': 'ES41', 'ES419': 'ES41',
  // Cataluña (ES51)
  'ES511': 'ES51', 'ES512': 'ES51', 'ES513': 'ES51', 'ES514': 'ES51',
  // Comunidad Valenciana (ES52)
  'ES521': 'ES52', 'ES522': 'ES52', 'ES523': 'ES52',
  // Extremadura (ES43)
  'ES431': 'ES43', 'ES432': 'ES43',
  // Galicia (ES11)
  'ES111': 'ES11', 'ES112': 'ES11', 'ES113': 'ES11', 'ES114': 'ES11',
  // Illes Balears (ES53)
  'ES532': 'ES53',
  // La Rioja (ES23)
  'ES230': 'ES23',
  // Madrid (ES30)
  'ES300': 'ES30',
  // Murcia (ES62)
  'ES620': 'ES62',
  // Navarra (ES22)
  'ES220': 'ES22',
  // País Vasco (ES21)
  'ES211': 'ES21', 'ES212': 'ES21', 'ES213': 'ES21',
  // Ceuta (ES63)
  'ES630': 'ES63',
  // Melilla (ES64)
  'ES640': 'ES64'
};

// Mapeo de códigos de comunidades autónomas a nombres, banderas y provincias del dataset
const autonomousCommunitiesMapping: Record<string, {es: string, en: string, flag: string, provinces: string[]}> = {
  'ES61': {es: 'Andalucía', en: 'Andalusia', flag: '🏴󠁥󠁳󠁡󠁮󠁿', provinces: ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla']},
  'ES24': {es: 'Aragón', en: 'Aragon', flag: '🏴󠁥󠁳󠁡󠁲󠁿', provinces: ['Huesca', 'Teruel', 'Zaragoza']},
  'ES12': {es: 'Principado de Asturias', en: 'Principality of Asturias', flag: '🏴󠁥󠁳󠁡󠁳󠁿', provinces: ['Asturias']},
  'ES70': {es: 'Canarias', en: 'Canary Islands', flag: '🏴󠁥󠁳󠁣󠁮󠁿', provinces: ['Las Palmas', 'Santa Cruz de Tenerife']},
  'ES13': {es: 'Cantabria', en: 'Cantabria', flag: '🏴󠁥󠁳󠁣󠁢󠁿', provinces: ['Cantabria']},
  'ES42': {es: 'Castilla-La Mancha', en: 'Castile-La Mancha', flag: '🏴󠁥󠁳󠁣󠁭󠁿', provinces: ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo']},
  'ES41': {es: 'Castilla y León', en: 'Castile and León', flag: '🏴󠁥󠁳󠁣󠁬󠁿', provinces: ['Ávila', 'Burgos', 'León', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora']},
  'ES51': {es: 'Cataluña', en: 'Catalonia', flag: '🏴󠁥󠁳󠁣󠁴󠁿', provinces: ['Barcelona', 'Girona', 'Lleida', 'Tarragona']},
  'ES52': {es: 'Comunidad Valenciana', en: 'Valencian Community', flag: '🏴󠁥󠁳󠁶󠁣󠁿', provinces: ['Alicante', 'Castellón', 'Valencia']},
  'ES43': {es: 'Extremadura', en: 'Extremadura', flag: '🏴󠁥󠁳󠁥󠁸󠁿', provinces: ['Badajoz', 'Cáceres']},
  'ES11': {es: 'Galicia', en: 'Galicia', flag: '🏴󠁥󠁳󠁧󠁡󠁿', provinces: ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra']},
  'ES53': {es: 'Illes Balears', en: 'Balearic Islands', flag: '🏴󠁥󠁳󠁩󠁢󠁿', provinces: ['Illes Balears']},
  'ES23': {es: 'La Rioja', en: 'La Rioja', flag: '🏴󠁥󠁳󠁲󠁩󠁿', provinces: ['La Rioja']},
  'ES30': {es: 'Comunidad de Madrid', en: 'Community of Madrid', flag: '🏴󠁥󠁳󠁭󠁤󠁿', provinces: ['Madrid']},
  'ES62': {es: 'Región de Murcia', en: 'Region of Murcia', flag: '🏴󠁥󠁳󠁭󠁣󠁿', provinces: ['Murcia']},
  'ES22': {es: 'Comunidad Foral de Navarra', en: 'Chartered Community of Navarre', flag: '🏴󠁥󠁳󠁮󠁡󠁿', provinces: ['Navarra']},
  'ES21': {es: 'País Vasco', en: 'Basque Country', flag: '🏴󠁥󠁳󠁰󠁶󠁿', provinces: ['Araba/Álava', 'Bizkaia', 'Gipuzkoa']},
  'ES63': {es: 'Ciudad de Ceuta', en: 'City of Ceuta', flag: '🏴󠁥󠁳󠁣󠁥󠁿', provinces: ['Ceuta']},
  'ES64': {es: 'Ciudad de Melilla', en: 'City of Melilla', flag: '🏴󠁥󠁳󠁭󠁬󠁿', provinces: ['Melilla']}
};

// Interfaz para los elementos del archivo de banderas de comunidades autónomas
interface AutonomousCommunityFlag {
  community: string;
  code: string;
  flag: string;
}

// Asegurar el tipo correcto para el array de banderas
const autonomousCommunitiesFlags = autonomousCommunitiesFlagsData as AutonomousCommunityFlag[];

// Función para obtener la URL de la bandera de la comunidad autónoma
const getAutonomousCommunityFlagUrl = (regionCode: string): string => {
  // Mapeo de códigos NUTS a códigos de banderas
  const nutsToFlagCodeMapping: Record<string, string> = {
    'ES61': 'AND', // Andalucía
    'ES24': 'ARA', // Aragón
    'ES12': 'AST', // Asturias
    'ES70': 'CAN', // Canarias
    'ES13': 'CNT', // Cantabria
    'ES42': 'CLM', // Castilla-La Mancha
    'ES41': 'CYL', // Castilla y León
    'ES51': 'CAT', // Cataluña
    'ES52': 'VAL', // Comunidad Valenciana
    'ES43': 'EXT', // Extremadura
    'ES11': 'GAL', // Galicia
    'ES53': 'BAL', // Illes Balears
    'ES23': 'RIO', // La Rioja
    'ES30': 'MAD', // Comunidad de Madrid
    'ES62': 'MUR', // Región de Murcia
    'ES22': 'NAV', // Navarra
    'ES21': 'PVA', // País Vasco
    'ES63': 'CEU', // Ceuta
    'ES64': 'MEL'  // Melilla
  };
  
  const flagCode = nutsToFlagCodeMapping[regionCode];
  if (!flagCode) return '';
  
  const flagData = autonomousCommunitiesFlags.find(flag => flag.code === flagCode);
  return flagData?.flag || '';
};

// Interfaz para los datos de patentes por provincias
interface PatentsProvinceData {
  'Nuts Prov': string;
  'Provincia': string;
  '2010': string;
  '2011': string;
  '2012': string;
  '2013': string;
  '2014': string;
  '2015': string;
  '2016': string;
  '2017': string;
  '2018': string;
  '2019': string;
  '2020': string;
  '2021': string;
  '2022': string;
  '2023': string;
  '2024': string;
  'SUMA': string;
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
  provinces?: {name: string, value: number}[];
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
  data: PatentsProvinceData[];
  selectedYear: number;
  language: 'es' | 'en';
}

const PatentsRegionalChart: React.FC<PatentsRegionalChartProps> = ({ 
  data, 
  selectedYear, 
  language
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
        minWidth: '200px',
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
      minWidth: '200px',
      maxWidth: '350px',
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

  // Preparar datos del gráfico usando el dataset de patentes por provincias
  const prepareChartData = (): ChartDataResult => {
    // Construir mapa de comunidades autónomas agregando datos de provincias
    const regionMap = new Map<string, {code: string, name: string, value: number, provinces: {name: string, value: number}[]}>();
    
    // Crear un mapa para evitar duplicados de provincias
    const processedProvinces = new Set<string>();
    
    // Procesar cada provincia en el dataset
    data.forEach(item => {
      const provinceCode = item['Nuts Prov'];
      const provinceName = item['Provincia'];
      const yearKey = selectedYear.toString();
      
      if (!provinceCode || !provinceName || !yearKey) return;
      
      // Evitar procesar la misma provincia múltiples veces
      if (processedProvinces.has(provinceCode)) return;
      processedProvinces.add(provinceCode);
      
      // Obtener el código de la comunidad autónoma para esta provincia
      const autonomousCommunityCode = provinceToAutonomousCommunityMapping[provinceCode];
      if (!autonomousCommunityCode) return;
      
      // Obtener el valor de patentes para el año seleccionado
      const yearValue = item[yearKey];
      let value = parseFloat(yearValue || '0');
      
      if (isNaN(value)) {
        value = 0;
      }
      
      // Agregar o actualizar la comunidad autónoma
      if (regionMap.has(autonomousCommunityCode)) {
        const existing = regionMap.get(autonomousCommunityCode)!;
        existing.value += value;
        existing.provinces.push({ name: provinceName, value: value });
      } else {
        const communityInfo = autonomousCommunitiesMapping[autonomousCommunityCode];
        if (communityInfo) {
          regionMap.set(autonomousCommunityCode, {
            code: autonomousCommunityCode,
            name: communityInfo[language],
            value: value,
            provinces: [{ name: provinceName, value: value }]
          });
        }
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
      isConfidential: false, // Los datos de patentes no tienen confidencialidad
      provinces: item.provinces
    }));

    // Preparar datos para Chart.js
    const labels = chartItems.map(item => item.name);
    const values = chartItems.map(item => item.value);
    
    // Determinar colores
    const backgroundColor = chartItems.map(item => {
      if (item.isCanarias) return CHART_PALETTE.YELLOW;
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

  // Obtener color para las barras (color fijo para patentes)
  const getPatentsSectorColor = (): string => {
    return PATENTS_SECTOR_COLORS.total;
  };

  const formatNumberComplete = (value: number, decimals: number = 0): string => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Función para obtener el valor de Canarias
  const getCanariasValue = (year: number): number | null => {
    let canariasValue = 0;
    const yearKey = year.toString();
    
    data.forEach(item => {
      const provinceCode = item['Nuts Prov'];
      const autonomousCommunityCode = provinceToAutonomousCommunityMapping[provinceCode];
      
      if (autonomousCommunityCode === 'ES70') { // Código de Canarias
        const yearValue = parseFloat(item[yearKey] || '0');
        if (!isNaN(yearValue)) {
          canariasValue += yearValue;
        }
      }
    });
    
    return canariasValue > 0 ? canariasValue : null;
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
          const flagUrl = getAutonomousCommunityFlagUrl(regionCode);
          const provincesFromDataset = chartItem.provinces || [];
          
          // Calcular YoY (Year over Year) si hay año anterior disponible
          let yoyChange = null;
          let yoyPercentage = null;
          const previousYear = selectedYear - 1;
          if (previousYear >= 2010) {
            // Calcular el valor del año anterior para esta comunidad autónoma
            let previousYearValue = 0;
            data.forEach(item => {
              const provinceCode = item['Nuts Prov'];
              const autonomousCommunityCode = provinceToAutonomousCommunityMapping[provinceCode];
              if (autonomousCommunityCode === regionCode) {
                const prevYearValue = parseFloat(item[previousYear.toString()] || '0');
                if (!isNaN(prevYearValue)) {
                  previousYearValue += prevYearValue;
                }
              }
            });
            
            if (previousYearValue > 0) {
              yoyChange = value - previousYearValue;
              yoyPercentage = ((yoyChange / previousYearValue) * 100);
            }
          }
          
          // Calcular el ranking
          let rank = null;
          const nonConfidentialItems = chartData.sortedItems.filter(item => !item.isConfidential);
          const position = nonConfidentialItems.findIndex(item => item.code === chartItem.code);
          if (position !== -1) {
            rank = position + 1;
          }
          
          // Obtener valor de Canarias para comparación
          const isCanariasRegion = regionCode === 'ES70';
          const canariasValue = !isCanariasRegion ? getCanariasValue(selectedYear) : null;
          
          // Construir el contenido del tooltip
          const tooltipContent = `
            <div class="max-w-md bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con bandera y nombre de la región -->
              <div class="flex items-center p-2 bg-orange-50 border-b border-orange-100">
                ${flagUrl ? 
                  `<div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${flagUrl}" class="w-full h-full object-cover" alt="${regionName}" />
                  </div>` :
                  `<span class="text-xl mr-2">${flag}</span>`
                }
                <h3 class="text-md font-bold text-gray-800">${regionName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-3">
                <!-- Métrica principal -->
                <div class="mb-2">
                  <div class="flex items-center text-gray-500 text-xs mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>${t.patents}:</span>
                  </div>
                  <div class="flex items-center">
                    ${isConfidential ? 
                      `<span class="text-md font-bold text-gray-500">${t.confidential}</span>` :
                      `<span class="text-lg font-bold text-orange-700">${formatNumberComplete(Math.round(value), 0)}</span>`
                    }
                  </div>
                  ${yoyChange !== null && yoyPercentage !== null && !isConfidential ? `
                  <div class="mt-1">
                    <div class="inline-flex items-center px-2 py-1 rounded-full text-xs ${yoyChange >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                        <path d="${yoyChange >= 0 ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                      </svg>
                      <span class="font-medium">
                        YoY: ${yoyChange >= 0 ? '+' : ''}${formatNumberComplete(Math.round(yoyChange), 0)} 
                        (${yoyPercentage >= 0 ? '+' : ''}${yoyPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  ` : ''}
                </div>
                
                <!-- Ranking (si está disponible y no es confidencial) -->
                ${rank !== null && !isConfidential ? `
                <div class="mb-2">
                  <div class="bg-yellow-50 p-1.5 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-1">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="text-sm">Posición </span>
                    <span class="font-bold text-md mx-1">${rank}</span>
                    <span class="text-gray-600 text-sm">${language === 'es' ? `de ${nonConfidentialItems.length}` : `of ${nonConfidentialItems.length}`}</span>
                  </div>
                </div>
                ` : ''}

                <!-- Comparación con Canarias (si no es Canarias y hay datos) -->
                ${canariasValue !== null && !isCanariasRegion && !isConfidential ? `
                <div class="mb-2">
                  <div class="bg-gray-50 p-2 rounded-md">
                    <div class="text-xs text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                        <path d="M8 3l4 8 5-5v7H3V6l5 5 4-8z"></path>
                      </svg>
                      ${language === 'es' ? 'vs Canarias:' : 'vs Canary Islands:'}
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600">${language === 'es' ? 'Canarias' : 'Canary Islands'} (${formatNumberComplete(Math.round(canariasValue), 0)}):</span>
                      <span class="font-medium ${value > canariasValue ? 'text-green-600' : value < canariasValue ? 'text-red-600' : 'text-gray-600'}">
                        ${(() => {
                          if (value === canariasValue) return '=';
                          const difference = value - canariasValue;
                          const percentDiff = ((difference / canariasValue) * 100).toFixed(1);
                          return `${difference > 0 ? '+' : ''}${percentDiff}%`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
                ` : ''}

                <!-- Lista de provincias con valores individuales del dataset -->
                ${provincesFromDataset.length > 0 ? `
                <div class="mb-2">
                  <div class="text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${language === 'es' ? 'Provincias:' : 'Provinces:'}
                  </div>
                  <div class="space-y-0.5 text-xs">
                    ${provincesFromDataset
                      .filter((province) => province.value > 0)
                      .sort((a, b) => b.value - a.value)
                      .map((province) => {
                        const percentage = value > 0 ? ((province.value / value) * 100).toFixed(1) : '0.0';
                        return `
                        <div class="flex justify-between items-center py-1 px-2 bg-white rounded border border-gray-200">
                          <div class="flex items-center">
                            <div class="w-1 h-1 rounded-full mr-1.5 bg-blue-500"></div>
                            <span class="text-gray-700 text-xs">${province.name}</span>
                          </div>
                          <span class="font-medium text-gray-800 text-xs">${formatNumberComplete(Math.round(province.value), 0)} (${percentage}%)</span>
                        </div>
                      `}).join('')}
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
  const hasData = data.length > 0 && data.some(item => {
    const yearKey = selectedYear.toString();
    const yearValue = item[yearKey];
    return yearValue && parseFloat(yearValue) > 0;
  });
  
  // Estilos para el contenedor con scroll horizontal
  const scrollContainerStyle: React.CSSProperties = {
    height: '520px',
    overflowX: 'auto',
    overflowY: 'hidden',
    border: '1px solid rgba(229, 231, 235, 0.4)',
    borderRadius: '12px',
    padding: '10px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6',
    msOverflowStyle: 'none',
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  } as React.CSSProperties;

  // Si no hay datos, mostrar mensaje de no disponibilidad
  if (!hasData) {
    return (
      <div className="flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm" style={{ height: '620px' }}>
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
    <div className="relative bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 rounded-xl border border-gray-200/60 shadow-sm overflow-hidden" style={{ height: '620px' }} ref={containerRef}>
      {/* Header mejorado con gradiente y icono */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/40 border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-center space-x-3">
          {/* Icono de gráfico de barras */}
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          {/* Título mejorado */}
          <div className="text-center">
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
              {t.title}
            </h3>
            <div className="flex items-center justify-center mt-1 space-x-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">{selectedYear}</span>
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenedor del gráfico con padding mejorado */}
      <div className="p-4">
        <div style={scrollContainerStyle} ref={scrollContainerRef} className="custom-scrollbar">
          <div style={{ height: `${chartHeight}px`, width: `${Math.max(800, chartData.labels.length * 60)}px` }}>
            <Bar 
              ref={chartRef}
              data={chartData}
              options={options}
            />
          </div>
        </div>
        
        {/* Etiqueta del eje Y centrada con estilo mejorado */}
        <div className="text-center mt-4 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 shadow-sm">
            <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {t.axisLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatentsRegionalChart; 