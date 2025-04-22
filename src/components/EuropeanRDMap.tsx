import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { rdSectors } from '../data/rdInvestment';

// Interfaz para adaptarse a EuropeCSVData
interface EuropeCSVData {
  Country: string;
  Year: string;
  Sector: string;
  Value: string;
  '%GDP'?: string;  // Posible nombre de columna para el valor del PIB
  ISO3?: string;    // Código ISO3 (3 letras)
  [key: string]: string | undefined;
}

// GeoJSON puede tener diferentes estructuras, ser más flexible
interface GeoJsonFeature {
  type: string;
  properties: {
    [key: string]: string | number | undefined;
    name?: string;
    NAME?: string;
    NAME_EN?: string;
    ADMIN?: string;
    CNTRY_NAME?: string;
    iso_a2?: string;
    ISO_A2?: string;
    iso_a3?: string;
    ISO_A3?: string;
    ISO3?: string;
  };
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  id?: string; // Algunos GeoJSON usan id directamente
}

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
const EUROPE_GEOJSON_URL = "/data/geo/europe.geojson";

// Paleta de colores para el mapa
const RED_PALETTE = {
  NULL: '#e0e0e0',
  MIN: '#fee5d9',
  LOW: '#fcae91',
  MID: '#fb6a4a',
  HIGH: '#de2d26',
  MAX: '#a50f15'
};

// Mapeo de ISO2 a ISO3 para países que puedan necesitarlo
const ISO2_TO_ISO3_MAP: Record<string, string> = {
  'AL': 'ALB', // Albania
  'AT': 'AUT', // Austria
  'BE': 'BEL', // Bélgica
  'BG': 'BGR', // Bulgaria
  'HR': 'HRV', // Croacia
  'CY': 'CYP', // Chipre
  'CZ': 'CZE', // República Checa
  'DK': 'DNK', // Dinamarca
  'EE': 'EST', // Estonia
  'FI': 'FIN', // Finlandia
  'FR': 'FRA', // Francia
  'DE': 'DEU', // Alemania
  'GR': 'GRC', // Grecia
  'HU': 'HUN', // Hungría
  'IS': 'ISL', // Islandia
  'IE': 'IRL', // Irlanda
  'IT': 'ITA', // Italia
  'LV': 'LVA', // Letonia
  'LT': 'LTU', // Lituania
  'LU': 'LUX', // Luxemburgo
  'MT': 'MLT', // Malta
  'NL': 'NLD', // Países Bajos
  'NO': 'NOR', // Noruega
  'PL': 'POL', // Polonia
  'PT': 'PRT', // Portugal
  'RO': 'ROU', // Rumanía
  'SK': 'SVK', // Eslovaquia
  'SI': 'SVN', // Eslovenia
  'ES': 'ESP', // España
  'SE': 'SWE', // Suecia
  'CH': 'CHE', // Suiza
  'GB': 'GBR', // Reino Unido
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
    between4: "2.5% - 3%"
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
    between4: "2.5% - 3%"
  }
};

// Función para normalizar nombres (elimina acentos y convierte a minúsculas)
const normalizeText = (text: string): string => {
  if (!text) return '';
  return text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Función para obtener el nombre del país del GeoJSON
const getCountryName = (feature: GeoJsonFeature): string => {
  const properties = feature.properties || {};
  
  // Buscar el nombre en diferentes propiedades posibles
  return (properties.name as string) || 
    (properties.NAME as string) || 
    (properties.NAME_EN as string) || 
    (properties.ADMIN as string) || 
    (properties.CNTRY_NAME as string) || 
    '';
};

// Función para obtener el código ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  // Primero intentamos obtener el ISO3 directamente
  const iso3 = feature.properties.iso_a3 || 
               feature.properties.ISO_A3 || 
               feature.properties.ISO3 || 
               '';
  
  if (iso3) return iso3 as string;
  
  // Si no hay ISO3 pero hay ISO2, intentamos convertirlo
  const iso2 = getCountryIso2(feature);
  if (iso2 && ISO2_TO_ISO3_MAP[iso2]) {
    return ISO2_TO_ISO3_MAP[iso2];
  }
  
  // Si todo falla, devolvemos una cadena vacía
  return '';
}

// Obtener código ISO2 del país
const getCountryIso2 = (feature: GeoJsonFeature): string => {
  const properties = feature.properties || {};
  
  return (properties.ISO_A2 as string) || 
    (properties.iso_a2 as string) || 
    (properties.ISO2 as string) || 
    '';
};

// Verificar si el sector del ítem coincide con el sector seleccionado
function normalizedSectorMatch(itemSector: string, selectedSector: string): boolean {
  const normalizedItemSector = normalizeText(itemSector || '');
  const normalizedSelectedSector = normalizeText(selectedSector);
  
  // Conversión de 'total' a 'all sectors' para compatibilidad
  const normalizedSelectedForCompare = 
    normalizedSelectedSector === 'total' ? 'all sectors' : normalizedSelectedSector;
  
  return normalizedItemSector === normalizedSelectedForCompare || 
         normalizedItemSector === 'all sectors' && normalizedSelectedSector === 'total';
}

// Función para obtener el valor de un país
function getCountryValue(
  countryFeature: GeoJsonFeature, 
  data: EuropeCSVData[], 
  selectedYear: number, 
  selectedSector: string
): number | null {
  if (!countryFeature || !data.length) return null;
  
  // Obtener nombre e ISO del país
  const countryName = getCountryName(countryFeature);
  const countryIso3 = getCountryIso3(countryFeature);
  
  // Intentar coincidencia por código ISO3 (prioridad)
  if (countryIso3) {
    const matchingEntries = data.filter(item => 
      item.ISO3 && 
      item.ISO3.toUpperCase() === countryIso3.toUpperCase() &&
      parseInt(item.Year) === selectedYear && 
      normalizedSectorMatch(item.Sector, selectedSector)
    );
    
    if (matchingEntries.length > 0) {
      const countryData = matchingEntries[0];
      // Intentar obtener el valor de diferentes columnas posibles
      const value = countryData['%GDP'] || countryData.Value || '';
      const parsedValue = parseFloat(value.replace(',', '.'));
      return isNaN(parsedValue) ? null : parsedValue;
    }
  }
  
  // Si no hay coincidencia por ISO, intentar por nombre
  const normalizedName = normalizeText(countryName);
  
  const countryData = data.find(item => {
    const itemCountry = normalizeText(item.Country);
    const matches = (
      itemCountry === normalizedName || 
      itemCountry.includes(normalizedName) || 
      normalizedName.includes(itemCountry)
    );
    
    return matches && 
           parseInt(item.Year) === selectedYear && 
           normalizedSectorMatch(item.Sector, selectedSector);
  });
  
  if (countryData) {
    // Intentar obtener el valor de diferentes columnas posibles
    const value = countryData['%GDP'] || countryData.Value || '';
    const parsedValue = parseFloat(value.replace(',', '.'));
    return isNaN(parsedValue) ? null : parsedValue;
  }
  
  return null;
}

// Función para determinar el color basado en el valor
function getColorByValue(value: number | null): string {
  if (value === null) return RED_PALETTE.NULL;
  
  // Valores estáticos de referencia para colorear
  if (value < 1) return RED_PALETTE.MIN;
  if (value < 1.5) return RED_PALETTE.LOW;
  if (value < 2) return RED_PALETTE.MID;
  if (value < 2.5) return RED_PALETTE.HIGH;
  return RED_PALETTE.MAX;
}

const EuropeanRDMap: React.FC<EuropeanRDMapProps> = ({ data, selectedYear, selectedSector, language, onClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({ country: '', value: null as number | null });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJsonData | null>(null);

  // Acceso a los textos localizados
  const t = mapTexts[language];

  // Obtener el nombre del sector según el idioma
  const getSectorName = () => {
    // Convertir el nombre del sector al ID
    const sectorMapping: Record<string, string> = {
      'All Sectors': 'total',
      'Business enterprise sector': 'business',
      'Government sector': 'government',
      'Higher education sector': 'education',
      'Private non-profit sector': 'nonprofit'
    };
    
    const sectorId = sectorMapping[selectedSector] || 'total';
    
    // Buscar el sector por ID y obtener el nombre traducido
    const sector = rdSectors.find(s => s.id === sectorId);
    if (!sector) return language === 'es' ? 'Todos los sectores' : 'All Sectors';
    
    return sector.name[language];
  };

  // Título del mapa según el idioma y el sector seleccionado
  const getMapTitle = () => {
    const sectorName = getSectorName();
    return language === 'es' 
      ? `Inversión en I+D por país - ${sectorName} (${selectedYear})`
      : `R&D Investment by Country - ${sectorName} (${selectedYear})`;
  };

  // Cargar el GeoJSON
  useEffect(() => {
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
  }, [t.error]);

  // Renderizar el mapa cuando los datos GeoJSON están disponibles
  useEffect(() => {
    if (!geojsonData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
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
    
    // Contar países coloreados para depuración
    let countriesWithData = 0;
    
    // Dibujar cada país
    mapGroup.selectAll('path')
      .data(geojsonData.features)
      .enter()
      .append('path')
      .attr('d', (d: any) => path(d))
      .attr('fill', (d: any) => {
        const feature = d as GeoJsonFeature;
        const value = getCountryValue(feature, data, selectedYear, selectedSector);
        
        // Si encontramos un valor, incrementamos el contador
        if (value !== null) {
          countriesWithData++;
        }
        
        return getColorByValue(value);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('class', 'country')
      .on('mouseover', (event: any, d: any) => {
        const feature = d as GeoJsonFeature;
        const countryName = getCountryName(feature);
        const value = getCountryValue(feature, data, selectedYear, selectedSector);
        
        setTooltipContent({ 
          country: countryName, 
          value 
        });
        setTooltipPosition({ 
          x: event.pageX, 
          y: event.pageY 
        });
        setTooltipVisible(true);
      })
      .on('mousemove', (event: any) => {
        setTooltipPosition({ 
          x: event.pageX, 
          y: event.pageY 
        });
      })
      .on('mouseout', () => {
        setTooltipVisible(false);
      })
      .on('click', (event: any, d: any) => {
        if (onClick) {
          const feature = d as GeoJsonFeature;
          onClick(getCountryName(feature));
        }
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
    
    legend.forEach((item, i) => {
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
  }, [geojsonData, data, selectedYear, selectedSector, language, onClick]);
  
  return (
    <div className="relative w-full h-full">
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
        <h3 className="text-lg font-semibold text-gray-800">
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
          className="fixed z-50 p-2 bg-white border border-gray-300 rounded shadow-md pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(10px, -100%)'
          }}
        >
          <p className="font-bold">{tooltipContent.country}</p>
          {tooltipContent.value !== null ? (
            <p>
              {t.rdInvestment}: <span className="font-semibold">{tooltipContent.value.toFixed(2)}% {t.ofGDP}</span>
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