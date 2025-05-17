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
import { EU_COLORS, SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
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
  const prepareChartData = () => {
    if (countryDataForYear.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Mapear códigos de país a nombres completos
    const countryMap = new Map<string, {
      code: string,
      value: number,
      flag?: string,
      isSupranational: boolean,
      isSpain: boolean,
      obsFlag?: string
    }>();

    // Procesar los datos para el gráfico
    countryDataForYear.forEach(item => {
      const countryCode = item.geo;
      
      // Convertir el valor a número
      const value = parseFloat(item.OBS_VALUE || '0');
      if (isNaN(value)) return;
      
      // Obtener la bandera del país
      const countryFlag = countryFlags.find(flag => flag.iso3 === countryCode);

      countryMap.set(countryCode, {
        code: countryCode,
        value: value,
        flag: countryFlag?.flag,
        isSupranational: isSupranationalEntity(countryCode),
        isSpain: isSpain(countryCode),
        obsFlag: item.OBS_FLAG
      });
    });

    // Convertir el mapa a un array y ordenar por valor (mayor a menor)
    let sortedData = Array.from(countryMap.values())
      .sort((a, b) => b.value - a.value);

    // Limitar a los 20 principales países (excluyendo entidades supranacionales)
    const topCountries = sortedData
      .filter(item => !item.isSupranational)
      .slice(0, 20);
    
    // Añadir entidades supranacionales al principio
    const supranationalEntities = sortedData.filter(item => item.isSupranational);
    sortedData = [...supranationalEntities, ...topCountries];
    
    // Extraer datos para el gráfico
    const labels = sortedData.map(item => {
      // Mapear códigos a nombres de países
      const countryName = getCountryNameFromCode(item.code, language);
      
      // Añadir asterisco si hay flag de observación
      return item.obsFlag ? `${countryName} *` : countryName;
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
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          barThickness: 24,
          borderRadius: 4
        }
      ]
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
        right: 25,
        bottom: 10,
        left: 10
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: t.axisLabel,
          color: '#666',
          font: {
            size: 12,
            weight: 'normal'
          },
          padding: { top: 10, bottom: 0 }
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#333',
          font: {
            size: 11,
            weight: 'normal'
          }
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
          const country = countryDataForYear[index]?.geo || '';
          const value = parseFloat(countryDataForYear[index]?.OBS_VALUE || '0');
          const flagCode = countryDataForYear[index]?.OBS_FLAG;
          
          if (tooltipRef.current) {
            let flagElement = '';
            const countryFlag = countryFlags.find(flag => flag.iso3 === country);
            if (countryFlag?.flag) {
              flagElement = `<img src="${countryFlag.flag}" alt="${country}" class="w-6 h-4 mr-2 object-cover border border-gray-200" />`;
            }
            
            const countryName = getCountryNameFromCode(country, language);
            let flagDescription = '';
            if (flagCode) {
              const description = labelDescriptions[flagCode]?.[language] || '';
              flagDescription = description ? `<div class="text-xs text-gray-500 mt-1">(${description})</div>` : '';
            }
            
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = tooltip.caretX + 'px';
            tooltipRef.current.style.top = tooltip.caretY + 'px';
            tooltipRef.current.style.padding = '8px 12px';
            tooltipRef.current.style.borderRadius = '4px';
            tooltipRef.current.style.backgroundColor = '#fff';
            tooltipRef.current.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
            tooltipRef.current.style.border = '1px solid rgba(0, 0, 0, 0.1)';
            tooltipRef.current.style.color = '#333';
            tooltipRef.current.style.fontSize = '13px';
            tooltipRef.current.style.pointerEvents = 'none';
            tooltipRef.current.style.zIndex = '9999';
            tooltipRef.current.style.transformOrigin = 'center';
            tooltipRef.current.style.transform = 'translate(-50%, -100%) translateY(-8px)';
            
            tooltipRef.current.innerHTML = `
              <div class="flex items-center">
                ${flagElement}
                <span class="font-semibold">${countryName}</span>
              </div>
              <div class="flex items-baseline mt-1">
                <span class="font-medium">
                  ${formatValue(value)}
                </span>
                <span class="text-xs ml-1 text-gray-600">${t.fte}</span>
              </div>
              ${flagDescription}
            `;
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
    // Mapeo especial para entidades supranacionales y nombres de países
    const specialNames: Record<string, {es: string, en: string}> = {
      'EU27_2020': {
        es: 'Unión Europea (27)',
        en: 'European Union (27)'
      },
      'EA19': {
        es: 'Zona Euro (19)',
        en: 'Euro Area (19)'
      },
      'EA20': {
        es: 'Zona Euro (20)',
        en: 'Euro Area (20)'
      },
      'ES': {
        es: 'España',
        en: 'Spain'
      },
      'DE': {
        es: 'Alemania',
        en: 'Germany'
      },
      'FR': {
        es: 'Francia',
        en: 'France'
      },
      'IT': {
        es: 'Italia',
        en: 'Italy'
      },
      'UK': {
        es: 'Reino Unido',
        en: 'United Kingdom'
      },
      'GB': {
        es: 'Reino Unido',
        en: 'United Kingdom'
      },
      'CN_X_HK': {
        es: 'China (exc. Hong Kong)',
        en: 'China (exc. Hong Kong)'
      }
    };
    
    // Usar el mapeo especial si existe
    if (code in specialNames) {
      return specialNames[code][language];
    }
    
    // Buscar en la lista de banderas
    const countryFlag = countryFlags.find(flag => flag.iso3 === code);
    if (countryFlag) {
      // Usar el nombre del país según el idioma
      return language === 'es' ? countryFlag.country : countryFlag.country;
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
    
    // Obtener color del sector
    return SECTOR_COLORS[normalizedId as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
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
    // Obtener el color base del sector
    const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Determinar si hay datos para mostrar
  const hasData = countryDataForYear.length > 0;
  
  // Preparar datos para el gráfico
  const chartData = prepareChartData();

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
          <div className="custom-scrollbar" style={scrollContainerStyle}>
            <div className="w-full" style={{ minHeight: '450px' }}>
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
          
          {/* Leyenda de observaciones */}
          {countryDataForYear.some(item => item.OBS_FLAG) && (
            <div className="mt-3 text-xs text-gray-500 border-t border-gray-200 pt-2">
              * {language === 'es' ? 'Indicadores con observaciones especiales' : 'Indicators with special observations'}
            </div>
          )}
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