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
  ChartEvent
} from 'chart.js';
import { EuropeCSVData, rdSectors } from '../data/rdInvestment';
import { EU_COLORS, SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json en lugar del archivo eliminado country-flags.tsx
import countryFlagsData from '../logos/country_flags.json';
// Para usar las banderas SVG, debes importarlas del archivo logos/country-flags.tsx
// import { FlagSpain, FlagEU, FlagCanaryIslands, FlagSweden, FlagFinland } from '../logos/country-flags';

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

// Interfaz para los datos de etiquetas
interface LabelData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Label: string;
}

// Interfaz para los datos de comunidades autónomas
interface AutonomousCommunityData {
  "Comunidad (Original)": string;
  "Comunidad Limpio": string;
  "Comunidad en Inglés": string;
  "Año": string;
  "Sector Id": string;
  "Sector": string;
  "Gasto en I+D (Miles €)": string;
  "PIB (Miles €)": string;
  "% PIB I+D": string;
  "Sector Nombre": string;
  [key: string]: string;
}

interface CountryRankingChartProps {
  data: EuropeCSVData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
  labels?: LabelData[];
  autonomousCommunitiesData?: AutonomousCommunityData[]; // Usar el tipo específico
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

const CountryRankingChart: React.FC<CountryRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total',
  labels = [],
  autonomousCommunitiesData = [] // Añadir parámetro para datos de comunidades autónomas
}) => {
  const chartRef = useRef(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtener el nombre del sector según el idioma - versión mejorada
  const getSectorName = () => {
    // Conversión directa de ID a objeto sector
    const sector = rdSectors.find(s => s.id === selectedSector);
    if (!sector) return language === 'es' ? 'Todos los sectores' : 'All Sectors';
    return sector.name[language];
  };

  // Textos traducidos
  const texts = {
    es: {
      title: `Ranking de países por inversión en I+D - ${getSectorName()} (${selectedYear})`,
      axisLabel: "% del PIB",
      noData: "No hay datos disponibles para este año",
      rdInvestment: "Inversión I+D"
    },
    en: {
      title: `Country Ranking by R&D Investment - ${getSectorName()} (${selectedYear})`,
      axisLabel: "% of GDP",
      noData: "No data available for this year",
      rdInvestment: "R&D Investment"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y nombre en inglés para consultas
  const sectorNameMapping: Record<string, string> = {
    'total': 'All Sectors',
    'business': 'Business enterprise sector',
    'government': 'Government sector',
    'education': 'Higher education sector',
    'nonprofit': 'Private non-profit sector'
  };
  
  const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';

  // Procesar y filtrar datos para el año y sector seleccionado
  const countryDataForYear = data.filter(item => 
    parseInt(item['Year']) === selectedYear &&
    (item['Sector'] === sectorNameEn || 
     item['Sector'] === 'All Sectors' && sectorNameEn === 'All Sectors')
  );
  
  console.log(`Datos para año ${selectedYear} y sector ${sectorNameEn}:`, countryDataForYear.length, "registros");

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };
  
  // Depurar nombres de países para identificar problemas de codificación
  if (countryDataForYear.length > 0 && countryDataForYear.length < 50) {
    console.log("Nombres de países originales vs. normalizados:");
    countryDataForYear.forEach(item => {
      const original = language === 'es' ? item['País'] : item['Country'];
      const normalized = normalizeText(original);
      console.log(`  ${original} => ${normalized}`);
    });
  }

  // Agrupar por país (para evitar duplicados)
  const countryMap = new Map<string, {value: number, nameEs: string, nameEn: string}>();

  // MODIFICADO: Usar directamente las columnas 'Country' o 'País' según el idioma
  countryDataForYear.forEach(item => {
    // Guardamos ambos nombres para poder cambiar de idioma en el tooltip
    const countryNameEs = item['País'];
    const countryNameEn = item['Country'];
    const rdValue = parseFloat(item['%GDP'].replace(',', '.'));
    
    if (!isNaN(rdValue) && (countryNameEs || countryNameEn)) {
      // Aplicar alias para simplificar nombres de entidades
      let displayNameEs = countryNameEs;
      let displayNameEn = countryNameEn;
      
      // Mapeo de nombres largos a alias más cortos según el idioma
      const aliases: { [key: string]: { es: string, en: string } } = {
        'European Union - 27 countries (from 2020)': {
          en: 'European Union',
          es: 'Unión Europea'
        },
        'Euro area – 20 countries (from 2023)': {
          en: 'Euro area (from 2023)',
          es: 'Zona Euro (Desde 2023)'
        },
        'Euro area - 19 countries (2015-2022)': {
          en: 'Euro area (2015-2022)',
          es: 'Zona Euro (2015-2022)'
        },
        // Manejar variantes con espacios
        'Euro area - 19 countries  (2015-2022)': {
          en: 'Euro area (2015-2022)',
          es: 'Zona Euro (2015-2022)'
        }
      };
      
      // Aplicar el alias si existe para este país/entidad
      if (countryNameEn in aliases) {
        displayNameEs = aliases[countryNameEn].es;
        displayNameEn = aliases[countryNameEn].en;
      }
      
      // En el mapa guardamos ambos nombres y el valor
      const displayKey = language === 'es' ? displayNameEs : displayNameEn;
      if (displayKey) {
        countryMap.set(displayKey, {
          value: rdValue,
          nameEs: displayNameEs || displayNameEn, // Fallback al nombre en inglés si no hay español
          nameEn: displayNameEn || displayNameEs  // Fallback al nombre en español si no hay inglés
        });
      }
    }
  });
  
  console.log("Países procesados:", Array.from(countryMap.entries()));
  
  // Ordenar países por valor (de mayor a menor)
  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1].value - a[1].value); 
  
  // Crear datos para el gráfico
  const chartLabels = sortedCountries.map(([country]) => country);
  const values = sortedCountries.map(([, data]) => data.value);
  
  // Almacenamos los pares de nombres para usar en tooltips
  const countryNames = sortedCountries.reduce((acc, [key, data]) => {
    acc[key] = { es: data.nameEs, en: data.nameEn };
    return acc;
  }, {} as Record<string, {es: string, en: string}>);
  
  // Obtener el color del sector seleccionado
  const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
  
  // Crear colores - España en rojo, UE en amarillo, Zona Euro en verde, y el resto con el color del sector seleccionado
  const barColors = chartLabels.map(country => {
    // Normalizar el país para la comparación
    const normalizedCountry = normalizeText(country);
    
    // Verificar si es España (tanto en español como en inglés)
    if (normalizedCountry === 'espana' || normalizedCountry === 'spain') {
      return CHART_PALETTE.HIGHLIGHT; // Rojo para España
    } 
    // Verificar si es alguna entidad de la Unión Europea
    else if (normalizedCountry.includes('union europea') || normalizedCountry.includes('european union')) {
      return CHART_PALETTE.YELLOW; // Amarillo para Unión Europea
    }
    // Verificar si es alguna entidad de la Zona Euro
    else if (normalizedCountry.includes('zona euro') || normalizedCountry.includes('euro area')) {
      return CHART_PALETTE.GREEN; // Verde para Zona Euro
    }
    
    return sectorColor; // Color según el sector seleccionado para el resto de países
  });

  // Datos para el gráfico
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: values,
        backgroundColor: barColors,
        borderColor: barColors.map(color => color + '80'),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8, // Ajuste del ancho de las barras
        categoryPercentage: 0.85 // Espacio entre grupos de barras
      }
    ]
  };

  // Opciones del gráfico
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t.title,
        font: {
          size: 14,
          weight: 600,
          family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: CHART_PALETTE.TEXT,
        align: 'center'
      },
      tooltip: {
        enabled: false, // Desactivamos el tooltip nativo de Chart.js
        external: () => {
          // No hacemos nada aquí, ya que manejaremos todo con eventos
        }
      }
    },
    scales: {
      x: {
        display: false, // Oculta todo el eje X
        title: {
          display: false,
          text: t.axisLabel,
          font: {
            weight: 600,
            size: 13,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          },
          color: CHART_PALETTE.TEXT
        },
        grid: {
          display: false
        },
        border: {
          display: false // Oculta el borde del eje
        },
        ticks: {
          display: false // Oculta los valores numéricos del eje
        }
      },
      y: {
        title: {
          display: false
        },
        grid: {
          display: false // Eliminar líneas de cuadrícula
        },
        border: {
          color: CHART_PALETTE.BORDER // Borde de eje más suave
        },
        ticks: {
          color: CHART_PALETTE.TEXT, // Texto negro en vez de gris
          font: {
            size: 12,
            weight: 400,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          }
        }
      }
    },
    onHover: (event: ChartEvent & { native?: { clientX?: number; clientY?: number } }, chartElements) => {
      if (!event || !tooltipRef.current || !chartRef.current) return;
      
      const clientX = event.native?.clientX ?? 0;
      const clientY = event.native?.clientY ?? 0;
      
      if (chartElements && chartElements.length > 0) {
        const index = chartElements[0].index;
        const countryName = chartLabels[index] as string || '';
        const value = values[index] as number;
        const formattedValue = value.toFixed(2);
        
        // Calcular el ranking: posición + 1 porque los índices empiezan en 0
        const rank = index + 1;
        const totalCountries = chartLabels.length;
        
        // Mostrar el tooltip
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.opacity = '1';
        tooltipRef.current.style.left = `${clientX + 5}px`;
        tooltipRef.current.style.top = `${clientY - 40}px`;
        
        const tooltipContentElement = tooltipRef.current.querySelector('.tooltip-content');
        
        if (tooltipContentElement) {
          // Usar el nombre del país según el idioma seleccionado
          const displayName = countryNames[countryName] 
            ? (language === 'es' ? countryNames[countryName].es : countryNames[countryName].en) 
            : countryName;
            
          // Buscar etiqueta para este país y año
          let labelValue = '';
          if (labels && labels.length > 0) {
            // Buscar etiqueta para este país y sector
            const matchingLabel = labels.find(item => {
              // Normalizar nombres para comparación
              const itemCountryNormalized = normalizeText(String(item.Country || ''));
              const itemPaisNormalized = normalizeText(String(item.País || ''));
              const displayNameNormalized = normalizeText(displayName);
              
              // Verificar si coincide el país (en inglés o español)
              const countryMatches = 
                itemCountryNormalized === displayNameNormalized ||
                itemPaisNormalized === displayNameNormalized;
              
              // Verificar si coincide el año y sector
              const yearMatches = item.Year === selectedYear.toString();
              const sectorMatches = item.Sector === sectorNameEn;
              
              return countryMatches && yearMatches && sectorMatches;
            });
            
            if (matchingLabel && matchingLabel.Label) {
              labelValue = matchingLabel.Label;
            }
          }

          // Verificar si el país es la UE
          const normalizedName = normalizeText(displayName);
          const isEU = normalizedName.includes('union europea') || 
                     normalizedName.includes('european union');
          
          // Verificar si el país es España
          const isSpain = normalizedName.includes('espana') || 
                       normalizedName.includes('españa') ||
                       normalizedName.includes('spain');
                       
          // Verificar si el país es Canarias
          const isCanarias = normalizedName.includes('canarias') || 
                          normalizedName.includes('canary islands');
          
          // Preparar las comparaciones
          let euComparisonHtml = '';
          let spainComparisonHtml = '';
          let canariasComparisonHtml = '';
          
          // Comparación con UE
          if (!isEU) {
            const euValue = getEUValue(data, selectedYear, selectedSector);
            
            if (euValue !== null && euValue > 0) {
              const difference = value - euValue;
              const percentDiff = (difference / euValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              euComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs UE:' : 'vs EU:'}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (euValue !== null && euValue === 0) {
              euComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs UE:' : 'vs EU:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Comparación con España
          if (!isSpain) {
            const spainValue = getSpainValue(data, selectedYear, selectedSector);
            
            if (spainValue !== null && spainValue > 0) {
              const difference = value - spainValue;
              const percentDiff = (difference / spainValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              spainComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs España:' : 'vs Spain:'}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (spainValue !== null && spainValue === 0) {
              spainComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs España:' : 'vs Spain:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Comparación con Canarias
          if (!isCanarias) {
            const canariasValue = getCanariasValue(autonomousCommunitiesData, selectedYear, selectedSector);
            
            if (canariasValue !== null && canariasValue > 0) {
              const difference = value - canariasValue;
              const percentDiff = (difference / canariasValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              canariasComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs Canarias:' : 'vs Canary Islands:'}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (canariasValue !== null && canariasValue === 0) {
              canariasComparisonHtml = `
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">${language === 'es' ? 'vs Canarias:' : 'vs Canary Islands:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Renderizar el tooltip con el nuevo diseño
          tooltipContentElement.innerHTML = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                <!-- 
                  Para usar las banderas SVG en React, importa los componentes de banderas desde '../logos/country-flags':
                  
                  import { CountryFlags } from '../logos/country-flags';
                  
                  Y luego utilízalos como componentes React:
                  {normalizedName.includes('spain') && <CountryFlags.Spain className="w-8 h-6 mr-2" />}
                  {normalizedName.includes('sweden') && <CountryFlags.Sweden className="w-8 h-6 mr-2" />}
                  {normalizedName.includes('european union') && <CountryFlags.EU className="w-8 h-6 mr-2" />}
                  
                  Sin embargo, como estamos usando innerHTML, usaremos las URLs de flagcdn:
                -->
                <div class="flag-container w-8 h-6 mr-2 rounded overflow-hidden">
                  ${(() => {
                    const normalizedName = normalizeText(displayName);
                    
                    // Buscar código de país basado en el nombre normalizado
                    const getCountryCode = (normalizedName: string): string => {
                      // 1. Primero buscar en el dataset por ISO3
                      const countryItem = data.find(item => {
                        if (item.ISO3) {
                          // Buscar ese ISO3 en countryFlags
                          return countryFlags.some(flagItem => 
                            flagItem.iso3 === item.ISO3 && 
                            (normalizeText(item.Country).includes(normalizedName) || 
                             normalizeText(item.País || "").includes(normalizedName))
                          );
                        }
                        return false;
                      });
                      
                      if (countryItem?.ISO3) {
                        // Si encontramos un ISO3, buscar el código de 2 letras correspondiente
                        const flagItem = countryFlags.find(flag => flag.iso3 === countryItem.ISO3);
                        if (flagItem?.code) {
                          return flagItem.code.toLowerCase();
                        }
                      }
                      
                      // 2. Si no encontramos por ISO3, usar los casos específicos
                      // Casos especiales
                      if (normalizedName.includes('union europea') || normalizedName.includes('european union')) {
                        return 'eu'; // La UE tiene un código especial en flagcdn
                      } else if (normalizedName.includes('zona euro') || normalizedName.includes('euro area')) {
                        return 'eu'; // Usamos también la bandera de la UE para la zona euro
                      } else if (normalizedName.includes('espana') || normalizedName.includes('españa') || normalizedName.includes('spain')) {
                        return 'es';
                      } else if (normalizedName.includes('alemania') || normalizedName.includes('germany')) {
                        return 'de';
                      } else if (normalizedName.includes('francia') || normalizedName.includes('france')) {
                        return 'fr';
                      } else if (normalizedName.includes('reino unido') || normalizedName.includes('united kingdom') || normalizedName.includes('uk')) {
                        return 'gb';
                      } else if (normalizedName.includes('italia') || normalizedName.includes('italy')) {
                        return 'it';
                      } else if (normalizedName.includes('suecia') || normalizedName.includes('sweden')) {
                        return 'se';
                      } else if (normalizedName.includes('finlandia') || normalizedName.includes('finland')) {
                        return 'fi';
                      } else if (normalizedName.includes('canarias') || normalizedName.includes('canary islands')) {
                        return 'es-ct'; // Usamos un código regional para Canarias
                      }
                      // Nuevos casos específicos para países que no muestran correctamente su bandera
                      else if (normalizedName.includes('belgica') || normalizedName.includes('belgium')) {
                        return 'be';
                      } else if (normalizedName.includes('dinamarca') || normalizedName.includes('denmark')) {
                        return 'dk';
                      } else if (normalizedName.includes('islandia') || normalizedName.includes('iceland')) {
                        return 'is';
                      } else if (normalizedName.includes('noruega') || normalizedName.includes('norway')) {
                        return 'no';
                      } else if (normalizedName.includes('eslovenia') || normalizedName.includes('slovenia')) {
                        return 'si';
                      } else if (normalizedName.includes('paises bajos') || normalizedName.includes('netherlands') || normalizedName.includes('holanda')) {
                        return 'nl';
                      } else if (normalizedName.includes('republica checa') || normalizedName.includes('czech') || normalizedName.includes('czechia')) {
                        return 'cz';
                      } else if (normalizedName.includes('polonia') || normalizedName.includes('poland')) {
                        return 'pl';
                      } else if (normalizedName.includes('grecia') || normalizedName.includes('greece')) {
                        return 'gr';
                      } else if (normalizedName.includes('croacia') || normalizedName.includes('croatia')) {
                        return 'hr';
                      } else if (normalizedName.includes('hungria') || normalizedName.includes('hungary')) {
                        return 'hu';
                      } else if (normalizedName.includes('lituania') || normalizedName.includes('lithuania')) {
                        return 'lt';
                      } else if (normalizedName.includes('eslovaquia') || normalizedName.includes('slovakia')) {
                        return 'sk';
                      } else if (normalizedName.includes('luxemburgo') || normalizedName.includes('luxembourg')) {
                        return 'lu';
                      } else if (normalizedName.includes('letonia') || normalizedName.includes('latvia')) {
                        return 'lv';
                      } else if (normalizedName.includes('chipre') || normalizedName.includes('cyprus')) {
                        return 'cy';
                      } else if (normalizedName.includes('rusia') || normalizedName.includes('russia')) {
                        return 'ru';
                      } else if (normalizedName.includes('corea del sur') || normalizedName.includes('south korea')) {
                        return 'kr';
                      } else if (normalizedName.includes('japon') || normalizedName.includes('japan')) {
                        return 'jp';
                      } else if (normalizedName.includes('suiza') || normalizedName.includes('switzerland')) {
                        return 'ch';
                      } else if (normalizedName.includes('macedonia del norte') || normalizedName.includes('north macedonia')) {
                        return 'mk';
                      } else if (normalizedName.includes('turquia') || normalizedName.includes('turkiye') || normalizedName.includes('turkey')) {
                        return 'tr';
                      }
                      
                      // 3. Si aún no encontramos, buscar en el JSON de banderas por nombre
                      const countryData = countryFlags.find((country: CountryFlag) => {
                        const normalizedCountry = normalizeText(country.country);
                        return normalizedName.includes(normalizedCountry);
                      });
                      
                      return countryData?.code?.toLowerCase() || 'un'; // Devolvemos un por defecto (Naciones Unidas)
                    };
                    
                    const countryCode = getCountryCode(normalizedName);
                    return `<img src="https://flagcdn.com/${countryCode}.svg" class="w-full h-full object-cover" alt="${displayName}" />`;
                  })()}
                </div>
                <h3 class="text-lg font-bold text-gray-800">${displayName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-4">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                    <span>${language === 'es' ? 'Inversión I+D:' : 'R&D Investment:'}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-2xl font-bold text-blue-700">${formattedValue}%</span>
                    <span class="ml-1 text-gray-600 text-sm">${language === 'es' ? 'del PIB' : 'of GDP'}</span>
                    ${labelValue ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${labelValue}</span>` : ''}
                  </div>
                </div>
                
                <!-- Ranking -->
                <div class="mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2"><path d="M12 17.98 4.91 21l1.43-6.15-4.72-4.13 6.22-.52L12 4.77l4.16 5.43 6.22.52-4.72 4.13L19.09 21z"></path></svg>
                  <span class="font-medium">Rank </span>
                  <span class="font-bold text-lg mx-1">${rank}</span>
                  <span class="text-gray-600">${language === 'es' ? `de ${totalCountries}` : `of ${totalCountries}`}</span>
                </div>
                
                <!-- Comparaciones -->
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${euComparisonHtml}
                  ${spainComparisonHtml}
                  ${canariasComparisonHtml}
                </div>
              </div>
              
              <!-- Footer -->
              ${labelValue && labelDescriptions[labelValue] ? 
                `<div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  <span>${labelValue} - ${labelDescriptions[labelValue][language]}</span>
                </div>` 
                : ''}
            </div>
          `;
        }
      } else {
        // Usar la función de ocultar tooltip
        hideTooltip();
      }
    }
  };

  // Función para actualizar la posición del tooltip durante el movimiento del mouse
  const handleMouseMove = (event: MouseEvent) => {
    if (!tooltipRef.current || tooltipRef.current.style.display === 'none') return;
    
    tooltipRef.current.style.left = `${event.clientX + 5}px`;
    tooltipRef.current.style.top = `${event.clientY - 40}px`;
  };

  // Función para ocultar el tooltip
  const hideTooltip = () => {
    if (!tooltipRef.current) return;
    
    // Ocultar el tooltip con una transición suave
    tooltipRef.current.style.opacity = '0';
    
    // Ocultar después de la transición
    setTimeout(() => {
      if (tooltipRef.current && tooltipRef.current.style.opacity === '0') {
        tooltipRef.current.style.display = 'none';
      }
    }, 100);
  };

  // Añadir y eliminar el listener para el movimiento del mouse
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    
    // Añadir listener para ocultar el tooltip cuando el cursor sale del contenedor
    if (containerRef.current) {
      containerRef.current.addEventListener('mouseleave', hideTooltip);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mouseleave', hideTooltip);
      }
      // Asegurarse de ocultar el tooltip al desmontar
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    };
  }, []);

  // Función para obtener el valor de inversión de España para el año y sector seleccionados
  const getSpainValue = (data: EuropeCSVData[], selectedYear: number, selectedSector: string): number | null => {
    if (!data || data.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre en inglés
    const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';
    
    // Buscar España en los datos
    const spainData = data.filter(item => {
      const isSpain = (
        (item.Country && normalizeText(item.Country).includes('spain')) || 
        (item.País && (normalizeText(item.País).includes('espana') || normalizeText(item.País).includes('españa')))
      );
      const yearMatch = parseInt(item.Year) === selectedYear;
      const sectorMatch = item.Sector === sectorNameEn || 
                        (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      return isSpain && yearMatch && sectorMatch;
    });
    
    if (spainData.length === 0) return null;
    
    // Obtener el valor
    const valueStr = spainData[0]['%GDP'] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  };

  // Función para obtener el valor de inversión de la Unión Europea para el año y sector seleccionados
  const getEUValue = (data: EuropeCSVData[], selectedYear: number, selectedSector: string): number | null => {
    if (!data || data.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre en inglés
    const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';
    
    // Buscar la UE en los datos
    const euData = data.filter(item => {
      const isEU = (
        (item.Country && normalizeText(item.Country).includes('european union')) || 
        (item.País && normalizeText(item.País).includes('union europea'))
      );
      const yearMatch = parseInt(item.Year) === selectedYear;
      const sectorMatch = item.Sector === sectorNameEn || 
                        (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      return isEU && yearMatch && sectorMatch;
    });
    
    if (euData.length === 0) return null;
    
    // Obtener el valor
    const valueStr = euData[0]['%GDP'] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  };

  // Función para obtener el valor de inversión de Canarias para el año y sector seleccionados
  const getCanariasValue = (autonomousCommunitiesData: AutonomousCommunityData[], selectedYear: number, selectedSector: string): number | null => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre que corresponde en el CSV de comunidades autónomas
    const sectorMapping: Record<string, string> = {
      'total': 'All Sectors',
      'business': 'Business enterprise sector',
      'government': 'Government sector',
      'education': 'Higher education sector',
      'nonprofit': 'Private non-profit sector'
    };
    
    const sectorToFind = sectorMapping[selectedSector] || 'All Sectors';
    
    // Buscar Canarias en los datos de comunidades autónomas
    const canariasData = autonomousCommunitiesData.filter(item => {
      const isCommunity = normalizeText(item["Comunidad Limpio"]) === "canarias";
      const yearMatch = parseInt(item["Año"]) === selectedYear;
      const sectorMatch = item["Sector"] === sectorToFind;
      return isCommunity && yearMatch && sectorMatch;
    });
    
    if (canariasData.length === 0) return null;
    
    // Obtener el valor del % PIB
    const valueStr = canariasData[0]["% PIB I+D"] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  };

  // Estilos para el contenedor con scroll - altura específica para coincidir con el mapa
  const scrollContainerStyle: React.CSSProperties = {
    height: '400px',
    overflowY: 'auto',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px'
  };

  // Altura dinámica para el gráfico en función del número de países
  const chartHeight = Math.max(400, sortedCountries.length * 25);

  return (
    <div className="flex flex-col h-full relative">
      {/* Gráfica principal */}
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {t.title}
        </h3>
      </div>
      
      {sortedCountries.length > 0 ? (
        <>
          <div 
            ref={containerRef}
            style={scrollContainerStyle} 
            className="mb-1"
            onMouseLeave={hideTooltip}
          >
            <div style={{ height: `${chartHeight}px`, width: '100%' }}>
              <Bar 
                ref={chartRef}
                data={chartData} 
                options={{
                  ...options,
                  plugins: {
                    ...options.plugins,
                    title: {
                      ...options.plugins?.title,
                      display: false
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Etiqueta del eje X centrada */}
          <div className="text-center mb-2 text-sm font-medium text-gray-700">
            {t.axisLabel}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-64 text-gray-800 font-medium">
          {t.noData}
        </div>
      )}
      
      {/* Tooltip personalizado con nuevo diseño */}
      <div 
        ref={tooltipRef}
        className="country-tooltip absolute z-50 pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed',
          opacity: 0,
          transition: 'opacity 0.1s ease-in-out',
          maxWidth: '300px'
        }}
      >
        <div className="tooltip-content"></div>
      </div>
    </div>
  );
};

// Exportar los colores para usarlos en otros componentes
export { CHART_PALETTE };

export default memo(CountryRankingChart); 