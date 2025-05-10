import React, { memo, useRef } from 'react';
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
// Importando datos de autonomous_communities_flags.json
import communityFlagsData from '../logos/autonomous_communities_flags.json';
import { DataDisplayType } from './DataTypeSelector';

// Interfaz para los elementos del archivo autonomous_communities_flags.json
interface CommunityFlag {
  community: string;
  code: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const communityFlags = communityFlagsData as CommunityFlag[];

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

// Interfaz para las propiedades del componente
interface RegionRankingChartProps {
  data: AutonomousCommunityData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
  dataDisplayType?: DataDisplayType;
}

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: '#1e88e5', // Azul por defecto
  LIGHT: '#90caf9',   // Azul claro
  HIGHLIGHT: '#ff5252', // Rojo para destacar
  TEXT: '#000000',    // Color del texto (negro) 
  BORDER: '#E5E7EB',  // Color del borde (gris suave)
};

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres esperados para la visualización
const communityNameMapping: { [key: string]: { es: string, en: string } } = {
  'Andalucía': { es: 'Andalucía', en: 'Andalusia' },
  'Aragón': { es: 'Aragón', en: 'Aragon' },
  'Principado de Asturias': { es: 'Asturias', en: 'Asturias' },
  'Illes Balears / Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Cantabria': { es: 'Cantabria', en: 'Cantabria' },
  'Castilla - La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla y León': { es: 'Castilla y León', en: 'Castile and León' },
  'Cataluña': { es: 'Cataluña', en: 'Catalonia' },
  'Comunidad Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'Extremadura': { es: 'Extremadura', en: 'Extremadura' },
  'Galicia': { es: 'Galicia', en: 'Galicia' },
  'La Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Comunidad de Madrid': { es: 'Madrid', en: 'Madrid' },
  'Región de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Comunidad Foral de Navarra': { es: 'Navarra', en: 'Navarre' },
  'País Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Ciudad Autónoma de Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ciudad Autónoma de Melilla': { es: 'Melilla', en: 'Melilla' }
};

const RegionRankingChart: React.FC<RegionRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total',
  dataDisplayType = 'percent_gdp'
}) => {
  const chartRef = useRef(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de comunidades autónomas por inversión en I+D",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% del PIB" : "Miles de €",
      noData: "No hay datos disponibles para este año",
      rdInvestment: "Inversión I+D",
      regionRanking: "Ranking de comunidades autónomas",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Sector gubernamental", 
      sector_education: "Sector educativo superior",
      sector_nonprofit: "Sector privado sin ánimo de lucro"
    },
    en: {
      title: "Autonomous Communities Ranking by R&D Investment",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% of GDP" : "Thousand €", 
      noData: "No data available for this year",
      rdInvestment: "R&D Investment",
      regionRanking: "Autonomous Communities Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y su ID en el CSV
  const sectorIdMapping: Record<string, string> = {
    'total': '_T',
    'business': 'EMPRESAS',
    'government': 'ADMINISTRACION_PUBLICA',
    'education': 'ENSENIANZA_SUPERIOR',
    'nonprofit': 'IPSFL'
  };
  
  const csvSectorId = sectorIdMapping[selectedSector] || '_T';

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Función para obtener la URL de la bandera de una comunidad autónoma
  const getCommunityFlagUrl = (communityName: string): string => {
    // Normalizar el nombre de la comunidad
    const normalizedName = normalizeText(communityName);
    
    // Buscar coincidencias en el archivo de banderas
    const matchingFlag = communityFlags.find(flag => {
      const flagCommunityName = normalizeText(flag.community);
      
      // Verificar coincidencia directa
      if (flagCommunityName === normalizedName) return true;
      
      // Verificar coincidencia por mapeo
      return Object.keys(communityNameMapping).some(key => {
        const mappedName = communityNameMapping[key][language];
        return normalizeText(key) === normalizedName || 
               normalizeText(mappedName) === normalizedName;
      });
    });
    
    return matchingFlag ? matchingFlag.flag : '';
  };

  // Procesar y filtrar datos para el año y sector seleccionado
  const getFilteredData = () => {
    // Filtrar datos por año y sector
    const filteredData = data.filter(item => 
      item["Año"] === selectedYear.toString() &&
      item["Sector Id"] === `(${csvSectorId})`
    );
    
    console.log(`Datos para año ${selectedYear} y sector ${csvSectorId}:`, filteredData.length, "registros");
    
    if (filteredData.length === 0) return [];
    
    // Agrupar por comunidad autónoma (para evitar duplicados)
    const communityMap = new Map<string, {
      nameEs: string, 
      nameEn: string, 
      value: number,
      spending: number,
      gdp: number
    }>();
    
    filteredData.forEach(item => {
      const communityNameEs = item["Comunidad Limpio"];
      const communityNameEn = item["Comunidad en Inglés"];
      
      // Determinar qué valor usar según el tipo de visualización
      let rdValue: number;
      
      if (dataDisplayType === 'percent_gdp') {
        rdValue = parseFloat(item['% PIB I+D'].replace(',', '.'));
      } else {
        rdValue = parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.'));
      }
      
      if (!isNaN(rdValue)) {
        const spending = parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.'));
        const gdp = parseFloat(item['PIB (Miles €)'].replace(',', '.'));
        
        // Aplicar alias para simplificar nombres de comunidades
        let displayNameEs = communityNameEs;
        let displayNameEn = communityNameEn;
        
        // Usar mapeo si existe
        Object.keys(communityNameMapping).forEach(key => {
          if (normalizeText(key) === normalizeText(communityNameEs)) {
            displayNameEs = communityNameMapping[key].es;
            displayNameEn = communityNameMapping[key].en;
          }
        });
        
        communityMap.set(communityNameEs, {
          nameEs: displayNameEs,
          nameEn: displayNameEn,
          value: rdValue,
          spending,
          gdp
        });
      }
    });
    
    // Convertir a array y ordenar por valor (descendente)
    const sortedData = Array.from(communityMap.values())
      .sort((a, b) => b.value - a.value);
    
    return sortedData;
  };
  
  const chartData = getFilteredData();

  // Función para formatear números con separador de miles
  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(value);
  };

  // Función para generar la configuración del gráfico
  const getChartConfig = () => {
    // Formatear etiquetas y valores
    const labels = chartData.map(item => language === 'es' ? item.nameEs : item.nameEn);
    const values = chartData.map(item => item.value);
    
    // Generar colores (destacar algunas comunidades de interés)
    const backgroundColors = chartData.map(item => {
      // Destacar comunidades específicas
      const highlightedCommunities = ['Madrid', 'País Vasco', 'Cataluña', 'Navarra'];
      const communityName = item.nameEs;
      
      if (highlightedCommunities.some(highlight => normalizeText(communityName).includes(normalizeText(highlight)))) {
        return CHART_PALETTE.HIGHLIGHT;
      }
      
      return CHART_PALETTE.DEFAULT;
    });
    
    // Configuración de datos para el gráfico
    const data = {
      labels,
      datasets: [{
        label: dataDisplayType === 'percent_gdp' ? 
          (language === 'es' ? '% del PIB' : '% of GDP') : 
          (language === 'es' ? 'Miles de €' : 'Thousand €'),
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color === CHART_PALETTE.HIGHLIGHT ? 
          '#ff1744' : // Borde más oscuro para barras destacadas
          '#0d47a1'   // Borde más oscuro para barras normales
        ),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 20,
      }]
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
        tooltip: {
          enabled: false, // Desactivar tooltip nativo de Chart.js
          external: function(context) {
            // Implementar tooltip personalizado
            const tooltipEl = tooltipRef.current;
            if (!tooltipEl) return;
            
            // Ocultar si no hay elementos activos
            if (context.tooltip.opacity === 0) {
              tooltipEl.style.opacity = '0';
              tooltipEl.style.display = 'none';
              return;
            }
            
            // Obtener datos del tooltip
            const dataIndex = context.tooltip.dataPoints[0].dataIndex;
            const communityData = chartData[dataIndex];
            
            if (!communityData) return;
            
            // Obtener bandera
            const communityName = language === 'es' ? communityData.nameEs : communityData.nameEn;
            const flagUrl = getCommunityFlagUrl(communityName);
            
            // Construir contenido HTML
            let tooltipContent = `
              <div class="flex items-center mb-2">
                ${flagUrl ? `<img src="${flagUrl}" class="h-6 mr-2" alt="${communityName}"/>` : ''}
                <span class="font-bold">${communityName}</span>
              </div>
            `;
            
            if (dataDisplayType === 'percent_gdp') {
              tooltipContent += `
                <div class="text-sm">
                  ${language === 'es' ? 'Gasto en I+D' : 'R&D Expenditure'}: <span class="font-semibold">${formatNumber(communityData.spending, 0)} ${language === 'es' ? 'mil €' : 'k€'}</span>
                </div>
                <div class="text-sm">
                  PIB: <span class="font-semibold">${formatNumber(communityData.gdp / 1000000, 2)} ${language === 'es' ? 'mill. €' : 'M€'}</span>
                </div>
                <div class="text-sm font-medium mt-1">
                  ${language === 'es' ? 'Inversión I+D' : 'R&D Investment'}: <span class="text-blue-600">${formatNumber(communityData.value, 2)}% ${language === 'es' ? 'del PIB' : 'of GDP'}</span>
                </div>
              `;
            } else {
              tooltipContent += `
                <div class="text-sm">
                  ${language === 'es' ? 'Gasto en I+D' : 'R&D Expenditure'}: <span class="font-semibold">${formatNumber(communityData.spending, 0)} ${language === 'es' ? 'mil €' : 'k€'}</span>
                </div>
                <div class="text-sm font-medium mt-1">
                  ${language === 'es' ? 'Ranking' : 'Ranking'}: <span class="text-blue-600">${dataIndex + 1} ${language === 'es' ? 'de' : 'of'} ${chartData.length}</span>
                </div>
              `;
            }
            
            // Actualizar contenido y mostrar tooltip
            tooltipEl.innerHTML = tooltipContent;
            tooltipEl.style.display = 'block';
            tooltipEl.style.opacity = '1';
            
            // Posicionar tooltip
            const chart = context.chart;
            const canvas = chart.canvas;
            const position = canvas.getBoundingClientRect();
            
            // Calcular posición
            const tooltipWidth = tooltipEl.offsetWidth;
            const tooltipHeight = tooltipEl.offsetHeight;
            
            // Posicionar a la derecha de la barra
            const x = position.left + window.pageXOffset + context.tooltip.caretX + 10;
            const y = position.top + window.pageYOffset + context.tooltip.caretY - (tooltipHeight / 2);
            
            // Ajustar si se sale de la ventana
            const windowWidth = window.innerWidth;
            if (x + tooltipWidth > windowWidth) {
              tooltipEl.style.left = (x - tooltipWidth - 20) + 'px';
            } else {
              tooltipEl.style.left = x + 'px';
            }
            
            tooltipEl.style.top = y + 'px';
          }
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
            }
          }
        },
        x: {
          grid: {
            color: '#f0f0f0'
          },
          ticks: {
            color: CHART_PALETTE.TEXT,
            callback: function(value) {
              const numValue = Number(value);
              if (dataDisplayType === 'percent_gdp') {
                return `${formatNumber(numValue, numValue < 1 ? 2 : 1)}%`;
              } else {
                return formatNumber(numValue / 1000, 0) + (language === 'es' ? ' M€' : ' M€');
              }
            }
          },
          title: {
            display: true,
            text: t.axisLabel,
            color: CHART_PALETTE.TEXT,
            font: {
              weight: 'normal',
              size: 12
            }
          }
        }
      }
    };
    
    return { data, options };
  };

  // Obtener título del gráfico
  const getChartTitle = () => {
    // Mapeo de IDs de sector a nombres localizados
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
    
    // Obtener nombre localizado del sector
    const sectorName = sectorNames[selectedSector] ? 
                       sectorNames[selectedSector][language] : 
                       (language === 'es' ? 'Todos los sectores' : 'All sectors');
    
    // Construir el título
    if (language === 'es') {
      return `Ranking por Comunidades Autónomas - ${sectorName} (${selectedYear})`;
    } else {
      return `Autonomous Communities Ranking - ${sectorName} (${selectedYear})`;
    }
  };

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

  // Configuración del gráfico
  const chartConfig = getChartConfig();

  return (
    <div className="relative h-full" ref={containerRef}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{getChartTitle()}</h3>
      </div>
      <div className="h-[calc(100%-2rem)] w-full">
        <Bar 
          ref={chartRef}
          data={chartConfig.data}
          options={chartConfig.options}
        />
        <div 
          ref={tooltipRef}
          className="absolute hidden bg-white p-3 rounded-md shadow-lg border border-gray-200 z-10 pointer-events-none max-w-[250px]"
          style={{ opacity: 0 }}
        ></div>
      </div>
    </div>
  );
};

export default memo(RegionRankingChart); 