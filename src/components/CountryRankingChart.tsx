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

interface CountryRankingChartProps {
  data: EuropeCSVData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
  labels?: LabelData[];
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
  labels = []
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
        const rankText = language === 'es' 
          ? `Rank ${rank} de ${totalCountries}` 
          : `Rank ${rank} of ${totalCountries}`;
        
        // Mostrar el tooltip
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.opacity = '1';
        tooltipRef.current.style.left = `${clientX + 5}px`;
        tooltipRef.current.style.top = `${clientY - 40}px`;
        
        const countryNameElement = tooltipRef.current.querySelector('.country-name');
        const tooltipDataElement = tooltipRef.current.querySelector('.tooltip-data');
        
        if (countryNameElement && tooltipDataElement) {
          // Usar el nombre del país según el idioma seleccionado
          const displayName = countryNames[countryName] 
            ? (language === 'es' ? countryNames[countryName].es : countryNames[countryName].en) 
            : countryName;
            
          countryNameElement.textContent = displayName;
          
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
          
          // Formatear el HTML incluyendo el ranking y la etiqueta (label) si existe
          const valueWithLabel = labelValue 
            ? `<b>${formattedValue}%</b> (${labelValue})` 
            : `<b>${formattedValue}%</b>`;
          
          const tooltipParts = language === 'es' 
            ? [`Inversión I+D: ${valueWithLabel} del PIB`, rankText]
            : [`R&D Investment: ${valueWithLabel} of GDP`, rankText];
          
          // Verificar si el país es la UE
          const normalizedName = normalizeText(displayName);
          const isEU = normalizedName.includes('union europea') || 
                     normalizedName.includes('european union');
          
          // Verificar si el país es España
          const isSpain = normalizedName.includes('espana') || 
                       normalizedName.includes('españa') ||
                       normalizedName.includes('spain');
          
          // Buscar y añadir el valor de la UE para comparación
          if (!isEU) {
            const euValue = getEUValue(data, selectedYear, selectedSector);
            
            if (euValue !== null && euValue > 0) {
              const difference = value - euValue;
              const percentDiff = (difference / euValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? '#009900' : '#CC0000'; // Verde o rojo
              
              const comparisonText = language === 'es'
                ? `vs UE: <span style="color:${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>`
                : `vs EU: <span style="color:${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>`;
                
              tooltipParts.push(comparisonText);
            } else if (euValue !== null && euValue === 0) {
              // Si el valor de la UE es 0, mostrar "--" en gris
              const comparisonText = language === 'es'
                ? `vs UE: <span style="color:#888888">--</span>`
                : `vs EU: <span style="color:#888888">--</span>`;
                
              tooltipParts.push(comparisonText);
            }
          }
          
          // Buscar y añadir el valor de España para comparación
          if (!isSpain) {
            const spainValue = getSpainValue(data, selectedYear, selectedSector);
            
            if (spainValue !== null && spainValue > 0) {
              const difference = value - spainValue;
              const percentDiff = (difference / spainValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? '#009900' : '#CC0000'; // Verde o rojo
              
              const comparisonText = language === 'es'
                ? `vs España: <span style="color:${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>`
                : `vs Spain: <span style="color:${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>`;
                
              tooltipParts.push(comparisonText);
            } else if (spainValue !== null && spainValue === 0) {
              // Si el valor de España es 0, mostrar "--" en gris
              const comparisonText = language === 'es'
                ? `vs España: <span style="color:#888888">--</span>`
                : `vs Spain: <span style="color:#888888">--</span>`;
                
              tooltipParts.push(comparisonText);
            }
          }
          
          // Añadir descripción de la etiqueta si existe
          if (labelValue) {
            const labelDescription = labelDescriptions[labelValue] 
              ? labelDescriptions[labelValue][language] 
              : '';
              
            if (labelDescription) {
              const labelText = `<i>${labelValue} - ${labelDescription}</i>`;
              tooltipParts.push(labelText);
            }
          }
            
          tooltipDataElement.innerHTML = tooltipParts.join('<br>');
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
      
      {/* Tooltip personalizado con el mismo estilo que el mapa */}
      <div 
        ref={tooltipRef}
        className="country-tooltip absolute z-50 bg-white border border-gray-200 rounded shadow-md pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed', // Usar posición fija para evitar problemas con contenedores anidados
          opacity: 0,
          transition: 'opacity 0.1s ease-in-out',
          padding: '10px',
          maxWidth: '220px',
          minWidth: '180px',
          borderWidth: '1px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
      >
        <p className="country-name font-bold text-black mb-1 text-sm"></p>
        <p className="tooltip-data text-black text-sm"></p>
      </div>
    </div>
  );
};

// Exportar los colores para usarlos en otros componentes
export { CHART_PALETTE };

export default memo(CountryRankingChart); 