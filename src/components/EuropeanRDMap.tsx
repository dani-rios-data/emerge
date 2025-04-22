import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import COLORS from '../utils/colors';
import { rdSectors } from '../data/rdInvestment';
import { useLanguage } from '../contexts/LanguageContext';

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
  'AD': 'AND', // Andorra
  'AT': 'AUT', // Austria
  'BY': 'BLR', // Bielorrusia
  'BE': 'BEL', // Bélgica
  'BA': 'BIH', // Bosnia y Herzegovina
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
  'LI': 'LIE', // Liechtenstein
  'LT': 'LTU', // Lituania
  'LU': 'LUX', // Luxemburgo
  'MT': 'MLT', // Malta
  'MD': 'MDA', // Moldavia
  'MC': 'MCO', // Mónaco
  'ME': 'MNE', // Montenegro
  'NL': 'NLD', // Países Bajos
  'MK': 'MKD', // Macedonia del Norte
  'NO': 'NOR', // Noruega
  'PL': 'POL', // Polonia
  'PT': 'PRT', // Portugal
  'RO': 'ROU', // Rumanía
  'RU': 'RUS', // Rusia
  'SM': 'SMR', // San Marino
  'RS': 'SRB', // Serbia
  'SK': 'SVK', // Eslovaquia
  'SI': 'SVN', // Eslovenia
  'ES': 'ESP', // España
  'SE': 'SWE', // Suecia
  'CH': 'CHE', // Suiza
  'UA': 'UKR', // Ucrania
  'GB': 'GBR', // Reino Unido
  'VA': 'VAT', // Ciudad del Vaticano
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

// Función para obtener el valor de un país usando código ISO3
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
  
  console.log(`Buscando datos para: ${countryName} | ISO3: ${countryIso3 || 'no disponible'} | Sector: ${selectedSector}`);
  
  // Intentar coincidencia por código ISO3 (prioridad)
  if (countryIso3) {
    // Mostrar todas las entradas con este ISO3 para depuración
    const entriesWithThisISO = data.filter(item => 
      item.ISO3 && item.ISO3.toUpperCase() === countryIso3.toUpperCase()
    );
    
    if (entriesWithThisISO.length > 0) {
      console.log(`Encontradas ${entriesWithThisISO.length} entradas con ISO3 ${countryIso3}`);
      
      // Verificar si tenemos el año correcto
      const hasSelectedYear = entriesWithThisISO.some(item => 
        item.Year === selectedYear.toString()
      );
      
      if (!hasSelectedYear) {
        console.log(`⚠️ No hay entradas para el año ${selectedYear} con ISO3 ${countryIso3}`);
        // Mostrar los años disponibles para este país
        const availableYears = [...new Set(entriesWithThisISO.map(item => item.Year))].sort();
        console.log(`Años disponibles para ${countryName}: ${availableYears.join(', ')}`);
      }
      
      // Filtrar por año y sector
      const matchingEntries = entriesWithThisISO.filter(item => {
        const yearMatch = parseInt(item.Year) === selectedYear;
        const sectorMatch = normalizedSectorMatch(item.Sector, selectedSector);
        
        if (yearMatch && !sectorMatch) {
          console.log(`⚠️ Año correcto (${selectedYear}) pero sector incorrecto para ${countryName}. Sector encontrado: "${item.Sector}", Sector buscado: "${selectedSector}"`);
        }
        
        return yearMatch && sectorMatch;
      });
      
      if (matchingEntries.length > 0) {
        const countryData = matchingEntries[0];
        // Intentar obtener el valor de diferentes columnas posibles
        const value = countryData.Value || countryData['%GDP'] || '';
        console.log(`✅ Coincidencia por ISO3: ${countryName} (${countryIso3}) -> Valor: ${value}`);
        
        // Mostrar todas las propiedades del objeto para depuración
        console.log("Propiedades completas del objeto:", countryData);
        
        const parsedValue = parseFloat(value);
        return isNaN(parsedValue) ? null : parsedValue;
      } else {
        console.log(`❌ Encontradas entradas con ISO3 ${countryIso3}, pero no para el año ${selectedYear} y sector "${selectedSector}"`);
      }
    } else {
      console.log(`❌ No se encontraron entradas con ISO3 ${countryIso3}`);
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
    
    const yearMatch = parseInt(item.Year) === selectedYear;
    const sectorMatch = normalizedSectorMatch(item.Sector, selectedSector);
    
    if (matches) {
      console.log(`Coincidencia por nombre entre "${countryName}" y "${item.Country}"`);
      
      if (!yearMatch) {
        console.log(`⚠️ Nombre coincide pero año incorrecto. Año encontrado: ${item.Year}, Año buscado: ${selectedYear}`);
      }
      
      if (!sectorMatch) {
        console.log(`⚠️ Nombre coincide pero sector incorrecto. Sector encontrado: "${item.Sector}", Sector buscado: "${selectedSector}"`);
      }
    }
    
    return matches && yearMatch && sectorMatch;
  });
  
  if (countryData) {
    // Intentar obtener el valor de diferentes columnas posibles
    const value = countryData.Value || countryData['%GDP'] || '';
    console.log(`✅ Coincidencia por nombre: ${countryName} -> ${countryData.Country}, valor: ${value}`);
    
    // Mostrar todas las propiedades del objeto para depuración
    console.log("Propiedades completas del objeto:", countryData);
    
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? null : parsedValue;
  }
  
  console.log(`❌ No se encontró coincidencia para ${countryName}`);
  return null;
}

// Verificar si el sector del ítem coincide con el sector seleccionado
function normalizedSectorMatch(itemSector: string, selectedSector: string): boolean {
  const normalizedItemSector = normalizeText(itemSector || '');
  const normalizedSelectedSector = normalizeText(selectedSector);
  
  // Conversión de 'total' a 'all sectors' para compatibilidad
  const normalizedSelectedForCompare = 
    normalizedSelectedSector === 'total' ? 'all sectors' : normalizedSelectedSector;
  
  const isMatch = 
    normalizedItemSector === normalizedSelectedForCompare || 
    normalizedItemSector === 'all sectors' && normalizedSelectedSector === 'total';
  
  // Mostrar depuración
  if (isMatch) {
    console.log(`✓ Coincidencia de sector: Item sector "${itemSector}" vs Selected sector "${selectedSector}"`);
  } else {
    console.log(`✗ No coincide sector: Item sector "${itemSector}" vs Selected sector "${selectedSector}"`);
  }
                 
  return isMatch;
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
  const { t } = useLanguage();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({ country: '', value: null as number | null });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJsonData | null>(null);

  // Obtener el nombre del sector según el idioma
  const getSectorName = () => {
    // Si es "All Sectors", traducir según el idioma
    if (selectedSector === 'All Sectors') {
      return language === 'es' ? 'Todos los sectores' : 'All Sectors';
    }
    return selectedSector;
  };

  // Título del mapa según el idioma y el sector seleccionado
  const getMapTitle = () => {
    return t('investmentMapTitle');
  };

  // Depurar los países disponibles en los datos
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("Estructura de datos completa:");
      
      // Obtener las claves del primer objeto
      const firstItem = data[0];
      const keys = Object.keys(firstItem);
      
      console.log("Estructura del objeto de datos:");
      console.log("Claves disponibles:", keys);
      
      // Verificar columnas específicas importantes
      console.log("Columna ISO3 presente:", keys.includes("ISO3"));
      console.log("Columna Value presente:", keys.includes("Value"));
      console.log("Columna %GDP presente:", keys.includes("%GDP"));
      console.log("Columna Year presente:", keys.includes("Year"));
      console.log("Columna Sector presente:", keys.includes("Sector"));
      
      // Mostrar algunos ejemplos para cada columna importante
      if (keys.includes("Year")) {
        const uniqueYears = [...new Set(data.map(item => item.Year))].sort();
        console.log("Años disponibles:", uniqueYears);
      }
      
      if (keys.includes("Sector")) {
        const uniqueSectors = [...new Set(data.map(item => item.Sector))];
        console.log("Sectores disponibles:", uniqueSectors);
      }
      
      // Contar entradas para el año y sector seleccionados
      const entriesForSelection = data.filter(item => 
        parseInt(item.Year) === selectedYear && 
        normalizedSectorMatch(item.Sector, selectedSector)
      );
      
      console.log(`Entradas para año ${selectedYear} y sector "${selectedSector}": ${entriesForSelection.length}`);
      
      if (entriesForSelection.length === 0) {
        console.warn(`⚠️ No hay datos para el año ${selectedYear} y sector "${selectedSector}"`);
        
        // Mostrar años y sectores disponibles
        const uniqueYears = [...new Set(data.map(item => item.Year))].sort();
        console.log(`Años disponibles: ${uniqueYears.join(', ')}`);
        
        const uniqueSectors = [...new Set(data.map(item => item.Sector))];
        console.log(`Sectores disponibles: ${uniqueSectors.join(', ')}`);
      } else {
        // Mostrar todos los países con datos para el año y sector seleccionados
        const countriesWithData = entriesForSelection.map(item => item.Country);
        console.log(`Países con datos para año ${selectedYear} y sector "${selectedSector}":`, countriesWithData);
      }
    }
  }, [data, selectedYear, selectedSector]);

  // Cargar el GeoJSON
  useEffect(() => {
    setLoading(true);
    fetch('/data/geo/europe.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el mapa');
        }
        return response.json();
      })
      .then(geoJsonData => {
        setGeojsonData(geoJsonData);
        
        // Depurar el GeoJSON en profundidad
        if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
          console.log(`GeoJSON cargado con ${geoJsonData.features.length} países`);
          
          // Examinar estructura completa del primer país para entender el formato
          console.log("Estructura completa del primer país en el GeoJSON:", geoJsonData.features[0]);
          
          // Examinar propiedades de los primeros 5 países
          const sampleFeatures = geoJsonData.features.slice(0, 5);
          console.log("Nombres de los primeros 5 países en el GeoJSON:");
          
          sampleFeatures.forEach((feature: GeoJsonFeature, index: number) => {
            const countryName = getCountryName(feature);
            const countryIso2 = getCountryIso2(feature);
            const countryIso3 = getCountryIso3(feature);
            console.log(`País ${index + 1}: ${countryName} (ISO2: ${countryIso2 || 'N/A'}, ISO3: ${countryIso3 || 'N/A'})`);
          });
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando el mapa:', err);
        setError('Error al cargar el mapa de Europa');
        setLoading(false);
      });
  }, []);

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
      .attr('d', d => path(d as d3.GeoPermissibleObjects))
      .attr('fill', (d: GeoJsonFeature) => {
        const value = getCountryValue(d, data, selectedYear, selectedSector);
        
        // Si encontramos un valor, incrementamos el contador
        if (value !== null) {
          countriesWithData++;
        }
        
        return getColorByValue(value);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('class', 'country')
      .on('mouseover', (event, d: GeoJsonFeature) => {
        const countryName = getCountryName(d);
        const value = getCountryValue(d, data, selectedYear, selectedSector);
        
        setTooltipContent({ 
          country: countryName, 
          value 
        });
        setTooltipPosition({ 
          x: event.clientX, 
          y: event.clientY 
        });
        setTooltipVisible(true);
      })
      .on('mousemove', (event) => {
        setTooltipPosition({ 
          x: event.clientX, 
          y: event.clientY 
        });
      })
      .on('mouseout', () => {
        setTooltipVisible(false);
      })
      .on('click', (event, d: GeoJsonFeature) => {
        if (onClick) {
          onClick(getCountryName(d));
        }
      })
      .style('cursor', onClick ? 'pointer' : 'default');
    
    // Mostrar estadísticas de coincidencia
    console.log(`Total de países coloreados: ${countriesWithData}/${geojsonData.features.length}`);
    
    // Añadir leyenda
    const legendGroup = svg.append('g')
      .attr('transform', `translate(20, ${height - 150})`);
    
    const legend = [
      { color: RED_PALETTE.MIN, label: '< 1%' },
      { color: RED_PALETTE.LOW, label: '1% - 1.5%' },
      { color: RED_PALETTE.MID, label: '1.5% - 2%' },
      { color: RED_PALETTE.HIGH, label: '2% - 2.5%' },
      { color: RED_PALETTE.MAX, label: '2.5% - 3%' },
      { color: RED_PALETTE.NULL, label: t('noData') }
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
  }, [geojsonData, data, selectedYear, selectedSector, language, onClick, t]);
  
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-gray-600">
            {t('loadingMap')}
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
              {t('rdInvestment')}: <span className="font-semibold">{tooltipContent.value.toFixed(2)}% {t('ofGDP')}</span>
            </p>
          ) : (
            <p>{t('noData')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EuropeanRDMap;