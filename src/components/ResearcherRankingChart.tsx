import React, { useRef } from 'react';
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
  ChartOptions
} from 'chart.js';
import { EU_COLORS } from '../utils/colors';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';

// Definir colores específicos para los componentes de investigadores
const RESEARCHER_SECTOR_COLORS = {
  total: '#607D8B',        // Azul grisáceo (antes para organizaciones sin fines de lucro)
  business: '#546E7A',     // Azul grisáceo más sobrio para empresas
  government: '#795548',   // Marrón para gobierno
  education: '#7E57C2',    // Morado para educación (intercambiado)
  nonprofit: '#5C6BC0'     // Azul índigo (antes para todos los sectores)
};

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Interfaz para los datos ordenados
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

// Interfaz para los datos del gráfico
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

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Definir la interfaz para los datos de entrada
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
}

// Interfaz para las propiedades del componente
interface ResearcherRankingChartProps {
  data: ResearchersData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
}

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: EU_COLORS.PRIMARY_BLUE, // Azul UE principal
  LIGHT: EU_COLORS.ALT_BLUE,       // Azul UE más claro
  DARK: '#002266',                 // Variante más oscura del azul UE
  HIGHLIGHT: '#CC0000',            // Mantener el rojo para España
  TEXT: '#000000',                 // Color del texto (negro) 
  BORDER: '#E5E7EB',               // Color del borde (gris suave)
  YELLOW: EU_COLORS.PRIMARY_YELLOW, // Amarillo UE para Unión Europea
  GREEN: '#009900'                 // Verde para las zonas Euro
};

// Mapeo de etiquetas a descripciones
const labelDescriptions: Record<string, { es: string, en: string }> = {
  'e': {
    es: 'Estimado',
    en: 'Estimated'
  },
  'p': {
    es: 'Provisional',
    en: 'Provisional'
  },
  'b': {
    es: 'Ruptura en la serie',
    en: 'Break in series'
  },
  'd': {
    es: 'Definición difiere',
    en: 'Definition differs'
  },
  'u': {
    es: 'Baja fiabilidad',
    en: 'Low reliability'
  },
  'bd': {
    es: 'Ruptura en la serie y definición difiere',
    en: 'Break in series and definition differs'
  },
  'bp': {
    es: 'Ruptura en la serie y provisional',
    en: 'Break in series and provisional'
  },
  'dp': {
    es: 'Definición difiere y provisional',
    en: 'Definition differs and provisional'
  },
  'ep': {
    es: 'Estimado y provisional',
    en: 'Estimated and provisional'
  }
};

// Función para obtener la URL de la bandera del país (similar a ResearchersEuropeanMap)
function getCountryFlagUrl(countryCode: string): string {  
  // Intentar diferentes enfoques para encontrar la bandera correcta
  
  // 1. Intentar directamente por ISO3
  let foundFlag = countryFlags.find(flag => flag.iso3 === countryCode);
  
  // 2. Si no se encontró, buscar por ISO2
  if (!foundFlag) {
    // Mapeo de ISO3 a ISO2 para códigos comunes
    const iso3ToIso2: Record<string, string> = {
      'AUT': 'AT', 'BEL': 'BE', 'BGR': 'BG', 'CYP': 'CY', 'CZE': 'CZ',
      'DEU': 'DE', 'DNK': 'DK', 'EST': 'EE', 'GRC': 'EL', 'ESP': 'ES',
      'FIN': 'FI', 'FRA': 'FR', 'HRV': 'HR', 'HUN': 'HU', 'IRL': 'IE',
      'ITA': 'IT', 'LTU': 'LT', 'LUX': 'LU', 'LVA': 'LV', 'MLT': 'MT',
      'NLD': 'NL', 'POL': 'PL', 'PRT': 'PT', 'ROU': 'RO', 'SWE': 'SE',
      'SVN': 'SI', 'SVK': 'SK', 'GBR': 'UK'
    };
    
    if (iso3ToIso2[countryCode]) {
      foundFlag = countryFlags.find(flag => flag.code === iso3ToIso2[countryCode]);
    }
  }
  
  // 3. Si sigue sin encontrarse, buscar por código ISO2 directo
  if (!foundFlag && countryCode.length === 2) {
    foundFlag = countryFlags.find(flag => flag.code === countryCode);
  }
  
  // 4. Si nada funciona, verificar casos especiales
  if (!foundFlag) {
    if (countryCode === 'EU27_2020') {
      // Bandera de la UE - usar la misma URL que en EuropeanRDMap
      return "https://flagcdn.com/eu.svg";
    } else if (countryCode === 'EA19' || countryCode === 'EA20') {
      // Bandera del Euro - usar la misma URL que en EuropeanRDMap
      return "https://flagcdn.com/eu.svg";
    }
  }
  
  // Si se encontró la bandera, devolver la URL
  if (foundFlag?.flag) {
    return foundFlag.flag;
  }
  
  // Si no se encontró ninguna bandera, devolver un placeholder
  return '/data/flags/placeholder.svg';
}

const ResearcherRankingChart: React.FC<ResearcherRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total'
}) => {
  const chartRef = useRef(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de países por investigadores",
      axisLabel: "Investigadores (ETC)",
      noData: "No hay datos disponibles para este año",
      researchers: "Investigadores",
      countryRanking: "Ranking de países",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Sector gubernamental", 
      sector_education: "Sector educativo superior",
      sector_nonprofit: "Sector privado sin ánimo de lucro",
      fte: "ETC (Equivalente Tiempo Completo)"
    },
    en: {
      title: "Country Ranking by Researchers",
      axisLabel: "Researchers (FTE)", 
      noData: "No data available for this year",
      researchers: "Researchers",
      countryRanking: "Country Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector",
      fte: "FTE (Full-Time Equivalent)"
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
  const sectorCode = sectorCodeMapping[selectedSector] || 'TOTAL';

  // Procesar y filtrar datos para el año y sector seleccionado
  const countryDataForYear = data.filter(item => 
    parseInt(item.TIME_PERIOD) === selectedYear &&
    item.sectperf === sectorCode
  );
  
  console.log(`Datos para año ${selectedYear} y sector ${sectorCode}:`, countryDataForYear.length, "registros");

  // Verificar si es una entidad supranacional
  const isSupranationalEntity = (code: string): boolean => {
    return code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
  };

  // Verificar si es España
  const isSpain = (code: string): boolean => {
    return code === 'ES';
  };
  
  // Agrupar los datos por país para visualización
  const prepareChartData = (): ChartDataResult => {
    if (countryDataForYear.length === 0) {
      return { labels: [], datasets: [], sortedItems: [] };
    }

    // Mapear códigos de país a nombres completos
    const countryMap = new Map<string, {
      code: string,
      value: number,
      flag?: string,
      isSupranational: boolean,
      isSpain: boolean,
      obsFlag?: string,
      isAverage?: boolean,
      numCountries?: number
    }>();

    // Lista de códigos de países europeos
    const europeanCountryCodes = [
      'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
      'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
      'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'GB', 'CH', 
      'NO', 'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 
      'XK', 'RU', 'EU27_2020', 'EA19', 'EA20',
      // Incluir también los códigos ISO3
      'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'GRC', 'ESP',
      'FIN', 'FRA', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT',
      'NLD', 'POL', 'PRT', 'ROU', 'SWE', 'SVN', 'SVK', 'GBR', 'CHE', 'NOR',
      'ISL', 'TUR', 'MNE', 'MKD', 'ALB', 'SRB', 'BIH', 'MDA', 'UKR', 'RUS'
    ];

    // Procesar los datos para el gráfico
    countryDataForYear.forEach(item => {
      const countryCode = item.geo;
      
      // Verificar si el país es europeo
      if (!europeanCountryCodes.includes(countryCode)) {
        return; // Saltamos países no europeos
      }
      
      // Convertir el valor a número
      let value = parseFloat(item.OBS_VALUE || '0');
      if (isNaN(value)) return;
      
      // Calcular promedios para entidades supranacionales
      let isAverage = false;
      let numCountries = 0;
      
      if (countryCode === 'EU27_2020') {
        // Promedio para Unión Europea (27 países)
        value = Math.round(value / 27);
        isAverage = true;
        numCountries = 27;
      } else if (countryCode === 'EA19') {
        // Promedio para Zona Euro 2015-2022 (19 países)
        value = Math.round(value / 19);
        isAverage = true;
        numCountries = 19;
      } else if (countryCode === 'EA20') {
        // Promedio para Zona Euro desde 2023 (20 países)
        value = Math.round(value / 20);
        isAverage = true;
        numCountries = 20;
      }
      
      // Obtener la bandera del país
      const countryFlag = countryFlags.find(flag => flag.iso3 === countryCode);

      countryMap.set(countryCode, {
        code: countryCode,
        value: value,
        flag: countryFlag?.flag,
        isSupranational: isSupranationalEntity(countryCode),
        isSpain: isSpain(countryCode),
        obsFlag: item.OBS_FLAG,
        isAverage: isAverage,
        numCountries: numCountries
      });
    });

    // Convertir el mapa a un array y ordenar por valor (mayor a menor)
    let sortedData = Array.from(countryMap.values())
      .sort((a, b) => b.value - a.value);

    // Limitar a un máximo de 25 entidades en total (sean países o entidades supranacionales)
    sortedData = sortedData.slice(0, 25);
    
    // Extraer datos para el gráfico
    const labels = sortedData.map(item => {
      // Mapear códigos a nombres de países
      const countryName = getCountryNameFromCode(item.code, language);
      
      // Devolver el nombre sin añadir asterisco
      return countryName;
    });
    
    const values = sortedData.map(item => item.value);
    
    // Determinar colores
    const backgroundColors = sortedData.map(item => {
      if (item.isSupranational) {
        if (item.code === 'EU27_2020') return CHART_PALETTE.YELLOW;
        if (item.code.startsWith('EA')) return CHART_PALETTE.GREEN;
      }
      
      if (item.isSpain) return CHART_PALETTE.HIGHLIGHT;
      return getSectorColor();
    });

    // Preparar dataset para Chart.js
    return {
      labels: labels,
      datasets: [
        {
          label: t.researchers,
          data: values,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color + '80'),
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.85
        }
      ],
      sortedItems: sortedData
    };
  };

  // Opciones para el gráfico
  const chartOptions: ChartOptions<'bar'> = {
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
        enabled: false,
        external: (context) => {
          const tooltip = context.tooltip;
          if (!tooltip.opacity) {
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
            return;
          }

          const index = tooltip.dataPoints[0].dataIndex;
          // Usar los datos ordenados almacenados en chartData
          const chartItem = chartData.sortedItems[index];
          if (!chartItem) return;
          
          const country = chartItem.code;
          const value = chartItem.value;
          const flagCode = chartItem.obsFlag;
          const isAverage = chartItem.isAverage;
          const numCountries = chartItem.numCountries;
          const rank = index + 1; // El índice ya indica la posición en el ranking
          
          if (tooltipRef.current) {
            // Obtener la URL de la bandera usando la nueva función
            const flagUrl = getCountryFlagUrl(country);
            
            let flagElement = '';
            if (flagUrl) {
              flagElement = `<div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                <img src="${flagUrl}" alt="${country}" class="w-full h-full object-cover" />
              </div>`;
            }
            
            const countryName = getCountryNameFromCode(country, language);
            
            // Preparar etiqueta OBS_FLAG
            let obsTagHtml = '';
            if (flagCode) {
              obsTagHtml = `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${flagCode}</span>`;
            }
            
            // Preparar comparación YoY (año anterior) si tuviéramos los datos
            // (Esto se dejaría para una implementación futura)
            const yoyComparisonHtml = getYoyComparison(country, value);
            
            // Preparar nota sobre promedio si aplica
            let averageNote = '';
            if (isAverage && numCountries) {
              averageNote = `
                <div class="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded">
                  <span class="font-medium">${language === 'es' ? 'Promedio' : 'Average'}</span>: 
                  ${language === 'es' 
                    ? `Valor calculado dividiendo el total por ${numCountries} países` 
                    : `Value calculated by dividing the total by ${numCountries} countries`}
                </div>
              `;
            }
            
            // Preparar comparaciones con UE y España
            // Calculamos valores de la UE y España para comparar
            const euItem = chartData.sortedItems.find(item => item.code === 'EU27_2020');
            const spainItem = chartData.sortedItems.find(item => item.code === 'ES');
            let comparisonsHtml = '';
            
            // Comparativa con la UE (media)
            if (euItem && !chartItem.isSupranational) {
              const euValue = euItem.isAverage ? euItem.value : (euItem.value / 27);
              const difference = value - euValue;
              const percentDiff = (difference / euValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              
              comparisonsHtml += `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs Media UE (${formatValue(euValue)}):` : 
                    `vs Avg UE (${formatValue(euValue)}):`}</span>
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
                    `vs España (${formatValue(spainItem.value)}):` : 
                    `vs Spain (${formatValue(spainItem.value)}):`}</span>
                  <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            }
            
            // Descripción de flag si existe
            let flagDescription = '';
            if (flagCode && labelDescriptions[flagCode]?.[language]) {
              flagDescription = labelDescriptions[flagCode][language];
            }
            
            // Construir el tooltip usando el mismo formato que en ResearchersEuropeanMap.tsx
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = (tooltip.caretX + 15) + 'px';
            tooltipRef.current.style.top = (tooltip.caretY - 10) + 'px';
            tooltipRef.current.style.transform = 'none';
            tooltipRef.current.style.padding = '0';
            tooltipRef.current.style.borderRadius = '8px';
            tooltipRef.current.style.backgroundColor = '#fff';
            tooltipRef.current.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.15)';
            tooltipRef.current.style.border = '1px solid rgba(0, 0, 0, 0.1)';
            tooltipRef.current.style.color = '#333';
            tooltipRef.current.style.fontSize = '13px';
            tooltipRef.current.style.pointerEvents = 'none';
            tooltipRef.current.style.zIndex = '9999';
            tooltipRef.current.style.width = 'auto';
            tooltipRef.current.style.maxWidth = '350px';
            
            tooltipRef.current.innerHTML = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <!-- Header con el nombre del país -->
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  ${flagElement}
                  <h3 class="text-lg font-bold text-gray-800">${countryName}</h3>
                </div>
                
                <!-- Resto del tooltip igual que antes -->
                <div class="p-4">
                  <!-- Métrica principal -->
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>${t.researchers}:</span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">
                        ${formatValue(value)}
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
            
            // Ajustar posición para que no se salga de la pantalla
            const tooltipElement = tooltipRef.current;
            const tooltipRect = tooltipElement.getBoundingClientRect();
            // Acceso seguro a la referencia del gráfico
            const chartElement = chartRef.current as unknown as { canvas?: HTMLCanvasElement } | null;
            const chartRect = chartElement?.canvas?.getBoundingClientRect() || { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
            
            // Ajuste horizontal
            if (parseFloat(tooltipElement.style.left) + tooltipRect.width > chartRect.right) {
              tooltipElement.style.left = `${chartRect.right - tooltipRect.width - 10}px`;
            }
            
            // Ajuste vertical
            if (parseFloat(tooltipElement.style.top) + tooltipRect.height > chartRect.bottom) {
              tooltipElement.style.top = `${chartRect.bottom - tooltipRect.height - 10}px`;
            }
          }
        }
      }
    }
  };

  // Formatear valores numéricos con separador de miles
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('es-ES').format(value);
  };

  // Obtener el nombre del país a partir del código
  const getCountryNameFromCode = (code: string, language: 'es' | 'en'): string => {
    // Mapeo completo de códigos de país a nombres en español e inglés
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
      'GB': {es: 'Reino Unido', en: 'United Kingdom'},
      'EU27_2020': {es: 'Unión Europea', en: 'European Union'},
      'EA19': {es: 'Zona Euro (2015-2022)', en: 'Euro Area (2015-2022)'},
      'EA20': {es: 'Zona Euro (Desde 2023)', en: 'Euro Area (From 2023)'},
      'NO': {es: 'Noruega', en: 'Norway'},
      'CH': {es: 'Suiza', en: 'Switzerland'},
      'IS': {es: 'Islandia', en: 'Iceland'},
      'TR': {es: 'Turquía', en: 'Turkey'},
      'ME': {es: 'Montenegro', en: 'Montenegro'},
      'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
      'AL': {es: 'Albania', en: 'Albania'},
      'RS': {es: 'Serbia', en: 'Serbia'},
      'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
      'MD': {es: 'Moldavia', en: 'Moldova'},
      'UA': {es: 'Ucrania', en: 'Ukraine'},
      'XK': {es: 'Kosovo', en: 'Kosovo'},
      'RU': {es: 'Rusia', en: 'Russia'},
      'JP': {es: 'Japón', en: 'Japan'},
      'US': {es: 'Estados Unidos', en: 'United States'},
      'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'},
      'KR': {es: 'Corea del Sur', en: 'South Korea'},
      // Añadir mapeos de códigos ISO3 a nombres
      'AUT': {es: 'Austria', en: 'Austria'},
      'BEL': {es: 'Bélgica', en: 'Belgium'},
      'BGR': {es: 'Bulgaria', en: 'Bulgaria'},
      'CYP': {es: 'Chipre', en: 'Cyprus'},
      'CZE': {es: 'República Checa', en: 'Czech Republic'},
      'DEU': {es: 'Alemania', en: 'Germany'},
      'DNK': {es: 'Dinamarca', en: 'Denmark'},
      'EST': {es: 'Estonia', en: 'Estonia'},
      'GRC': {es: 'Grecia', en: 'Greece'},
      'ESP': {es: 'España', en: 'Spain'},
      'FIN': {es: 'Finlandia', en: 'Finland'},
      'FRA': {es: 'Francia', en: 'France'},
      'HRV': {es: 'Croacia', en: 'Croatia'},
      'HUN': {es: 'Hungría', en: 'Hungary'},
      'IRL': {es: 'Irlanda', en: 'Ireland'},
      'ITA': {es: 'Italia', en: 'Italy'},
      'LTU': {es: 'Lituania', en: 'Lithuania'},
      'LUX': {es: 'Luxemburgo', en: 'Luxembourg'},
      'LVA': {es: 'Letonia', en: 'Latvia'},
      'MLT': {es: 'Malta', en: 'Malta'},
      'NLD': {es: 'Países Bajos', en: 'Netherlands'},
      'POL': {es: 'Polonia', en: 'Poland'},
      'PRT': {es: 'Portugal', en: 'Portugal'},
      'ROU': {es: 'Rumanía', en: 'Romania'},
      'SWE': {es: 'Suecia', en: 'Sweden'},
      'SVN': {es: 'Eslovenia', en: 'Slovenia'},
      'SVK': {es: 'Eslovaquia', en: 'Slovakia'},
      'GBR': {es: 'Reino Unido', en: 'United Kingdom'},
      'CHE': {es: 'Suiza', en: 'Switzerland'},
      'NOR': {es: 'Noruega', en: 'Norway'},
      'ISL': {es: 'Islandia', en: 'Iceland'},
      'TUR': {es: 'Turquía', en: 'Turkey'},
      'MNE': {es: 'Montenegro', en: 'Montenegro'},
      'MKD': {es: 'Macedonia del Norte', en: 'North Macedonia'},
      'ALB': {es: 'Albania', en: 'Albania'},
      'SRB': {es: 'Serbia', en: 'Serbia'},
      'BIH': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
      'MDA': {es: 'Moldavia', en: 'Moldova'},
      'UKR': {es: 'Ucrania', en: 'Ukraine'},
      'XKX': {es: 'Kosovo', en: 'Kosovo'},
      'RUS': {es: 'Rusia', en: 'Russia'},
      'JPN': {es: 'Japón', en: 'Japan'},
      'USA': {es: 'Estados Unidos', en: 'United States'},
      'KOR': {es: 'Corea del Sur', en: 'South Korea'},
      'GR': {es: 'Grecia', en: 'Greece'},
      'BY': {es: 'Bielorrusia', en: 'Belarus'},
      'BLR': {es: 'Bielorrusia', en: 'Belarus'},
      'VA': {es: 'Ciudad del Vaticano', en: 'Vatican City'},
      'VAT': {es: 'Ciudad del Vaticano', en: 'Vatican City'},
      'KOS': {es: 'Kosovo', en: 'Kosovo'},
      'MCO': {es: 'Mónaco', en: 'Monaco'},
      'SMR': {es: 'San Marino', en: 'San Marino'},
      'AND': {es: 'Andorra', en: 'Andorra'},
      'LIE': {es: 'Liechtenstein', en: 'Liechtenstein'}
    };
    
    // Usar el mapeo especial si existe
    if (code in countryCodeMapping) {
      return countryCodeMapping[code][language];
    }
    
    // Mapeo adicional para códigos ISO3
    const iso3ToIso2Map: Record<string, string> = {
      'AUT': 'AT',
      'BEL': 'BE',
      'BGR': 'BG',
      'CYP': 'CY',
      'CZE': 'CZ',
      'DEU': 'DE',
      'DNK': 'DK',
      'EST': 'EE',
      'GRC': 'EL',
      'ESP': 'ES',
      'FIN': 'FI',
      'FRA': 'FR',
      'HRV': 'HR',
      'HUN': 'HU',
      'IRL': 'IE',
      'ITA': 'IT',
      'LTU': 'LT',
      'LUX': 'LU',
      'LVA': 'LV',
      'MLT': 'MT',
      'NLD': 'NL',
      'POL': 'PL',
      'PRT': 'PT',
      'ROU': 'RO',
      'SWE': 'SE',
      'SVN': 'SI',
      'SVK': 'SK',
      'GBR': 'UK',
      'NOR': 'NO',
      'CHE': 'CH',
      'ISL': 'IS',
      'TUR': 'TR',
      'MNE': 'ME',
      'MKD': 'MK',
      'ALB': 'AL',
      'SRB': 'RS',
      'BIH': 'BA',
      'MDA': 'MD',
      'UKR': 'UA',
      'RUS': 'RU',
      'JPN': 'JP',
      'USA': 'US',
      'KOR': 'KR',
      'BLR': 'BY',
      'VAT': 'VA',
      'XKX': 'XK'
    };
    
    // Verificar si es un código ISO3 y convertirlo a ISO2
    if (code.length === 3 && iso3ToIso2Map[code]) {
      const iso2Code = iso3ToIso2Map[code];
      if (iso2Code in countryCodeMapping) {
        return countryCodeMapping[iso2Code][language];
      }
    }
    
    // Buscar en la lista de banderas
    const countryFlag = countryFlags.find(flag => flag.iso3 === code || flag.code === code);
    if (countryFlag) {
      // Si estamos en inglés, usamos el nombre del país directamente
      if (language === 'en') {
        return countryFlag.country;
      }
      
      // Para español, intentamos encontrar una traducción
      // Primero verificamos si podemos encontrar un mapeo por el código ISO2
      if (countryFlag.code && countryCodeMapping[countryFlag.code]) {
        return countryCodeMapping[countryFlag.code].es;
      }
      
      // Si no hay mapeo, usamos el nombre en el archivo de banderas
      return countryFlag.country;
    }
    
    // Fallback al código si no se encuentra
    return code;
  };

  // Obtener color del sector
  const getSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a ids
    if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') 
      normalizedId = 'total';
    if (normalizedId === 'business enterprise sector' || normalizedId === 'bes') 
      normalizedId = 'business';
    if (normalizedId === 'government sector' || normalizedId === 'gov') 
      normalizedId = 'government';
    if (normalizedId === 'higher education sector' || normalizedId === 'hes') 
      normalizedId = 'education';
    if (normalizedId === 'private non-profit sector' || normalizedId === 'pnp') 
      normalizedId = 'nonprofit';
    
    // Obtener color del sector usando los nuevos colores de investigadores
    return RESEARCHER_SECTOR_COLORS[normalizedId as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
  };

  // Obtener título del gráfico
  const getChartTitle = () => {
    let sectorText = t.allSectors;
    
    switch(selectedSector) {
      case 'business':
        sectorText = t.sector_business;
        break;
      case 'government':
        sectorText = t.sector_government;
        break;
      case 'education':
        sectorText = t.sector_education;
        break;
      case 'nonprofit':
        sectorText = t.sector_nonprofit;
        break;
    }
    
    return `${t.title}: ${sectorText} (${selectedYear})`;
  };

  // Función para obtener el color del sector para el título
  const getSectorTitleColor = () => {
    // Obtener el color base del sector usando los nuevos colores de investigadores
    const sectorColor = RESEARCHER_SECTOR_COLORS[selectedSector as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Preparar datos para el gráfico
  const chartData: ChartDataResult = prepareChartData();
  
  // Altura dinámica para el gráfico en función del número de países
  const chartHeight = Math.max(400, chartData.labels.length * 25);

  // Determinar si hay datos para mostrar
  const hasData = countryDataForYear.length > 0;
  
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

  // Añadir YoY comparison por país
  // Para poder añadir la funcionalidad YoY, debemos añadir una función que busque los datos del año anterior
  // Esto se podría implementar como una función que busque en el dataset el mismo país pero del año anterior
  const getYoyComparison = (country: string, value: number): string => {
    // Buscar en chartData.sortedItems si hay datos de años anteriores
    // Como enfoque simplificado, podríamos verificar si tenemos datos adicionales en las propiedades
    const yearValue = selectedYear - 1;
    const previousYearData = data.filter(item => {
      const isCountry = item.geo === country;
      const isLastYear = parseInt(item.TIME_PERIOD) === yearValue;
      
      // Normalizar el sector para manejar diferentes valores
      let sectorMatch = false;
      if (selectedSector === 'total') {
        sectorMatch = item.sectperf === 'TOTAL';
      } else if (selectedSector === 'business') {
        sectorMatch = item.sectperf === 'BES';
      } else if (selectedSector === 'government') {
        sectorMatch = item.sectperf === 'GOV';
      } else if (selectedSector === 'education') {
        sectorMatch = item.sectperf === 'HES';
      } else if (selectedSector === 'nonprofit') {
        sectorMatch = item.sectperf === 'PNP';
      }
      
      return isCountry && isLastYear && sectorMatch;
    });
    
    // Si encontramos datos del año anterior
    if (previousYearData.length > 0 && previousYearData[0].OBS_VALUE) {
      const prevValue = parseFloat(previousYearData[0].OBS_VALUE);
      if (!isNaN(prevValue) && prevValue > 0) {
        const difference = value - prevValue;
        const percentDiff = (difference / prevValue) * 100;
        const formattedDiff = percentDiff.toFixed(1);
        const isPositive = difference > 0;
        
        return `
          <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
            </svg>
            <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${yearValue}</span>
          </div>
        `;
      }
    }
    
    return '';
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getChartTitle()}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorTitleColor())?.copy({ opacity: 0.15 })}` }}>
          {(() => {
            // Obtener el nombre exacto del sector desde los datos de rdSectors
            const sectorMapping: Record<string, string> = {
              'total': 'All Sectors',
              'business': 'Business enterprise sector',
              'government': 'Government sector',
              'education': 'Higher education sector',
              'nonprofit': 'Private non-profit sector'
            };
            
            // Obtener el nombre del sector en inglés primero
            const sectorNameEn = sectorMapping[selectedSector] || 'All Sectors';
            
            // Obtener el nombre en el idioma actual
            if (language === 'es') {
              switch (sectorNameEn) {
                case 'All Sectors':
                  return 'Todos los sectores';
                case 'Business enterprise sector':
                  return 'Sector empresarial';
                case 'Government sector':
                  return 'Sector gubernamental';
                case 'Higher education sector':
                  return 'Enseñanza Superior';
                case 'Private non-profit sector':
                  return 'Instituciones privadas sin fines de lucro';
                default:
                  return sectorNameEn;
              }
            } else {
              return sectorNameEn;
            }
          })()}
        </div>
      </div>
      
      {hasData ? (
        <>
          <div className="custom-scrollbar" style={scrollContainerStyle} onMouseLeave={() => {
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
          }}>
            <div className="w-full" style={{ minHeight: `${chartHeight}px` }}>
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>
          
          {/* Etiqueta del eje X centrada */}
          <div className="text-center mt-2 mb-2 text-sm font-medium text-gray-700">
            {t.axisLabel}
          </div>
          
          {/* Tooltip personalizado */}
          <div 
            ref={tooltipRef} 
            className="absolute hidden pointer-events-none" 
            style={{ maxWidth: '220px', width: 'auto' }}
          />
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

export default ResearcherRankingChart; 