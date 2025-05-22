import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

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
  const chartRef = useRef<HTMLDivElement>(null);

  // Textos según el idioma
  const texts = {
    es: {
      title: 'Ranking de Comunidades Autónomas por número de investigadores',
      noData: 'No hay datos disponibles',
      researchersLabel: 'Investigadores',
      loading: 'Cargando...',
      researchers: 'Investigadores',
      thousands: 'miles'
    },
    en: {
      title: 'Ranking of Autonomous Communities by number of researchers',
      noData: 'No data available',
      researchersLabel: 'Researchers',
      loading: 'Loading...',
      researchers: 'Researchers',
      thousands: 'thousands'
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Limpiar el gráfico existente
    d3.select(chartRef.current).selectAll('*').remove();

    // Mapear el sector seleccionado al código del sector en los datos
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

    // Filtrar datos por año, sector y sexo (total)
    const filteredData = data.filter(item => 
      item.TIME_PERIOD === selectedYear.toString() &&
      item.SECTOR_EJECUCION_CODE === sectorId &&
      item.SEXO_CODE === '_T'
    );

    if (filteredData.length === 0) {
      // Mostrar mensaje de "no hay datos"
      d3.select(chartRef.current)
        .append('div')
        .attr('class', 'flex h-full items-center justify-center')
        .append('p')
        .attr('class', 'text-lg text-gray-500')
        .text(t.noData);
      return;
    }

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
      const flagObj = communityFlags.find(flag => 
        normalizarTexto(flag.community) === normalizarTexto(displayName) ||
        normalizarTexto(flag.community) === normalizarTexto(communityName)
      );
      
      return {
        name: displayName,
        value: parseFloat(item.OBS_VALUE),
        code: item.TERRITORIO_CODE,
        flag: flagObj ? flagObj.flag : ''
      };
    })
    .filter(item => !isNaN(item.value))
    .sort((a, b) => b.value - a.value) // Ordenar de mayor a menor
    .slice(0, maxItems); // Limitar número de elementos si es necesario

    // Configuración del gráfico
    const margin = { top: 30, right: 30, bottom: 10, left: 130 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = Math.max(chartData.length * 45, 300) - margin.top - margin.bottom;

    // Crear SVG
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('style', 'width: 100%; height: auto; max-height: 600px;')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas X e Y
    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) || 0])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(chartData.map(d => d.name))
      .range([0, height])
      .padding(0.3);

    // Añadir ejes
    svg.append('g')
      .attr('transform', `translate(0,0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .attr('class', 'text-sm')
      .attr('dy', '0.35em');

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => {
        // Formatear números grandes (en miles)
        const value = d as number;
        return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString();
      }))
      .selectAll('text')
      .attr('class', 'text-xs')
      .attr('dy', '0.71em');

    // Añadir título al eje X
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom + 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs text-gray-600')
      .text(t.researchers);

    // Añadir líneas de referencia horizontales
    svg.selectAll('line.grid')
      .data(x.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid')
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Añadir barras
    const bars = svg.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'bar');

    bars.append('rect')
      .attr('y', d => y(d.name) || 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', d => x(d.value))
      .attr('fill', '#3b82f6')
      .attr('rx', 4) // Bordes redondeados
      .attr('ry', 4);

    // Añadir etiquetas de valor
    bars.append('text')
      .attr('x', d => x(d.value) + 5)
      .attr('y', d => (y(d.name) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('class', 'text-xs font-medium')
      .text(d => {
        // Formatear el número según el idioma
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
          maximumFractionDigits: 0
        }).format(d.value);
      });

    // Añadir banderas si están disponibles
    bars.append('image')
      .filter(d => Boolean(d.flag)) // Solo añadir imágenes si hay una bandera disponible
      .attr('x', -25)
      .attr('y', d => (y(d.name) || 0) + (y.bandwidth() - 20) / 2)
      .attr('width', 20)
      .attr('height', 15)
      .attr('xlink:href', d => d.flag);

    // Añadir título al gráfico
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm font-medium')
      .text(`${t.title} (${selectedYear})`);

  }, [data, selectedYear, selectedSector, language, maxItems, t]);

  return (
    <div 
      ref={chartRef} 
      className="w-full h-full min-h-[400px] flex items-center justify-center"
      aria-label={t.title}
    >
      {!data || data.length === 0 ? (
        <div className="text-gray-500">{t.loading}</div>
      ) : null}
    </div>
  );
};

export default ResearchersCommunityRankingChart; 