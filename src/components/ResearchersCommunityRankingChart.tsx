import React, { memo, useRef, useEffect } from 'react';
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
  ChartEvent,
  Chart
} from 'chart.js';
import * as d3 from 'd3';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Definir colores específicos para los componentes de investigadores (igual que en ResearcherRankingChart)
const RESEARCHER_SECTOR_COLORS = {
  total: '#607D8B',        // Azul grisáceo (antes para organizaciones sin fines de lucro)
  business: '#546E7A',     // Azul grisáceo más sobrio para empresas
  government: '#795548',   // Marrón para gobierno
  education: '#7E57C2',    // Morado para educación
  nonprofit: '#5C6BC0'     // Azul índigo (antes para todos los sectores)
};

// Interfaz para los datos de investigadores por comunidades autónomas
interface ResearchersCommunityData {
  TERRITORIO: string;
  TERRITORIO_CODE: string;
  TIME_PERIOD: string;
  TIME_PERIOD_CODE: string;
  SEXO: string;
  SEXO_CODE: string;
  SECTOR_EJECUCION: string;
  SECTOR_EJECUCION_CODE: string;
  MEDIDAS: string;
  MEDIDAS_CODE: string;
  OBS_VALUE: string;
  [key: string]: string;
}

// Interfaz para las banderas de comunidades autónomas
interface CommunityFlag {
  community: string;
  code: string;
  flag: string;
}

// Props del componente
interface ResearchersCommunityRankingChartProps {
  data: ResearchersCommunityData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  maxItems?: number; // Número máximo de comunidades a mostrar (opcional)
}

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: '#1e88e5', // Azul por defecto
  LIGHT: '#90caf9',   // Azul claro
  HIGHLIGHT: '#ff5252', // Rojo para destacar
  TEXT: '#000000',    // Color del texto (negro) 
  BORDER: '#E5E7EB',  // Color del borde (gris suave)
  CANARIAS: '#FFD600', // Amarillo para Canarias
};

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres normalizados
const communityNameMapping: { [key: string]: { es: string, en: string } } = {
  'Andalucía': { es: 'Andalucía', en: 'Andalusia' },
  'Andalucia': { es: 'Andalucía', en: 'Andalusia' },
  'Aragón': { es: 'Aragón', en: 'Aragon' },
  'Aragon': { es: 'Aragón', en: 'Aragon' },
  'Principado de Asturias': { es: 'Asturias', en: 'Asturias' },
  'Asturias': { es: 'Asturias', en: 'Asturias' },
  'Illes Balears / Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Illes Balears': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Balearic Islands': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Islas Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Canary Islands': { es: 'Canarias', en: 'Canary Islands' },
  'Cantabria': { es: 'Cantabria', en: 'Cantabria' },
  'Castilla - La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-la Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castillalamancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla y León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla y Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Cataluña': { es: 'Cataluña', en: 'Catalonia' },
  'Cataluna': { es: 'Cataluña', en: 'Catalonia' },
  'Catalunya': { es: 'Cataluña', en: 'Catalonia' },
  'Catalonia': { es: 'Cataluña', en: 'Catalonia' },
  'Comunidad Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'C. Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencia': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencian Community': { es: 'Com. Valenciana', en: 'Valencia' },
  'Extremadura': { es: 'Extremadura', en: 'Extremadura' },
  'Galicia': { es: 'Galicia', en: 'Galicia' },
  'La Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Comunidad de Madrid': { es: 'Madrid', en: 'Madrid' },
  'Madrid': { es: 'Madrid', en: 'Madrid' },
  'Región de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Region de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Murcia': { es: 'Murcia', en: 'Murcia' },
  'Comunidad Foral de Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarre': { es: 'Navarra', en: 'Navarre' },
  'País Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Pais Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Euskadi': { es: 'País Vasco', en: 'Basque Country' },
  'Basque Country': { es: 'País Vasco', en: 'Basque Country' },
  'Ciudad Autónoma de Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ciudad Autónoma de Melilla': { es: 'Melilla', en: 'Melilla' },
  'Melilla': { es: 'Melilla', en: 'Melilla' }
};

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Aseguramos el tipo correcto para el array de flags
const communityFlags = autonomous_communities_flags as CommunityFlag[];

const ResearchersCommunityRankingChart: React.FC<ResearchersCommunityRankingChartProps> = ({
  data,
  selectedYear,
  selectedSector,
  language,
  maxItems = 17, // Por defecto mostramos todas las comunidades autónomas
}) => {
  const chartRef = useRef<Chart<'bar', number[], string>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Textos según el idioma
  const texts = {
    es: {
      title: 'Ranking de Comunidades Autónomas por número de investigadores',
      noData: 'No hay datos disponibles',
      researchersLabel: 'Investigadores',
      loading: 'Cargando...',
      researchers: 'Investigadores',
      thousands: 'miles',
      comparative: "Comparativa",
      vsSpain: "vs España",
      vsCanarias: "vs Canarias"
    },
    en: {
      title: 'Ranking of Autonomous Communities by number of researchers',
      noData: 'No data available',
      researchersLabel: 'Researchers',
      loading: 'Loading...',
      researchers: 'Researchers',
      thousands: 'thousands',
      comparative: "Comparative",
      vsSpain: "vs Spain",
      vsCanarias: "vs Canary Islands"
    }
  };

  const t = texts[language];

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
      const globalTooltip = document.getElementById('global-chart-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
      
      // Limpiar estilos del tooltip
      const tooltipStyles = document.getElementById('tooltip-chart-styles');
      if (tooltipStyles && tooltipStyles.parentNode) {
        tooltipStyles.parentNode.removeChild(tooltipStyles);
      }
    };
  }, []);

  // Funciones para manejar el tooltip global
  const createGlobalTooltip = (): HTMLElement => {
    // Verificar si ya existe un tooltip global
    let tooltipElement = document.getElementById('global-chart-tooltip');
    
    if (!tooltipElement) {
      // Crear nuevo tooltip y agregarlo al body
      tooltipElement = document.createElement('div');
      tooltipElement.id = 'global-chart-tooltip';
      tooltipElement.className = 'chart-tooltip'; // Clase para poder aplicar estilos
      
      // Aplicar estilos base manualmente
      Object.assign(tooltipElement.style, {
        position: 'fixed',
        display: 'none',
        opacity: '0',
        zIndex: '999999',
        pointerEvents: 'none',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        padding: '0', 
        minWidth: '150px',
        maxWidth: '320px',
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
      styleSheet.id = 'tooltip-chart-styles';
      styleSheet.textContent = `
        #global-chart-tooltip {
          transform-origin: center;
          transform: scale(0.95);
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
        }
        #global-chart-tooltip.visible {
          opacity: 1 !important;
          transform: scale(1);
        }
        #global-chart-tooltip .text-green-600 { color: #059669; }
        #global-chart-tooltip .text-red-600 { color: #DC2626; }
        #global-chart-tooltip .bg-blue-50 { background-color: #EFF6FF; }
        #global-chart-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
        #global-chart-tooltip .border-blue-100 { border-color: #DBEAFE; }
        #global-chart-tooltip .border-gray-100 { border-color: #F3F4F6; }
        #global-chart-tooltip .text-gray-500 { color: #6B7280; }
        #global-chart-tooltip .text-blue-700 { color: #1D4ED8; }
        #global-chart-tooltip .text-gray-800 { color: #1F2937; }
        #global-chart-tooltip .text-gray-600 { color: #4B5563; }
        #global-chart-tooltip .text-yellow-500 { color: #F59E0B; }
        #global-chart-tooltip .rounded-lg { border-radius: 0.5rem; }
        #global-chart-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        #global-chart-tooltip .p-3 { padding: 0.75rem; }
        #global-chart-tooltip .p-4 { padding: 1rem; }
        #global-chart-tooltip .p-2 { padding: 0.5rem; }
        #global-chart-tooltip .pt-3 { padding-top: 0.75rem; }
        #global-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #global-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #global-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #global-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #global-chart-tooltip .mr-2 { margin-right: 0.5rem; }
        #global-chart-tooltip .mt-1 { margin-top: 0.25rem; }
        #global-chart-tooltip .mt-3 { margin-top: 0.75rem; }
        #global-chart-tooltip .text-xs { font-size: 0.75rem; }
        #global-chart-tooltip .text-sm { font-size: 0.875rem; }
        #global-chart-tooltip .text-lg { font-size: 1.125rem; }
        #global-chart-tooltip .text-xl { font-size: 1.25rem; }
        #global-chart-tooltip .font-bold { font-weight: 700; }
        #global-chart-tooltip .font-medium { font-weight: 500; }
        #global-chart-tooltip .flex { display: flex; }
        #global-chart-tooltip .items-center { align-items: center; }
        #global-chart-tooltip .justify-between { justify-content: space-between; }
        #global-chart-tooltip .w-8 { width: 2rem; }
        #global-chart-tooltip .h-6 { height: 1.5rem; }
        #global-chart-tooltip .w-36 { width: 9rem; }
        #global-chart-tooltip .w-48 { width: 12rem; }
        #global-chart-tooltip .rounded { border-radius: 0.25rem; }
        #global-chart-tooltip .rounded-md { border-radius: 0.375rem; }
        #global-chart-tooltip .overflow-hidden { overflow: hidden; }
        #global-chart-tooltip .border-t { border-top-width: 1px; }
        #global-chart-tooltip .border-b { border-bottom-width: 1px; }
        #global-chart-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
        #global-chart-tooltip .max-w-xs { max-width: 20rem; }
        #global-chart-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
        #global-chart-tooltip .w-full { width: 100%; }
        #global-chart-tooltip .h-full { height: 100%; }
        #global-chart-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
        #global-chart-tooltip .flag-container { min-width: 2rem; min-height: 1.5rem; }
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
      borderRadius: '4px',
      padding: '0',
      minWidth: '150px',
      maxWidth: '320px',
      border: '1px solid #e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
    });
    
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    
    // Obtener posición del mouse
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Posicionar más cerca del elemento - menos offset
    let left = mouseX + 10;
    let top = mouseY - (tooltipHeight / 2);
    
    // Ajustar posición si se sale de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (left + tooltipWidth > windowWidth) {
      left = mouseX - tooltipWidth - 10;
    }
    
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
    const tooltipEl = document.getElementById('global-chart-tooltip');
    if (tooltipEl) {
      // Quitar la clase visible primero para la animación
      tooltipEl.classList.remove('visible');
      
      // Después de la transición, ocultar el tooltip
      setTimeout(() => {
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }, 150);
    }
  };

  const getCommunityFlagUrl = (communityName: string): string => {
    // Normalizar el nombre de la comunidad
    const normalizedName = normalizarTexto(communityName);
    
    console.log(`Buscando bandera para: "${communityName}" (normalizado: "${normalizedName}")`);
    
    // CORRECCIÓN DIRECTA: detectar manualmente las comunidades problemáticas
    // Esto se ejecuta primero para garantizar que estos casos específicos se manejen correctamente
    if (normalizedName.includes('extrem') || communityName.includes('Extrem')) {
      console.log('CORRECCIÓN DIRECTA: Extremadura detectada');
      return 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg';
    }
    
    if (normalizedName.includes('rioja') || communityName.includes('Rioja')) {
      console.log('CORRECCIÓN DIRECTA: La Rioja detectada');
      return 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg';
    }
    
    if (normalizedName.includes('mancha') || 
        normalizedName.includes('castilla-la') || 
        normalizedName.includes('castilla la') ||
        communityName.includes('Mancha') || 
        communityName.includes('Castilla-La') || 
        communityName.includes('Castilla La')) {
      console.log('CORRECCIÓN DIRECTA: Castilla-La Mancha detectada');
      return 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg';
    }
    
    if (normalizedName.includes('cantabr') || communityName.includes('Cantabr')) {
      console.log('CORRECCIÓN DIRECTA: Cantabria detectada');
      return 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg';
    }
    
    // Mapa definitivo de banderas para todas las CCAA con URLs directas
    // Esta es nuestra fuente de verdad para todas las banderas
    const definitiveFlagMap: Record<string, string> = {
      'andalucía': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Andaluc%C3%ADa.svg',
      'aragón': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Flag_of_Aragon.svg',
      'asturias': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Flag_of_Asturias.svg',
      'cantabria': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg',
      'castilla-la mancha': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg',
      'castilla y león': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg',
      'cataluña': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg',
      'extremadura': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg',
      'galicia': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Flag_of_Galicia.svg',
      'islas baleares': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg',
      'canarias': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Flag_of_the_Canary_Islands.svg',
      'la rioja': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg',
      'madrid': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_the_Community_of_Madrid.svg',
      'murcia': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Murcia.svg',
      'navarra': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Navarre.svg',
      'país vasco': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg',
      'comunidad valenciana': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
      'ceuta': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Flag_of_Ceuta.svg',
      'melilla': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Flag_of_Melilla.svg'
    };
    
    // Búsqueda rápida: comprobar si ya tenemos el nombre en nuestro mapa definitivo
    if (definitiveFlagMap[normalizedName]) {
      console.log(`Bandera encontrada directamente para "${normalizedName}": ${definitiveFlagMap[normalizedName]}`);
      return definitiveFlagMap[normalizedName];
    }
    
    // Mapa completo de todos los posibles nombres para cada comunidad autónoma
    const communityVariants: Record<string, string[]> = {
      'andalucía': ['andalucía', 'andalucia', 'andalusia'],
      'aragón': ['aragón', 'aragon'],
      'asturias': ['asturias', 'principado de asturias', 'asturias principality'],
      'cantabria': ['cantabria', 'cantabr'],
      'castilla-la mancha': ['castilla-la mancha', 'castilla la mancha', 'castillalamancha', 'castilla–la mancha', 'mancha'],
      'castilla y león': ['castilla y león', 'castilla y leon', 'castilla leon', 'castile and león', 'castile and leon'],
      'cataluña': ['cataluña', 'cataluna', 'catalunya', 'catalonia'],
      'extremadura': ['extremadura', 'extrem', 'extrema', 'extremad'],
      'galicia': ['galicia'],
      'islas baleares': ['islas baleares', 'illes balears', 'baleares', 'balearic islands'],
      'canarias': ['canarias', 'islas canarias', 'canary islands'],
      'la rioja': ['la rioja', 'rioja'],
      'madrid': ['madrid', 'comunidad de madrid', 'community of madrid'],
      'murcia': ['murcia', 'región de murcia', 'region de murcia'],
      'navarra': ['navarra', 'comunidad foral de navarra', 'navarre'],
      'país vasco': ['país vasco', 'pais vasco', 'euskadi', 'basque country'],
      'comunidad valenciana': ['comunidad valenciana', 'com. valenciana', 'c. valenciana', 'valencia', 'valencian community'],
      'ceuta': ['ceuta', 'ciudad autónoma de ceuta', 'ciudad autonoma de ceuta'],
      'melilla': ['melilla', 'ciudad autónoma de melilla', 'ciudad autonoma de melilla']
    };
    
    // Detectar a qué comunidad corresponde el nombre
    let matchedCommunity = '';
    
    // 1. Intentar coincidencia directa con el nombre normalizado
    for (const [community, variants] of Object.entries(communityVariants)) {
      if (variants.some(variant => normalizarTexto(variant) === normalizedName)) {
        matchedCommunity = community;
        console.log(`Coincidencia directa encontrada: "${communityName}" -> "${community}"`);
        break;
      }
    }
    
    // 2. Si no hay coincidencia directa, intentar coincidencia parcial
    if (!matchedCommunity) {
      for (const [community, variants] of Object.entries(communityVariants)) {
        if (variants.some(variant => 
          normalizarTexto(variant).includes(normalizedName) || 
          normalizedName.includes(normalizarTexto(variant)))) {
          matchedCommunity = community;
          console.log(`Coincidencia parcial encontrada: "${communityName}" -> "${community}"`);
          break;
        }
      }
    }
    
    // 3. Si aún no hay coincidencia, buscar por fragmentos clave
    if (!matchedCommunity) {
      const keywordMap: Record<string, string> = {
        'andalu': 'andalucía',
        'arag': 'aragón',
        'astur': 'asturias',
        'cantab': 'cantabria',
        'mancha': 'castilla-la mancha',
        'castilla': 'castilla y león', // Por defecto, si solo menciona Castilla
        'leon': 'castilla y león',
        'catal': 'cataluña',
        'extrem': 'extremadura',
        'galic': 'galicia',
        'balear': 'islas baleares',
        'canar': 'canarias',
        'rioja': 'la rioja',
        'madrid': 'madrid',
        'murc': 'murcia',
        'navarr': 'navarra',
        'vasco': 'país vasco',
        'basque': 'país vasco',
        'valen': 'comunidad valenciana',
        'ceuta': 'ceuta',
        'melill': 'melilla'
      };
      
      for (const [keyword, community] of Object.entries(keywordMap)) {
        if (normalizedName.includes(keyword)) {
          matchedCommunity = community;
          console.log(`Coincidencia por palabra clave "${keyword}": "${communityName}" -> "${community}"`);
          break;
        }
      }
    }
    
    // 4. Si encontramos una comunidad, devolver su bandera desde nuestro mapa definitivo
    if (matchedCommunity && definitiveFlagMap[matchedCommunity]) {
      console.log(`Bandera encontrada para ${matchedCommunity}: ${definitiveFlagMap[matchedCommunity]}`);
      return definitiveFlagMap[matchedCommunity];
    }
    
    // 5. Si todo lo anterior falla, intentar encontrar la bandera desde communityFlags
    // (Este es un último recurso, pero mantenemos la compatibilidad)
    const specificNameMapping: Record<string, string> = {
      'extremadura': 'extremadura',
      'castilla y leon': 'castilla y leon',
      'castilla leon': 'castilla y leon',
      'castilla-la mancha': 'castilla-la mancha',
      'navarra': 'comunidad foral de navarra',
      'asturias': 'principado de asturias',
      'ceuta': 'ciudad autonoma de ceuta',
      'melilla': 'ciudad autonoma de melilla',
      'la rioja': 'la rioja',
      'rioja': 'la rioja',
      'cantabria': 'cantabria'
    };
    
    // Si el nombre normalizado está en el mapa de conversión específico, usar ese nombre
    const mappedName = specificNameMapping[normalizedName] || normalizedName;
    
    // Buscar en communityFlags con diferentes estrategias
    let matchingFlag = communityFlags.find(flag => 
      normalizarTexto(flag.community) === mappedName
    );
    
    // Si no hay coincidencia exacta, probar con coincidencia parcial
    if (!matchingFlag) {
      matchingFlag = communityFlags.find(flag => {
        const flagCommunity = normalizarTexto(flag.community);
        return flagCommunity.includes(mappedName) || mappedName.includes(flagCommunity);
      });
    }
    
    // Si encontramos una bandera en communityFlags, usarla
    if (matchingFlag) {
      console.log(`Bandera encontrada en communityFlags: ${matchingFlag.flag}`);
      return matchingFlag.flag;
    }
    
    // 6. FALLBACK ABSOLUTO: Hacer una aproximación forzada basada en el nombre
    // Intentamos adivinar la comunidad autónoma analizando fragmentos del nombre
    // Esto solo debe ocurrir en casos muy extraños donde todo lo anterior falló
    
    console.log(`No se encontró coincidencia para "${communityName}" con métodos estándar, aplicando fallback forzado`);
    
    // FALLBACK DIRECTO para las comunidades problemáticas
    if (normalizedName.includes('extrem')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg';
    }
    if (normalizedName.includes('rioja')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg';
    }
    if (normalizedName.includes('mancha') || normalizedName.includes('castilla-la') || normalizedName.includes('castilla la')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg';
    }
    if (normalizedName.includes('cantabr')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg';
    }
    
    // Tabla de decisión final basada en fragmentos de texto
    // Ordenados de más específicos a más generales
    const fallbackDecisionTable: [string, string][] = [
      ['rioja', 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg'],
      ['mancha', 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg'],
      ['castilla', 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg'],
      ['leon', 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg'],
      ['valen', 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg'],
      ['vasco', 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg'],
      ['basque', 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg'],
      ['euskadi', 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg'],
      ['madrid', 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_the_Community_of_Madrid.svg'],
      ['andalu', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Andaluc%C3%ADa.svg'],
      ['astur', 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Flag_of_Asturias.svg'],
      ['cantabr', 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg'],
      ['aragon', 'https://upload.wikimedia.org/wikipedia/commons/1/18/Flag_of_Aragon.svg'],
      ['catal', 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg'],
      ['galicia', 'https://upload.wikimedia.org/wikipedia/commons/6/64/Flag_of_Galicia.svg'],
      ['extrem', 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg'],
      ['balear', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg'],
      ['canar', 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Flag_of_the_Canary_Islands.svg'],
      ['navarr', 'https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Navarre.svg'],
      ['murcia', 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Murcia.svg'],
      ['ceuta', 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Flag_of_Ceuta.svg'],
      ['melilla', 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Flag_of_Melilla.svg']
    ];
    
    for (const [fragment, flagUrl] of fallbackDecisionTable) {
      if (normalizedName.includes(fragment)) {
        console.log(`FALLBACK: Coincidencia forzada por fragmento "${fragment}" -> ${flagUrl}`);
        return flagUrl;
      }
    }
    
    // SOLUCIÓN FINAL: Mapeo directo de nombres más comunes (incluso con errores de escritura)
    const directFlagUrlsForProblematicNames: Record<string, string> = {
      'extremadura': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg',
      'extramadura': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg',
      'castila-la mancha': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg',
      'castilla-la mancha': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg',
      'la rioja': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg',
      'rioja': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg',
      'cantabria': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg'
    };
    
    // Verificar si el nombre original (sin normalizar) está en este mapa especial
    if (directFlagUrlsForProblematicNames[communityName.toLowerCase()]) {
      console.log(`ÚLTIMA SOLUCIÓN: Encontrada bandera directa para "${communityName.toLowerCase()}"`);
      return directFlagUrlsForProblematicNames[communityName.toLowerCase()];
    }
    
    console.log(`¡ATENCIÓN! No se pudo encontrar bandera para: "${communityName}" a pesar de todos los intentos.`);
    
    // Si nada funciona, devolver una URL de bandera de España genérica
    return "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg";
  };

  // Función para formatear números con separador de miles
  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(value);
  };

  // Función para obtener el valor del año anterior para una comunidad
  const getPreviousYearValue = (communityName: string, code: string): number | null => {
    const prevYear = selectedYear - 1;
    const sectorId = getSectorId();
    
    // Buscar datos del año anterior para la misma comunidad y sector
    const prevYearData = data.filter(item => 
      item.TIME_PERIOD === prevYear.toString() &&
      item.SECTOR_EJECUCION_CODE === sectorId &&
      item.SEXO_CODE === '_T' &&
      item.MEDIDAS_CODE === 'INVESTIGADORES_EJC' &&
      (normalizarTexto(item.TERRITORIO) === normalizarTexto(communityName) || 
       item.TERRITORIO_CODE === code)
    );
    
    if (prevYearData.length === 0) return null;
    
    const value = parseFloat(prevYearData[0].OBS_VALUE);
    return isNaN(value) ? null : value;
  };

    // Mapear el sector seleccionado al código del sector en los datos
  const getSectorId = () => {
    let sectorId = '';
    switch (selectedSector.toLowerCase()) {
      case 'total':
        sectorId = '_T';
        break;
      case 'business':
        sectorId = 'EMPRESAS';
        break;
      case 'government':
        sectorId = 'ADMINISTRACION_PUBLICA';
        break;
      case 'education':
        sectorId = 'ENSENIANZA_SUPERIOR';
        break;
      case 'nonprofit':
        sectorId = 'IPSFL';
        break;
      default:
        sectorId = '_T'; // Total por defecto
    }
    return sectorId;
  };

  // Filtrar y procesar datos para el gráfico
  const getChartData = () => {
    const sectorId = getSectorId();

    // Filtrar datos por año, sector, sexo (total) y medida (INVESTIGADORES_EJC)
    const filteredData = data.filter(item => 
      item.TIME_PERIOD === selectedYear.toString() &&
      item.SECTOR_EJECUCION_CODE === sectorId &&
      item.SEXO_CODE === '_T' &&
      item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
    );

    if (filteredData.length === 0) return [];

    // Transformar los datos para el gráfico
    const chartData = filteredData.map(item => {
      // Obtener el nombre normalizado de la comunidad
      const communityName = item.TERRITORIO;
      const normalizedName = Object.keys(communityNameMapping).find(key => 
        normalizarTexto(key) === normalizarTexto(communityName)
      );
      
      // Usar el nombre normalizado según el idioma
      const displayName = normalizedName 
        ? (language === 'es' ? communityNameMapping[normalizedName].es : communityNameMapping[normalizedName].en)
        : communityName;
      
      // Obtener la bandera de la comunidad si está disponible
      const flagUrl = getCommunityFlagUrl(displayName);
      
      return {
        name: displayName,
        originalName: communityName,
        value: parseFloat(item.OBS_VALUE),
        code: item.TERRITORIO_CODE,
        flag: flagUrl
      };
    })
    .filter(item => {
      // Filtrar para eliminar entradas no válidas y España
      if (isNaN(item.value)) return false;
      
      // Excluir España (puede aparecer como "España", "Spain", "ESPAÑA", etc.)
      const normalizedName = normalizarTexto(item.name);
      const normalizedOriginal = normalizarTexto(item.originalName);
      
      return !normalizedName.includes('españa') && 
             !normalizedName.includes('spain') && 
             !normalizedOriginal.includes('españa') && 
             !normalizedOriginal.includes('spain') && 
             item.code !== 'ES' && 
             item.code !== 'ESPAÑA';
    })
    .sort((a, b) => b.value - a.value) // Ordenar de mayor a menor
    .slice(0, maxItems); // Limitar número de elementos si es necesario

    return chartData;
  };

  const chartData = getChartData();

  // Función para manejar eventos de tooltip
  const handleChartEvent = (event: ChartEvent, elements: Array<unknown>) => {
    const chartCanvas = document.querySelector('canvas');
    if (chartCanvas) {
      chartCanvas.style.cursor = elements && elements.length ? 'pointer' : 'default';
      
      // Si no hay elementos activos, ocultar el tooltip
      if (!elements || elements.length === 0) {
        hideGlobalTooltip();
        return;
      }

      // Obtener el elemento activo
      if (elements && elements.length > 0 && event.native) {
        // @ts-expect-error - Ignoramos errores de tipos ya que es difícil tipar esto correctamente
        const dataIndex = elements[0].index;
        
        // Comprobar si hay datos para este índice
        if (chartData[dataIndex]) {
          const communityData = chartData[dataIndex];
          const communityName = communityData.name;
          
          // Obtener el rank
          const rank = dataIndex + 1;
          const total = chartData.length;
          
          // Construir contenido del tooltip con estilos inline para mayor compatibilidad
          const tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <!-- Cabecera con bandera y nombre -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                ${communityData.flag ? 
                  `<div class="w-8 h-6 mr-2 rounded overflow-hidden border border-gray-200">
                    <img src="${communityData.flag}" style="width: 100%; height: 100%; object-fit: cover;" alt="${communityName}" />
                   </div>` 
                  : ''}
                <h3 class="text-lg font-bold text-gray-800">${communityName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                    <span>${t.researchers}:</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-blue-700">
                      ${formatNumber(communityData.value, 0)}
                    </span>
                  </div>
                  ${(() => {
                    // Obtener el valor del año anterior
                    const prevValue = getPreviousYearValue(communityData.originalName, communityData.code);
                    if (prevValue !== null) {
                      const diff = communityData.value - prevValue;
                      const percentage = (diff / prevValue) * 100;
                      const isPositive = diff > 0;
                      return `
                        <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                            <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                          </svg>
                          <span>${isPositive ? '+' : ''}${percentage.toFixed(1)}% vs ${selectedYear - 1}</span>
                        </div>
                      `;
                    }
                    return '';
                  })()}
                </div>
                
                <!-- Ranking -->
                <div class="mb-4">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Rank </span>
                    <span class="font-bold text-lg mx-1">${rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${total}` : `of ${total}`}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Mostrar tooltip global con el contenido generado
          const nativeEvent = event.native as MouseEvent;
          positionGlobalTooltip(nativeEvent, tooltipContent);
        }
      }
    }
  };

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

  // Agregar estilos específicos para el scrollbar con CSS en useEffect
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-scrollbar-styles';
    
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
    
    document.head.appendChild(styleElement);
    
    return () => {
      const existingStyle = document.getElementById('custom-scrollbar-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Si no hay datos, mostrar mensaje de no disponibilidad
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{t.noData}</p>
        </div>
      </div>
    );
  }

  // Altura dinámica para el gráfico en función del número de comunidades
  const chartHeight = Math.max(400, chartData.length * 28);

  // Configuración del gráfico
  const getChartConfig = () => {
    const labels = chartData.map(item => item.name);
    const values = chartData.map(item => item.value);
    
    // Obtener el color del sector seleccionado
    const sectorColor = RESEARCHER_SECTOR_COLORS[selectedSector as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
    
    // Generar colores (Canarias en amarillo, el resto según el color del sector)
    const backgroundColors = chartData.map(item => {
      const communityName = item.name.toLowerCase();
      return communityName.includes('canarias') || 
             communityName.includes('canary') ? 
             CHART_PALETTE.CANARIAS : sectorColor;
    });
    
    const data = {
      labels,
      datasets: [{
        label: t.researchers,
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => {
          return d3.color(color)?.darker(0.2)?.toString() || color;
        }),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 18,
        barPercentage: 0.95,
        categoryPercentage: 0.97
      }]
    };
    
    const options: ChartOptions<'bar'> = {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        handleChartEvent(event, elements);
      },
      onHover: (event, elements) => {
        handleChartEvent(event, elements);
      },
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'mouseenter'],
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: CHART_PALETTE.TEXT,
            font: {
              size: 11
            },
            padding: 5
          },
          afterFit: (scaleInstance) => {
            scaleInstance.width = Math.max(scaleInstance.width, 120);
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
          title: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      }
    };
    
    return { data, options };
  };

  const chartConfig = getChartConfig();
  
  // Función para mapear el sector a su nombre localizado
  const getSectorName = () => {
    const sectorNames: Record<string, { es: string, en: string }> = {
      'total': {
        es: 'Todos los sectores',
        en: 'All sectors'
      },
      'business': {
        es: 'Empresas',
        en: 'Business enterprise'
      },
      'government': {
        es: 'Administración Pública',
        en: 'Government'
      },
      'education': {
        es: 'Enseñanza Superior',
        en: 'Higher education'
      },
      'nonprofit': {
        es: 'Instituciones sin fines de lucro',
        en: 'Non-profit institutions'
      }
    };
    
    return sectorNames[selectedSector] ? 
            sectorNames[selectedSector][language] : 
            (language === 'es' ? 'Todos los sectores' : 'All sectors');
  };

  return (
    <div className="relative h-full" ref={containerRef}>
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {language === 'es' ? `Ranking de investigadores por CCAA · ${selectedYear}` : `Researchers Ranking by Region · ${selectedYear}`}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(RESEARCHER_SECTOR_COLORS[selectedSector as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total)?.copy({ opacity: 0.15 })}` }}>
          {getSectorName()}
        </div>
      </div>
      
      <div style={scrollContainerStyle} ref={scrollContainerRef} className="custom-scrollbar">
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
          <Bar 
      ref={chartRef} 
            data={chartConfig.data}
            options={chartConfig.options}
          />
        </div>
      </div>
      
      {/* Etiqueta del eje X centrada */}
      <div className="text-center mt-2 mb-2 text-sm font-medium text-gray-700">
        {t.researchers}
      </div>
    </div>
  );
};

export default memo(ResearchersCommunityRankingChart);