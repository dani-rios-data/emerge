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
import COLORS from '../utils/colors';

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
  highlightCountry?: string;
  selectedSector?: string;
}

// Colores para la gráfica - tonos de azul
const BLUE_PALETTE = {
  DEFAULT: '#4576b5', // Azul estándar para las barras
  LIGHT: '#6b9bd2',   // Azul claro 
  DARK: '#2c5282',    // Azul oscuro
  HIGHLIGHT: COLORS.SPAIN.RED // Mantener España en rojo
};

const CountryRankingChart: React.FC<CountryRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  highlightCountry,
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
      const original = item['Country'];
      const normalized = normalizeText(original);
      console.log(`  ${original} => ${normalized}`);
    });
  }

  // Agrupar por país (para evitar duplicados)
  const countryMap = new Map<string, number>();
  
  // Lista de entidades a excluir (no son países individuales)
  const excludedEntities = [
    'european union',
    'euro area',
    'oecd',
    'eu28',
    'eu27',
    'zone euro',
    'zona euro'
  ];

  countryDataForYear.forEach(item => {
    const countryName = item['Country']; // Usar solo el nombre en inglés
    const rdValue = parseFloat(item['%GDP'].replace(',', '.'));
    
    // Comprobar si es un país individual y no una agrupación o promedio
    const isIndividualCountry = countryName && 
      !excludedEntities.some(entity => 
        countryName.toLowerCase().includes(entity)
      );
    
    if (!isNaN(rdValue) && isIndividualCountry) {
      // Traducir algunos nombres comunes si el idioma es español
      let displayName = countryName;
      if (language === 'es') {
        const translations: {[key: string]: string} = {
          'Spain': 'España',
          'Germany': 'Alemania',
          'Germany (until 1990 former territory of the FRG)': 'Alemania',
          'France': 'Francia',
          'Italy': 'Italia',
          'Belgium': 'Bélgica',
          'Portugal': 'Portugal',
          'Netherlands': 'Países Bajos',
          'The Netherlands': 'Países Bajos',
          'Sweden': 'Suecia',
          'Finland': 'Finlandia',
          'Denmark': 'Dinamarca',
          'Austria': 'Austria',
          'Hungary': 'Hungría',
          'Czechia': 'República Checa',
          'Czech Republic': 'República Checa',
          'Poland': 'Polonia',
          'Ireland': 'Irlanda',
          'Luxembourg': 'Luxemburgo',
          'Greece': 'Grecia',
          'Romania': 'Rumanía',
          'Bulgaria': 'Bulgaria',
          'Croatia': 'Croacia',
          'Slovenia': 'Eslovenia',
          'Slovakia': 'Eslovaquia',
          'Switzerland': 'Suiza',
          'United Kingdom': 'Reino Unido',
          'United States': 'Estados Unidos',
          'Japan': 'Japón',
          'South Korea': 'Corea del Sur',
          'China except Hong Kong': 'China (excepto Hong Kong)',
          'Norway': 'Noruega',
          'Iceland': 'Islandia',
          'Turkey': 'Turquía',
          'Estonia': 'Estonia',
          'Latvia': 'Letonia',
          'Lithuania': 'Lituania',
          'Cyprus': 'Chipre',
          'Malta': 'Malta',
          'Montenegro': 'Montenegro',
          'North Macedonia': 'Macedonia del Norte',
          'Albania': 'Albania',
          'Serbia': 'Serbia',
          'Bosnia and Herzegovina': 'Bosnia y Herzegovina'
        };
        displayName = translations[countryName] || countryName;
      }
      
      countryMap.set(displayName, rdValue);
    }
  });
  
  console.log("Países procesados:", Array.from(countryMap.entries()));
  
  // Ordenar países por valor (de mayor a menor)
  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Mostrar los 20 primeros para una mejor comparación
  
  // Crear datos para el gráfico
  const labels = sortedCountries.map(([country]) => country);
  const values = sortedCountries.map(([, value]) => value);
  
  // Crear colores - destacar el país seleccionado si existe usando la nueva paleta de azules
  const barColors = labels.map(country => {
    // Normalizar tanto el país actual como el destacado para la comparación
    const normalizedCountry = normalizeText(country);
    const normalizedHighlight = highlightCountry ? normalizeText(highlightCountry) : '';
    
    if (highlightCountry && normalizedCountry === normalizedHighlight) {
      return BLUE_PALETTE.HIGHLIGHT; // Rojo para país seleccionado
    }
    
    if (normalizedCountry === 'espana' || normalizedCountry === 'spain') {
      return BLUE_PALETTE.HIGHLIGHT; // Rojo para España
    }
    
    // Variar ligeramente los tonos de azul para diferenciar países
    const index = labels.indexOf(country);
    if (index % 3 === 0) return BLUE_PALETTE.DARK;
    if (index % 3 === 1) return BLUE_PALETTE.DEFAULT;
    return BLUE_PALETTE.LIGHT;
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
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#333'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.x.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t.axisLabel,
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      y: {
        title: {
          display: false
        }
      }
    }
  };

  return (
    <div className="relative h-full">
      {sortedCountries.length > 0 ? (
        <div className="h-full"> 
          <Bar data={chartData} options={options} />
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 text-gray-500">
          {t.noData}
        </div>
      )}
    </div>
  );
};

export default memo(CountryRankingChart); 