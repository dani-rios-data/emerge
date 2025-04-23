import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
import { SECTOR_COLORS } from '../utils/colors';

// Definir la interfaz para los datos de entrada
interface EuropeCSVData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
  Value?: string;
  [key: string]: string | undefined;
}

// Definición de tipos más estrictos para propiedades
type GeoJsonProperties = {
  NAME?: string;
  NAME_EN?: string;
  ADMIN?: string;
  CNTRY_NAME?: string;
  iso_a3?: string;
  iso_a2?: string;
  [key: string]: string | number | undefined;
};

// Tipo para las características GeoJSON
type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

interface EuropeanRDMapProps {
  data: EuropeCSVData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

// Paleta de colores para el mapa basada en los colores de sectores
const getSectorPalette = (sectorId: string) => {
  // Normalizar el ID del sector para asegurar compatibilidad
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar nombres de sectores en inglés a IDs
  if (normalizedId === 'all sectors') normalizedId = 'total';
  if (normalizedId === 'business enterprise sector') normalizedId = 'business';
  if (normalizedId === 'government sector') normalizedId = 'government';
  if (normalizedId === 'higher education sector') normalizedId = 'education';
  if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para SECTOR_COLORS
  const validSectorId = (normalizedId in SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = SECTOR_COLORS[validSectorId as keyof typeof SECTOR_COLORS];
  
  console.log(`Sector ID: ${sectorId} -> Normalized: ${normalizedId} -> Valid: ${validSectorId} -> Color: ${baseColor}`);
  
  // Crear gradiente basado en el color del sector
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    MIN: d3.color(baseColor)?.brighter(1.5)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1)?.toString() || '#d0d0d0',    // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(0.7)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.2)?.toString() || '#707070',    // Muy oscuro
  };
};

// Textos localizados para el mapa
const mapTexts = {
  es: {
    title: "Inversión en I+D por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    rdInvestment: "Inversión I+D",
    ofGDP: "del PIB",
    lessThan: "< 1%",
    between1: "1% - 1.8%",
    between2: "1.8% - 2.5%",
    between3: "2.5% - 3.2%",
    between4: "> 3.2%",
    allSectors: "Todos los sectores",
    rdInvestmentByCountry: "Inversión en I+D por país",
    // Sectores traducidos
    sector_business: "Empresas",
    sector_government: "Gobierno",
    sector_education: "Educación superior",
    sector_nonprofit: "Organizaciones sin ánimo de lucro",
    sector_total: "Todos los sectores"
  },
  en: {
    title: "R&D Investment by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    rdInvestment: "R&D Investment",
    ofGDP: "of GDP",
    lessThan: "< 1%",
    between1: "1% - 1.8%",
    between2: "1.8% - 2.5%",
    between3: "2.5% - 3.2%",
    between4: "> 3.2%",
    allSectors: "All Sectors",
    rdInvestmentByCountry: "R&D Investment by Country",
    // Sectores traducidos
    sector_business: "Business enterprise",
    sector_government: "Government",
    sector_education: "Higher education",
    sector_nonprofit: "Private non-profit",
    sector_total: "All sectors"
  }
};

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Función para obtener el nombre del país de las propiedades GeoJSON
function getCountryName(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  // Intentar obtener el nombre del país de diferentes propiedades posibles
  return (
    props.NAME ||
    props.NAME_EN ||
    props.ADMIN ||
    props.CNTRY_NAME ||
    props.name ||
    'Desconocido'
  ) as string;
}

// Función para obtener el ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  // Intentar obtener el código ISO3 de diferentes propiedades posibles
  return (props.ISO3 || props.iso_a3 || props.ADM0_A3 || '') as string;
}

// Función para obtener el valor del país basado en los datos, año y sector seleccionados
function getCountryValue(
  feature: GeoJsonFeature,
  data: EuropeCSVData[],
  selectedYear: string,
  selectedSector: string
): number | null {
  if (!data || data.length === 0 || !feature) return null;

  const countryName = getCountryName(feature);
  const countryIso3 = getCountryIso3(feature);
  
  // Mapeo entre ID de sector y nombre en inglés para consultas
  const sectorNameMapping: Record<string, string> = {
    'total': 'All Sectors',
    'all': 'All Sectors',
    'business': 'Business enterprise sector',
    'government': 'Government sector',
    'education': 'Higher education sector',
    'nonprofit': 'Private non-profit sector'
  };
  
  const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';

  // Intentar coincidir primero por ISO3
  let countryData = data.filter(d => {
    // Intentar hacer coincidir usando la propiedad ISO3
    const iso3Match = d.ISO3 && countryIso3 && 
                    normalizarTexto(d.ISO3) === normalizarTexto(countryIso3);
    return iso3Match;
  });

  // Si no hay coincidencia, intentar por nombre
  if (countryData.length === 0) {
    countryData = data.filter(d => {
      const nameMatch = (d.Country || d.País) && countryName && 
        (normalizarTexto(d.Country || '') === normalizarTexto(countryName) ||
         normalizarTexto(d.País || '') === normalizarTexto(countryName));
      return nameMatch;
    });
  }

  if (countryData.length === 0) {
    return null;
  }

  // Filtrar por año y sector
  const filteredData = countryData.filter(d => {
    const yearMatch = d.Year && selectedYear && 
                     d.Year.toString().trim() === selectedYear.toString().trim();
    const sectorMatch = d.Sector && 
                       (selectedSector === 'all' || selectedSector === 'total' || 
                        normalizarTexto(d.Sector) === normalizarTexto(sectorNameEn));
    return yearMatch && sectorMatch;
  });

  if (filteredData.length === 0) {
    return null;
  }

  // Usar el campo value o %GDP si está disponible
  const dataPoint = filteredData[0];
  const valueStr = dataPoint['%GDP'] || dataPoint.Value || '';
  
  if (valueStr === undefined || valueStr === '') {
    return null;
  }

  try {
    // Convertir a número y manejar decimales con coma o punto
    const valueNum = parseFloat(String(valueStr).replace(',', '.'));
    return valueNum;
  } catch {
    return null;
  }
}

// Crear una función para obtener los rangos de valores de un sector específico
function getSectorValueRange(data: EuropeCSVData[], selectedYear: string, selectedSector: string): { min: number, max: number } {
  // Valores predeterminados en caso de no tener datos
  const defaultRange = { min: 0, max: 3.5 };
  
  if (!data || data.length === 0) return defaultRange;
  
  // Filtrar por año y sector seleccionados
  const filteredData = data.filter(d => {
    const yearMatch = d.Year && d.Year.toString().trim() === selectedYear.trim();
    const sectorMatch = d.Sector && 
                      (selectedSector === 'all' || 
                       normalizarTexto(d.Sector) === normalizarTexto(selectedSector));
    return yearMatch && sectorMatch;
  });
  
  if (filteredData.length === 0) return defaultRange;
  
  // Obtener valores numéricos
  const values = filteredData
    .map(d => {
      const valueStr = d['%GDP'] || d.Value || '';
      if (!valueStr) return null;
      try {
        return parseFloat(String(valueStr).replace(',', '.'));
      } catch {
        return null;
      }
    })
    .filter((v): v is number => v !== null);
  
  if (values.length === 0) return defaultRange;
  
  // Calcular min y max
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return { 
    min: Math.max(0, min), // Asegurar que el mínimo no sea negativo
    max: max 
  };
}

// Función para obtener el color basado en el valor y el sector seleccionado
const getColorForValue = (value: number | null, palette: Record<string, string>, valueRange: {min: number, max: number}): string => {
  if (value === null) return palette.NULL;
  
  // Ajustar los umbrales basados en el rango de valores del sector
  const min = valueRange.min;
  const max = valueRange.max;
  const range = max - min;
  
  // Definir umbrtales dinámicos basados en el rango de valores
  const threshold1 = min + (range * 0.2);
  const threshold2 = min + (range * 0.4);
  const threshold3 = min + (range * 0.6);
  const threshold4 = min + (range * 0.8);
  
  if (value < threshold1) return palette.MIN;
  if (value < threshold2) return palette.LOW;
  if (value < threshold3) return palette.MID;
  if (value < threshold4) return palette.HIGH;
  return palette.MAX;
};

const EuropeanRDMap: React.FC<EuropeanRDMapProps> = ({ data, selectedYear, selectedSector, language, onClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJsonData | null>(null);
  const [valueRange, setValueRange] = useState<{min: number, max: number}>({min: 0, max: 3.5});

  // Acceso a los textos localizados
  const t = mapTexts[language];

  // Obtener la paleta de colores para el sector seleccionado
  const colorPalette = getSectorPalette(selectedSector);
  
  // Log del sector seleccionado y su paleta
  useEffect(() => {
    console.log('Sector actual:', selectedSector);
    console.log('Paleta de colores:', colorPalette);
  }, [selectedSector, colorPalette]);

  // Función para obtener el título del mapa basado en los datos seleccionados
  const getMapTitle = (): string => {
    const yearText = selectedYear || '';
    let normalizedId = selectedSector;
    if (selectedSector === 'all') normalizedId = 'total';
    
    const sectorKey = `sector_${normalizedId}` as keyof typeof t;
    const sectorText = t[sectorKey] || t.allSectors;
    
    return `${t.rdInvestmentByCountry} - ${sectorText} (${yearText})`;
  };

  // Calcular el rango de valores cuando cambia el sector o el año
  useEffect(() => {
    const newRange = getSectorValueRange(data, selectedYear.toString(), selectedSector);
    setValueRange(newRange);
    console.log(`Rango de valores para ${selectedSector} (${selectedYear}):`, newRange);
  }, [data, selectedYear, selectedSector]);

  // Cargar el GeoJSON
  useEffect(() => {
    // Si ya tenemos los datos, no los volvemos a cargar
    if (geojsonData) return;
    
    setLoading(true);
    setError(null);
    fetch(EUROPE_GEOJSON_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(t.error);
        }
        return response.json();
      })
      .then(geoJsonData => {
        setGeojsonData(geoJsonData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando el mapa:', err);
        setError(t.error);
        setLoading(false);
      });
  }, [t.error, geojsonData]);

  // Efecto para mostrar información sobre los datos CSV disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Reducir logs para mejorar rendimiento
    console.log('Datos CSV cargados:', data.length, 'registros');
    
    // Analizar años y sectores disponibles para verificar filtrado
    const years = [...new Set(data.map(d => d.Year))].sort();
    const sectors = [...new Set(data.map(d => d.Sector))].sort();
    
    console.log('Años disponibles:', years);
    console.log('Sectores disponibles:', sectors);
    
  }, [data]);

  // Función para obtener el valor del país optimizada
  const getCountryValueOptimized = React.useCallback(
    (feature: GeoJsonFeature): number | null => {
      return getCountryValue(feature, data, selectedYear.toString(), selectedSector);
    }, 
    [data, selectedYear, selectedSector]
  );

  // Renderizar el mapa cuando los datos GeoJSON están disponibles
  useEffect(() => {
    if (!svgRef.current || !geojsonData) return;

    const currentSvg = svgRef.current;

    const renderMap = () => {
      const svg = d3.select(currentSvg);
      svg.selectAll('*').remove();

      const width = 600;
      const height = 450;
      
      // Configurar la proyección
      const projection = d3.geoMercator()
        .center([10, 55])
        .scale(450)
        .translate([width / 2, height / 2]);
      
      const path = d3.geoPath().projection(projection);
      
      // Crear el grupo para el mapa
      const mapGroup = svg.append('g')
        .attr('transform', 'translate(0, 30)'); // Desplazar el mapa para dejar espacio al título
      
      // Renderizar países
      mapGroup.selectAll('path')
        .data(geojsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: GeoJsonFeature) => path(d) || '')
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCountryValueOptimized(d);
          return getColorForValue(value, colorPalette, valueRange);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'country')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          // Cambiar el estilo al pasar el mouse
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
          const countryName = getCountryName(d);
          const value = getCountryValueOptimized(d);
          
          // Positioning directly - no React state for immediate feedback
          const tooltip = d3.select('.country-tooltip');
          
          tooltip
            .style('display', 'block')
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 30}px`);
            
          tooltip.select('.country-name').text(countryName || 'Desconocido');
          
          if (value !== null) {
            tooltip.select('.tooltip-data').html(`${t.rdInvestment}: <b>${value.toFixed(2)}% ${t.ofGDP}</b>`);
          } else {
            tooltip.select('.tooltip-data').text(t.noData);
          }
        })
        .on('mousemove', function(event: MouseEvent) {
          // Update tooltip position on mouse move for smooth following
          d3.select('.country-tooltip')
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 30}px`);
        })
        .on('mouseout', function() {
          // Restaurar el estilo al quitar el mouse
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
            
          // Hide tooltip
          d3.select('.country-tooltip').style('display', 'none');
        })
        .on('click', (event: MouseEvent, d: GeoJsonFeature) => {
          if (!onClick) return;
          const countryName = getCountryName(d);
          onClick(countryName);
        })
        .style('cursor', onClick ? 'pointer' : 'default');
      
      // Crear etiquetas para la leyenda basadas en el rango de valores
      const min = valueRange.min;
      const max = valueRange.max;
      const range = max - min;
      
      const threshold1 = min + (range * 0.2);
      const threshold2 = min + (range * 0.4);
      const threshold3 = min + (range * 0.6);
      const threshold4 = min + (range * 0.8);
      
      // Redondear los umbrales para mayor legibilidad
      const formatValue = (value: number) => value.toFixed(1);

      // Añadir leyenda
      const legendGroup = svg.append('g')
        .attr('transform', `translate(20, ${height - 150})`);
      
      const legend = [
        { color: colorPalette.MIN, label: `< ${formatValue(threshold1)}%` },
        { color: colorPalette.LOW, label: `${formatValue(threshold1)} - ${formatValue(threshold2)}%` },
        { color: colorPalette.MID, label: `${formatValue(threshold2)} - ${formatValue(threshold3)}%` },
        { color: colorPalette.HIGH, label: `${formatValue(threshold3)} - ${formatValue(threshold4)}%` },
        { color: colorPalette.MAX, label: `> ${formatValue(threshold4)}%` },
        { color: colorPalette.NULL, label: t.noData }
      ];
      
      // Con tipos explícitos para corregir errores del linter
      type LegendItem = { color: string; label: string };
      legend.forEach(function(item: LegendItem, i: number) {
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', i * 20)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', item.color);
        
        legendGroup.append('text')
          .attr('x', 20)
          .attr('y', i * 20 + 12)
          .text(item.label)
          .attr('font-size', '12px')
          .attr('fill', '#000000'); // Texto negro
      });
    };

    renderMap();
  }, [geojsonData, getCountryValueOptimized, language, onClick, colorPalette, valueRange, t]);
  
  return (
    <div className="relative w-full h-full" ref={mapContainerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-gray-600">
            {t.loading}
          </p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getMapTitle()}
        </h3>
      </div>
      
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox="0 0 600 450" 
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Tooltip permanente en el DOM, controlado por D3 directamente */}
      <div 
        className="country-tooltip absolute z-50 p-2 bg-white border border-gray-300 rounded shadow-md pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed', // Usar posición fija para evitar problemas con contenedores anidados
        }}
      >
        <p className="country-name font-bold text-black"></p>
        <p className="tooltip-data text-black"></p>
      </div>
    </div>
  );
};

export default EuropeanRDMap; 