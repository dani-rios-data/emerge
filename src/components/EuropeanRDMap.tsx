import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';

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

// Paleta de colores para el mapa
const RED_PALETTE = {
  NULL: '#f5f5f5',  // Gris claro para valores nulos
  MIN: '#ffcccb',   // Rojo muy claro
  LOW: '#ff9999',   // Rojo claro
  MID: '#ff6666',   // Rojo medio
  HIGH: '#ff3333',  // Rojo fuerte
  MAX: '#cc0000'    // Rojo muy intenso
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
    between1: "1% - 1.5%",
    between2: "1.5% - 2%",
    between3: "2% - 2.5%",
    between4: "2.5% - 3%",
    allSectors: "Todos los sectores",
    rdInvestmentByCountry: "Inversión en I+D por país"
  },
  en: {
    title: "R&D Investment by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    rdInvestment: "R&D Investment",
    ofGDP: "of GDP",
    lessThan: "< 1%",
    between1: "1% - 1.5%",
    between2: "1.5% - 2%",
    between3: "2% - 2.5%",
    between4: "2.5% - 3%",
    allSectors: "All Sectors",
    rdInvestmentByCountry: "R&D Investment by Country"
  }
};

// Tooltip interface para mostrar información al pasar el mouse
interface TooltipState {
  visible: boolean;
  country: string;
  value: string;
  x: number;
  y: number;
}

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
    const sectorMatch = d.Sector && selectedSector && 
                       (selectedSector === 'all' || 
                        normalizarTexto(d.Sector) === normalizarTexto(selectedSector));
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

// Función para obtener el color basado en el valor
const getColorForValue = (value: number | null): string => {
  if (value === null) return RED_PALETTE.NULL;
  
  if (value < 1.0) return RED_PALETTE.MIN;
  if (value < 1.5) return RED_PALETTE.LOW;
  if (value < 2.0) return RED_PALETTE.MID;
  if (value < 2.5) return RED_PALETTE.HIGH;
  return RED_PALETTE.MAX;
};

const EuropeanRDMap: React.FC<EuropeanRDMapProps> = ({ data, selectedYear, selectedSector, language, onClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<TooltipState>({ 
    visible: false,
    country: '', 
    value: 'No disponible', 
    x: 0, 
    y: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJsonData | null>(null);

  // Acceso a los textos localizados
  const t = mapTexts[language];

  // Función para obtener el título del mapa basado en los datos seleccionados
  const getMapTitle = (): string => {
    const yearText = selectedYear || '';
    const sectorText = selectedSector === 'all' 
      ? t.allSectors 
      : t[`sector_${selectedSector}` as keyof typeof t] || selectedSector;
    
    return `${t.rdInvestmentByCountry} - ${sectorText} (${yearText})`;
  };

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

    // Prevenir rerenderizados innecesarios
    const currentSvg = svgRef.current;
    let isMounted = true;

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
          return getColorForValue(value);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'country')
        .on('mouseover', (event: MouseEvent, d: GeoJsonFeature) => {
          if (!isMounted) return;
          
          const countryName = getCountryName(d);
          const value = getCountryValueOptimized(d);
          
          // Obtener la posición relativa al contenedor del mapa
          const rect = currentSvg.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          const newTooltipContent = { 
            visible: true,
            country: countryName || 'Desconocido',
            value: value !== null ? value.toFixed(2) : 'No disponible',
            x,
            y
          };
          
          setTooltipContent(newTooltipContent);
          setTooltipVisible(true);
        })
        .on('mousemove', (event: MouseEvent) => {
          if (!isMounted) return;
          
          // Usar requestAnimationFrame para suavizar la actualización del tooltip
          requestAnimationFrame(() => {
            if (!isMounted) return;
            
            // Obtener la posición relativa al contenedor del mapa
            if (currentSvg) {
              const rect = currentSvg.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              
              setTooltipContent(prev => ({ 
                ...prev, 
                x, 
                y 
              }));
            }
          });
        })
        .on('mouseout', () => {
          if (!isMounted) return;
          setTooltipVisible(false);
        })
        .on('click', (event: MouseEvent, d: GeoJsonFeature) => {
          if (!isMounted || !onClick) return;
          const countryName = getCountryName(d);
          onClick(countryName);
        })
        .style('cursor', onClick ? 'pointer' : 'default');
      
      // Añadir leyenda
      const legendGroup = svg.append('g')
        .attr('transform', `translate(20, ${height - 150})`);
      
      const legend = [
        { color: RED_PALETTE.MIN, label: t.lessThan },
        { color: RED_PALETTE.LOW, label: t.between1 },
        { color: RED_PALETTE.MID, label: t.between2 },
        { color: RED_PALETTE.HIGH, label: t.between3 },
        { color: RED_PALETTE.MAX, label: t.between4 },
        { color: RED_PALETTE.NULL, label: t.noData }
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
          .attr('font-size', '12px');
      });
    };

    renderMap();

    // Función de limpieza
    return () => {
      isMounted = false;
    };
  }, [geojsonData, getCountryValueOptimized, language, onClick]);
  
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
      
      {tooltipVisible && (
        <div 
          className="absolute z-50 p-2 bg-white border border-gray-300 rounded shadow-md pointer-events-none"
          style={{
            left: `${tooltipContent.x}px`,
            top: `${tooltipContent.y}px`,
            transform: 'translate(15px, 15px)'
          }}
        >
          <p className="font-bold">{tooltipContent.country}</p>
          {tooltipContent.value !== 'No disponible' ? (
            <p>
              {t.rdInvestment}: <span className="font-semibold">{tooltipContent.value}% {t.ofGDP}</span>
            </p>
          ) : (
            <p>{t.noData}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EuropeanRDMap; 