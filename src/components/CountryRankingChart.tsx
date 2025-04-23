import React, { memo } from 'react';
import { Bar } from 'react-chartjs-2';
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

interface CountryRankingChartProps {
  data: EuropeCSVData[];
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

const CountryRankingChart: React.FC<CountryRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total'
}) => {
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
      noData: "No hay datos disponibles para este año"
    },
    en: {
      title: `Country Ranking by R&D Investment - ${getSectorName()} (${selectedYear})`,
      axisLabel: "% of GDP",
      noData: "No data available for this year"
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
  const countryMap = new Map<string, number>();

  // MODIFICADO: Usar directamente las columnas 'Country' o 'País' según el idioma
  countryDataForYear.forEach(item => {
    // Usar la columna según el idioma seleccionado
    const countryName = language === 'es' ? item['País'] : item['Country'];
    const rdValue = parseFloat(item['%GDP'].replace(',', '.'));
    
    if (!isNaN(rdValue) && countryName) {
      // Aplicar alias para simplificar nombres de entidades
      let displayName = countryName;
      
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
      if (countryName in aliases) {
        displayName = aliases[countryName][language];
      }
      
      // Ya no necesitamos traducir manualmente, usamos directamente el nombre en el idioma correcto
      countryMap.set(displayName, rdValue);
    }
  });
  
  console.log("Países procesados:", Array.from(countryMap.entries()));
  
  // Ordenar países por valor (de mayor a menor)
  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1]); 
    // MODIFICADO: Mostrar todos los países, no solo los 20 primeros
  
  // Crear datos para el gráfico
  const labels = sortedCountries.map(([country]) => country);
  const values = sortedCountries.map(([, value]) => value);
  
  // Obtener el color del sector seleccionado
  const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
  
  // Crear colores - España en rojo, UE en amarillo, Zona Euro en verde, y el resto con el color del sector seleccionado
  const barColors = labels.map(country => {
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
    labels,
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: CHART_PALETTE.TEXT,
        bodyColor: CHART_PALETTE.TEXT,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.x.toFixed(2)}%`;
          }
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
    <div className="flex flex-col h-full">
      {/* Gráfica principal */}
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {t.title}
        </h3>
      </div>
      
      {sortedCountries.length > 0 ? (
        <>
          <div style={scrollContainerStyle} className="mb-1">
            <div style={{ height: `${chartHeight}px`, width: '100%' }}>
              <Bar data={chartData} options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  title: {
                    ...options.plugins?.title,
                    display: false
                  }
                }
              }} />
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
    </div>
  );
};

// Exportar los colores para usarlos en otros componentes
export { CHART_PALETTE };

export default memo(CountryRankingChart); 