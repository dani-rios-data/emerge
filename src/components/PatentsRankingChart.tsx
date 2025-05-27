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
  ChartEvent,
  ActiveElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import countryFlagsData from '../logos/country_flags.json';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';

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

// Mapeo de códigos de país a nombres en español e inglés
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
  'TR': {es: 'Turquía', en: 'Turkey'}
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
  selectedSector = 'All sectors'
}) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Crear tooltip global personalizado
  const createGlobalTooltip = (): HTMLElement => {
    let tooltip = document.getElementById('global-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'global-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 1000;
        max-width: 300px;
        line-height: 1.4;
        opacity: 0;
        transition: opacity 0.2s ease;
        visibility: hidden;
      `;
      document.body.appendChild(tooltip);
    }
    return tooltip;
  };

  // Posicionar tooltip global
  const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
    const tooltip = createGlobalTooltip();
    tooltip.innerHTML = content;
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    // Calcular posición
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.pageX + 15;
    let top = event.pageY - 10;
    
    // Ajustar si se sale del viewport
    if (left + rect.width > viewportWidth - 20) {
      left = event.pageX - rect.width - 15;
    }
    
    if (top + rect.height > viewportHeight - 20) {
      top = event.pageY - rect.height - 10;
    }
    
    // Asegurar que no se salga por los bordes
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  // Ocultar tooltip global
  const hideGlobalTooltip = (immediately: boolean = false): void => {
    const tooltip = document.getElementById('global-tooltip');
    if (tooltip) {
      if (immediately) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      } else {
        setTimeout(() => {
          tooltip.style.visibility = 'hidden';
          tooltip.style.opacity = '0';
        }, 100);
      }
    }
  };

  // Configurar eventos globales
  useEffect(() => {
    const handleScroll = () => {
      hideGlobalTooltip(true);
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('canvas')) {
        hideGlobalTooltip(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hideGlobalTooltip(true);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      hideGlobalTooltip(true);
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

  // Preparar datos del gráfico
  const prepareChartData = (): ChartDataResult => {
    // Filtrar y procesar datos
    const filteredData = data.filter(item => 
      parseInt(item.TIME_PERIOD) === selectedYear &&
      item.sectperf === selectedSector &&
      item.OBS_VALUE && 
      item.OBS_VALUE !== ':' &&
      (EUROPEAN_COUNTRY_CODES.includes(item.geo) || isSupranationalEntity(item.geo))
    );

    // Crear elementos del gráfico
    const chartItems: ChartDataItem[] = filteredData.map(item => ({
      code: item.geo,
      value: parseFloat(item.OBS_VALUE),
      isSupranational: isSupranationalEntity(item.geo),
      isSpain: isSpain(item.geo),
      obsFlag: item.OBS_FLAG
    }));

    // Ordenar por valor descendente y limitar a 25
    const sortedItems = chartItems
      .filter(item => !isNaN(item.value) && item.value >= 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);

    // Preparar datos para Chart.js
    const labels = sortedItems.map(item => getCountryNameFromCode(item.code, language));
    const values = sortedItems.map(item => item.value);
    
    // Colores basados en el tipo de entidad
    const backgroundColor = sortedItems.map(item => {
      if (item.isSpain) return '#dc2626'; // Rojo para España
      if (item.isSupranational) return '#fbbf24'; // Amarillo para UE/EA
      return '#10b981'; // Verde para otros países
    });

    const borderColor = backgroundColor.map(color => color);

    return {
      labels,
      datasets: [{
        label: language === 'es' ? 'Investigadores' : 'Researchers',
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9
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

  // Obtener nombre del país desde código
  const getCountryNameFromCode = (code: string, language: 'es' | 'en'): string => {
    const mapping = countryCodeMapping[code];
    if (mapping) {
      return mapping[language];
    }
    
    // Fallback: devolver el código si no se encuentra el mapeo
    return code;
  };

  // Obtener valor del año anterior para comparación
  const getYoyComparison = (country: string, value: number): string => {
    const previousYear = selectedYear - 1;
    const previousRecord = data.find(item => 
      item.geo === country && 
      parseInt(item.TIME_PERIOD) === previousYear &&
      item.sectperf === selectedSector
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

  const chartData = prepareChartData();

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
          lineWidth: 1
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value) {
            return formatValue(Number(value));
          }
        }
      },
      y: {
        grid: {
          display: false
        },
                   ticks: {
             color: '#374151',
             font: {
               size: 11,
               weight: 'bold'
             },
          maxRotation: 0,
          callback: function(value, index) {
            const item = chartData.sortedItems[index];
            if (item) {
              const flagUrl = getCountryFlagUrl(item.code);
              return `${flagUrl} ${this.getLabelForValue(value as number)}`;
            }
            return this.getLabelForValue(value as number);
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false, // Deshabilitamos el tooltip por defecto
        external: function(context) {
          const { chart, tooltip } = context;
          
          if (tooltip.opacity === 0) {
            hideGlobalTooltip();
            return;
          }

          const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
          if (dataIndex !== undefined) {
            const item = chartData.sortedItems[dataIndex];
            if (item) {
              const countryName = getCountryNameFromCode(item.code, language);
              const flagUrl = getCountryFlagUrl(item.code);
              const formattedValue = formatValue(item.value);
              const yoyChange = getYoyComparison(item.code, item.value);
              const rank = dataIndex + 1;
              const total = Math.min(chartData.sortedItems.length, 25);

              let tooltipContent = `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <img src="${flagUrl}" alt="${countryName}" style="width: 24px; height: 16px; margin-right: 8px; border: 1px solid #ccc;" onerror="this.style.display='none'">
                  <strong style="font-size: 14px;">${countryName}</strong>
                </div>
                <div style="margin-bottom: 6px;">
                  <span style="color: #ffd700;">📊 ${formattedValue}</span> ${language === 'es' ? 'investigadores' : 'researchers'}
                </div>
                <div style="margin-bottom: 6px; color: #87ceeb;">
                  🏆 ${language === 'es' ? 'Ranking' : 'Rank'}: ${rank} ${language === 'es' ? 'de' : 'of'} ${total}
                </div>
              `;

              if (yoyChange !== (language === 'es' ? 'N/D' : 'N/A')) {
                const changeColor = yoyChange.startsWith('+') ? '#90EE90' : '#FFB6C1';
                tooltipContent += `
                  <div style="color: ${changeColor};">
                    📈 ${language === 'es' ? 'Cambio anual' : 'YoY change'}: ${yoyChange}
                  </div>
                `;
              }

              if (item.obsFlag) {
                tooltipContent += `
                  <div style="color: #ffa500; font-size: 12px; margin-top: 4px;">
                    ⚠️ ${item.obsFlag}
                  </div>
                `;
              }

              // Usar la posición del mouse desde el evento nativo
              const canvasElement = chart.canvas;
              const rect = canvasElement.getBoundingClientRect();
              const mouseEvent = new MouseEvent('mousemove', {
                clientX: rect.left + tooltip.caretX,
                clientY: rect.top + tooltip.caretY
              });

              positionGlobalTooltip(mouseEvent, tooltipContent);
            }
          }
        }
      }
    },
    onHover: (event: ChartEvent, activeElements: ActiveElement[]) => {
      const canvas = event.native?.target as HTMLCanvasElement;
      if (canvas) {
        canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    }
  };

  return (
    <div className="w-full h-full">
      <div className="h-[600px] relative">
        <Bar 
          ref={chartRef}
          data={chartData} 
          options={options}
        />
      </div>
    </div>
  );
};

export default PatentsRankingChart; 