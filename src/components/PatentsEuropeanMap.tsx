import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';
// Importar las funciones de mapeo de países
import { getIso3FromCountryName, isSupranationalEntity as isSupranationalFromMapping } from '../utils/countryMapping';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';

// Versión simplificada del componente

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Definir la interfaz para los datos de entrada (usando datos de investigadores)
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
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

interface PatentsEuropeanMapProps {
  data: ResearchersData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

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
  return (
    props.NAME ||
    props.NAME_EN ||
    props.ADMIN ||
    props.CNTRY_NAME ||
    props.name ||
    'Desconocido'
  ) as string;
}

// Función para obtener el código ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  
  // Obtener el nombre del país
  const countryName = getCountryName(feature);
  
  // Usar el nuevo sistema de mapeo para obtener el ISO3
  const iso3FromMapping = getIso3FromCountryName(countryName);
  if (iso3FromMapping) {
    return iso3FromMapping;
  }
  
  // Como fallback, intentar obtener el código ISO3 de diferentes propiedades posibles
  return (props.ISO3 || props.iso_a3 || props.ADM0_A3 || '') as string;
}

// Función para verificar si una entidad es UE o zona euro (no un país)
function isSupranationalEntity(name: string | undefined): boolean {
  if (!name) return false;
  return isSupranationalFromMapping(name);
}



// Función para obtener el valor de la UE
function getEUValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  const euData = data.filter(item => {
    const isEU = item.geo === 'EU27_2020';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    let sectorMatch = false;
    if (sector === 'All Sectors' || sector === 'total') {
      sectorMatch = item.sectperf === 'TOTAL';
    } else if (sector === 'Business enterprise sector' || sector === 'business') {
      sectorMatch = item.sectperf === 'BES';
    } else if (sector === 'Government sector' || sector === 'government') {
      sectorMatch = item.sectperf === 'GOV';
    } else if (sector === 'Higher education sector' || sector === 'education') {
      sectorMatch = item.sectperf === 'HES';
    } else if (sector === 'Private non-profit sector' || sector === 'nonprofit') {
      sectorMatch = item.sectperf === 'PNP';
    }
    
    return isEU && yearMatch && sectorMatch;
  });
  
  if (euData.length > 0 && euData[0].OBS_VALUE) {
    return parseFloat(euData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para obtener el valor para España
function getSpainValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  const spainData = data.filter(item => {
    const isSpain = item.geo === 'ES';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    let sectorMatch = false;
    if (sector === 'All Sectors' || sector === 'total') {
      sectorMatch = item.sectperf === 'TOTAL';
    } else if (sector === 'Business enterprise sector' || sector === 'business') {
      sectorMatch = item.sectperf === 'BES';
    } else if (sector === 'Government sector' || sector === 'government') {
      sectorMatch = item.sectperf === 'GOV';
    } else if (sector === 'Higher education sector' || sector === 'education') {
      sectorMatch = item.sectperf === 'HES';
    } else if (sector === 'Private non-profit sector' || sector === 'nonprofit') {
      sectorMatch = item.sectperf === 'PNP';
    }
    
    return isSpain && yearMatch && sectorMatch;
  });
  
  if (spainData.length > 0 && spainData[0].OBS_VALUE) {
    return parseFloat(spainData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para obtener el valor del año anterior con mejor manejo del sector y búsqueda más exhaustiva
function getPreviousYearValue(
  data: ResearchersData[],
  countryCode: string | undefined,
  year: number,
  sector: string
): number | null {
  if (!data || data.length === 0 || !countryCode || year <= 1) {
    console.log(`[Patents YoY Debug] Retornando null - Condiciones iniciales no cumplidas: data=${!!data}, countryCode=${countryCode}, year=${year}`);
    return null;
  }
  
  const previousYear = year - 1;
  console.log(`[Patents YoY Debug] Buscando datos para país=${countryCode}, año anterior=${previousYear}, sector=${sector}`);
  
  // Normalizar el sector seleccionado para mejorar las coincidencias
  let normalizedSector = sector.toLowerCase();
  if (normalizedSector === 'all sectors' || normalizedSector === 'all' || normalizedSector === 'total') {
    normalizedSector = 'total';
  } else if (normalizedSector === 'business enterprise sector' || normalizedSector === 'bes') {
    normalizedSector = 'business';
  } else if (normalizedSector === 'government sector' || normalizedSector === 'gov') {
    normalizedSector = 'government';
  } else if (normalizedSector === 'higher education sector' || normalizedSector === 'hes') {
    normalizedSector = 'education';
  } else if (normalizedSector === 'private non-profit sector' || normalizedSector === 'pnp') {
    normalizedSector = 'nonprofit';
  }
  
  // Crear un array de posibles códigos alternativos para el país
  const possibleCodes = [countryCode];
  
  // Códigos ISO mapeados más comunes
  const codeMapping: Record<string, string[]> = {
    'GRC': ['EL', 'GR'],
    'GBR': ['UK', 'GB'],
    'DEU': ['DE'],
    'FRA': ['FR'],
    'ESP': ['ES'],
    'ITA': ['IT'],
    'CZE': ['CZ'],
    'SWE': ['SE'],
    'DNK': ['DK'],
    'FIN': ['FI'],
    'AUT': ['AT'],
    'BEL': ['BE'],
    'BGR': ['BG'],
    'HRV': ['HR'],
    'CYP': ['CY'],
    'EST': ['EE'],
    'HUN': ['HU'],
    'IRL': ['IE'],
    'LVA': ['LV'],
    'LTU': ['LT'],
    'LUX': ['LU'],
    'MLT': ['MT'],
    'NLD': ['NL'],
    'POL': ['PL'],
    'PRT': ['PT'],
    'ROU': ['RO'],
    'SVK': ['SK'],
    'SVN': ['SI'],
    'CHE': ['CH'],
    'NOR': ['NO'],
    'ISL': ['IS'],
    'TUR': ['TR'],
    'MKD': ['MK'],
    'SRB': ['RS'],
    'MNE': ['ME'],
    'ALB': ['AL'],
    'BIH': ['BA'],
    'UKR': ['UA'],
    'RUS': ['RU']
  };

  // Mapeo inverso - ISO2 a ISO3
  const codeMapping2to3: Record<string, string> = {
    'EL': 'GRC',
    'UK': 'GBR',
    'GB': 'GBR',
    'DE': 'DEU',
    'FR': 'FRA',
    'ES': 'ESP',
    'IT': 'ITA',
    'CZ': 'CZE',
    'SE': 'SWE',
    'DK': 'DNK',
    'FI': 'FIN',
    'AT': 'AUT',
    'BE': 'BEL',
    'BG': 'BGR',
    'HR': 'HRV',
    'CY': 'CYP',
    'EE': 'EST',
    'HU': 'HUN',
    'IE': 'IRL',
    'LV': 'LVA',
    'LT': 'LTU',
    'LU': 'LUX',
    'MT': 'MLT',
    'NL': 'NLD',
    'PL': 'POL',
    'PT': 'PRT',
    'RO': 'ROU',
    'SK': 'SVK',
    'SI': 'SVN',
    'CH': 'CHE',
    'NO': 'NOR',
    'IS': 'ISL',
    'TR': 'TUR',
    'MK': 'MKD',
    'RS': 'SRB',
    'ME': 'MNE',
    'AL': 'ALB',
    'BA': 'BIH',
    'UA': 'UKR',
    'RU': 'RUS'
  };
  
  // Añadir códigos alternativos del mapeo
  if (countryCode.length === 3 && countryCode in codeMapping) {
    possibleCodes.push(...codeMapping[countryCode]);
  } else if (countryCode.length === 2 && countryCode in codeMapping2to3) {
    possibleCodes.push(codeMapping2to3[countryCode]);
  }
  
  console.log(`[Patents YoY Debug] Códigos de país a buscar: ${possibleCodes.join(', ')}`);
  
  // Buscar datos del año anterior utilizando todos los códigos alternativos
  for (const code of possibleCodes) {
    // Buscar los datos del país para el año anterior
    const prevYearData = data.filter(item => {
      // Comprobar si el código geo coincide
      const geoMatch = item.geo === code;
      const yearMatch = parseInt(item.TIME_PERIOD) === previousYear;
      
      // Normalizar el sector para manejar diferentes valores
      let sectorMatch = false;
      if (normalizedSector === 'total') {
        sectorMatch = item.sectperf === 'TOTAL';
      } else if (normalizedSector === 'business') {
        sectorMatch = item.sectperf === 'BES';
      } else if (normalizedSector === 'government') {
        sectorMatch = item.sectperf === 'GOV';
      } else if (normalizedSector === 'education') {
        sectorMatch = item.sectperf === 'HES';
      } else if (normalizedSector === 'nonprofit') {
        sectorMatch = item.sectperf === 'PNP';
      }
      
      // Depuración detallada para diagnóstico
      if (geoMatch) {
        console.log(`[Patents YoY Debug] Encontrada coincidencia geo=${item.geo}, año=${item.TIME_PERIOD}, sector=${item.sectperf}, yearMatch=${yearMatch}, sectorMatch=${sectorMatch}`);
      }
      
      return geoMatch && yearMatch && sectorMatch;
    });
    
    console.log(`[Patents YoY Debug] Resultados encontrados para código ${code}: ${prevYearData.length}`);
    
    // Usar el primer resultado que coincida
    if (prevYearData.length > 0 && prevYearData[0].OBS_VALUE) {
      const prevValue = parseFloat(prevYearData[0].OBS_VALUE);
      console.log(`[Patents YoY Debug] Valor del año anterior encontrado: ${prevValue}`);
      return prevValue;
    }
  }
  
  console.log('[Patents YoY Debug] No se encontró valor para el año anterior');
  return null;
}

// Función para obtener la descripción de las etiquetas
function getLabelDescription(label: string, language: 'es' | 'en'): string {
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
  
  return label in labelDescriptions 
    ? labelDescriptions[label][language] 
    : language === 'es' ? 'Desconocido' : 'Unknown';
}

// Formatear números completos con separador de miles
function formatNumberComplete(value: number, decimals: number = 0, lang: 'es' | 'en' = 'es'): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Mapeo de códigos de país a nombres en español e inglés
const countryCodeMapping: Record<string, {es: string, en: string}> = {
  'AT': {es: 'Austria', en: 'Austria'},
  'BE': {es: 'Bélgica', en: 'Belgium'},
  'BG': {es: 'Bulgaria', en: 'Bulgaria'},
  'CY': {es: 'Chipre', en: 'Cyprus'},
  'CZ': {es: 'República Checa', en: 'Czech Republic'},
  'DE': {es: 'Alemania', en: 'Germany'},
  'DK': {es: 'Dinamarca', en: 'Denmark'},
  'EE': {es: 'Estonia', en: 'Estonia'},
  'EL': {es: 'Grecia', en: 'Greece'},
  'ES': {es: 'España', en: 'Spain'},
  'FI': {es: 'Finlandia', en: 'Finland'},
  'FR': {es: 'Francia', en: 'France'},
  'HR': {es: 'Croacia', en: 'Croatia'},
  'HU': {es: 'Hungría', en: 'Hungary'},
  'IE': {es: 'Irlanda', en: 'Ireland'},
  'IT': {es: 'Italia', en: 'Italy'},
  'LT': {es: 'Lituania', en: 'Lithuania'},
  'LU': {es: 'Luxemburgo', en: 'Luxembourg'},
  'LV': {es: 'Letonia', en: 'Latvia'},
  'MT': {es: 'Malta', en: 'Malta'},
  'NL': {es: 'Países Bajos', en: 'Netherlands'},
  'PL': {es: 'Polonia', en: 'Poland'},
  'PT': {es: 'Portugal', en: 'Portugal'},
  'RO': {es: 'Rumanía', en: 'Romania'},
  'SE': {es: 'Suecia', en: 'Sweden'},
  'SI': {es: 'Eslovenia', en: 'Slovenia'},
  'SK': {es: 'Eslovaquia', en: 'Slovakia'},
  'UK': {es: 'Reino Unido', en: 'United Kingdom'},
  'EU27_2020': {es: 'Unión Europea (27)', en: 'European Union (27)'},
  'EA19': {es: 'Zona Euro (19)', en: 'Euro Area (19)'},
  'EA20': {es: 'Zona Euro (20)', en: 'Euro Area (20)'},
  'NO': {es: 'Noruega', en: 'Norway'},
  'CH': {es: 'Suiza', en: 'Switzerland'},
  'IS': {es: 'Islandia', en: 'Iceland'},
  'TR': {es: 'Turquía', en: 'Turkey'},
  'ME': {es: 'Montenegro', en: 'Montenegro'},
  'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'MKD': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'AL': {es: 'Albania', en: 'Albania'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'SRB': {es: 'Serbia', en: 'Serbia'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'BIH': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'MDA': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'UKR': {es: 'Ucrania', en: 'Ukraine'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'XKX': {es: 'Kosovo', en: 'Kosovo'},
  'RU': {es: 'Rusia', en: 'Russia'},
  'RUS': {es: 'Rusia', en: 'Russia'},
  'JP': {es: 'Japón', en: 'Japan'},
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'},
  'MNE': {es: 'Montenegro', en: 'Montenegro'}
};



// Variables simplificadas eliminadas para esta versión básica

// Definir colores específicos para los componentes de patentes - Paleta de innovación y tecnología
const PATENTS_SECTOR_COLORS = {
  total: '#2E7D32',        // Verde tecnológico para el total (representa innovación sostenible)
  business: '#FF6F00',     // Naranja vibrante para empresas (representa emprendimiento e innovación corporativa)
  government: '#1565C0',   // Azul institucional para gobierno (representa políticas de innovación)
  education: '#7B1FA2',    // Púrpura para educación (representa investigación académica avanzada)
  nonprofit: '#D32F2F'     // Rojo para organizaciones sin fines de lucro (representa impacto social)
};

// Textos localizados para el mapa
const mapTexts = {
  es: {
    title: "Patentes por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    researchers: "Patentes",
    fullTimeEquivalent: "ETC (Equivalente Tiempo Completo)",
    sector_business: "Empresas",
    sector_government: "Gobierno",
    sector_education: "Educación superior",
    sector_nonprofit: "Organizaciones sin ánimo de lucro",
    sector_total: "Todos los sectores",
    researchersByCountry: "Patentes por país"
  },
  en: {
    title: "Patents by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    researchers: "Patents",
    fullTimeEquivalent: "FTE (Full-Time Equivalent)",
    sector_business: "Business enterprise",
    sector_government: "Government",
    sector_education: "Higher education",
    sector_nonprofit: "Private non-profit",
    sector_total: "All sectors",
    researchersByCountry: "Patents by Country"
  }
};

// Funciones auxiliares simplificadas (no utilizadas en esta versión básica)

const PatentsEuropeanMap: React.FC<PatentsEuropeanMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = mapTexts[language];

  // Diagnóstico inicial para ver la estructura de datos
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("[Patents Map Data Debug] Estructura de datos total:", data.length, "registros");
      console.log("[Patents Map Data Debug] Ejemplo de estructura de datos:", data[0]);
      
      // Verificar años disponibles
      const availableYears = Array.from(new Set(data.map(item => item.TIME_PERIOD))).sort();
      console.log("[Patents Map Data Debug] Años disponibles:", availableYears);
      
      // Verificar sectores disponibles
      const availableSectors = Array.from(new Set(data.map(item => item.sectperf)));
      console.log("[Patents Map Data Debug] Sectores disponibles:", availableSectors);
      
      // Verificar países disponibles
      const availableCountries = Array.from(new Set(data.map(item => item.geo))).sort();
      console.log("[Patents Map Data Debug] Países disponibles:", availableCountries.slice(0, 10), "... (primeros 10)");
      
      // Filtrar datos para el año y sector actuales
      const currentData = data.filter(item => 
        parseInt(item.TIME_PERIOD) === selectedYear && 
        item.sectperf === (selectedSector === 'TOTAL' ? 'TOTAL' : selectedSector)
      );
      console.log("[Patents Map Data Debug] Datos para año actual", selectedYear, "y sector", selectedSector, ":", currentData.length, "registros");
      
      if (currentData.length > 0) {
        console.log("[Patents Map Data Debug] Ejemplos de datos actuales:", currentData.slice(0, 5));
      } else {
        console.warn("[Patents Map Data Debug] ⚠️  NO HAY DATOS para el año", selectedYear, "y sector", selectedSector);
        
        // Buscar cuál es el año más reciente disponible
        const allYears = Array.from(new Set(data.map(item => parseInt(item.TIME_PERIOD)))).sort((a, b) => b - a);
        console.log("[Patents Map Data Debug] Años disponibles en orden:", allYears);
        
        if (allYears.length > 0) {
          const latestYear = allYears[0];
          const latestYearData = data.filter(item => 
            parseInt(item.TIME_PERIOD) === latestYear && 
            item.sectperf === (selectedSector === 'TOTAL' ? 'TOTAL' : selectedSector)
          );
          console.log("[Patents Map Data Debug] Datos para el año más reciente", latestYear, ":", latestYearData.length, "registros");
        }
      }
    } else {
      console.log("[Patents Map Data Debug] No hay datos disponibles");
    }
  }, [data, selectedYear, selectedSector]);

  // Obtener título del mapa
  const getMapTitle = (): string => {
    return t.researchersByCountry;
  };
  
  // Obtener texto del sector
  const getSectorText = (): string => {
    switch(selectedSector) {
      case 'business':
      case 'Business enterprise sector':
      case 'BES':
        return t.sector_business;
      case 'government':
      case 'Government sector':
      case 'GOV':
        return t.sector_government;
      case 'education':
      case 'Higher education sector':
      case 'HES':
        return t.sector_education;
      case 'nonprofit':
      case 'Private non-profit sector':
      case 'PNP':
        return t.sector_nonprofit;
      default:
        return t.sector_total;
    }
  };
  
  // Obtener color del sector para el título
  const getSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a ids
    if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total' || normalizedId === 'TOTAL') 
      normalizedId = 'total';
    if (normalizedId === 'business enterprise sector' || normalizedId === 'bes') 
      normalizedId = 'business';
    if (normalizedId === 'government sector' || normalizedId === 'gov') 
      normalizedId = 'government';
    if (normalizedId === 'higher education sector' || normalizedId === 'hes') 
      normalizedId = 'education';
    if (normalizedId === 'private non-profit sector' || normalizedId === 'pnp') 
      normalizedId = 'nonprofit';
    
    // Obtener color del sector usando los colores de patentes
    const baseColor = PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(baseColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Cargar datos GeoJSON
  useEffect(() => {
    const fetchMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(EUROPE_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const geoJsonData = await response.json();
        setGeoData(geoJsonData);
      } catch (err) {
        console.error('Error loading map:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, [t.error]);

  // Función para obtener el valor de un país desde los datos
  const getCountryValue = (feature: GeoJsonFeature): number | null => {
    if (!data || data.length === 0) {
      console.log("[Patents Map Debug] No hay datos disponibles");
      return null;
    }
    
    // Obtener códigos del país desde el feature
    const props = feature.properties || {};
    const countryName = (props.NAME || props.NAME_EN || props.ADMIN || props.CNTRY_NAME || '') as string;
    
    // Debug: Ver todas las propiedades disponibles
    console.log(`[Patents Map Debug] Propiedades disponibles para ${countryName}:`, Object.keys(props));
    console.log(`[Patents Map Debug] Todas las propiedades:`, props);
    
    // Intentar múltiples formas de obtener ISO codes
    const iso3 = props.iso_a3 || props.ISO3 || props.ADM0_A3 || props.ISO_A3 || props.adm0_a3;
    const iso2 = props.iso_a2 || props.ISO2 || props.ISO_A2 || props.adm0_a2;
    
    console.log(`[Patents Map Debug] Procesando país: ${countryName}, ISO3: ${iso3}, ISO2: ${iso2}`);
    
    // Mapeo especial para códigos que no coinciden directamente
    const codeMapping: Record<string, string[]> = {
      'GRC': ['EL'],
      'GBR': ['UK'],
      'DEU': ['DE'],
      'FRA': ['FR'],
      'ESP': ['ES'],
      'ITA': ['IT'],
      'CZE': ['CZ'],
      'SWE': ['SE'],
      'DNK': ['DK'],
      'FIN': ['FI'],
      'AUT': ['AT'],
      'BEL': ['BE'],
      'BGR': ['BG'],
      'HRV': ['HR'],
      'CYP': ['CY'],
      'EST': ['EE'],
      'HUN': ['HU'],
      'IRL': ['IE'],
      'LVA': ['LV'],
      'LTU': ['LT'],
      'LUX': ['LU'],
      'MLT': ['MT'],
      'NLD': ['NL'],
      'POL': ['PL'],
      'PRT': ['PT'],
      'ROU': ['RO'],
      'SVK': ['SK'],
      'SVN': ['SI'],
      'CHE': ['CH'],
      'NOR': ['NO'],
      'ISL': ['IS'],
      'TUR': ['TR'],
      'MKD': ['MK'],
      'RUS': ['RU'],
      'SRB': ['RS'],
      'MNE': ['ME'],
      'ALB': ['AL'],
      'BIH': ['BA'],
      'XKX': ['XK']
    };
    
    // Lista de posibles códigos a buscar
    const possibleCodes = [iso3, iso2].filter(code => code && code !== 'undefined');
    
    // Añadir códigos alternativos del mapeo
    if (iso3 && iso3 in codeMapping) {
      possibleCodes.push(...codeMapping[iso3]);
    }
    
    // Mapeo directo por nombre de país cuando no tenemos códigos ISO
    const countryNameMapping: Record<string, string[]> = {
      'Spain': ['ES', 'ESP'],
      'France': ['FR', 'FRA'],
      'Germany': ['DE', 'DEU'],
      'Italy': ['IT', 'ITA'],
      'United Kingdom': ['UK', 'GBR'],
      'Poland': ['PL', 'POL'],
      'Netherlands': ['NL', 'NLD'],
      'Belgium': ['BE', 'BEL'],
      'Portugal': ['PT', 'PRT'],
      'Greece': ['EL', 'GRC'],
      'Sweden': ['SE', 'SWE'],
      'Austria': ['AT', 'AUT'],
      'Switzerland': ['CH', 'CHE'],
      'Norway': ['NO', 'NOR'],
      'Denmark': ['DK', 'DNK'],
      'Finland': ['FI', 'FIN'],
      'Ireland': ['IE', 'IRL'],
      'Czech Republic': ['CZ', 'CZE'],
      'Hungary': ['HU', 'HUN'],
      'Slovakia': ['SK', 'SVK'],
      'Slovenia': ['SI', 'SVN'],
      'Estonia': ['EE', 'EST'],
      'Latvia': ['LV', 'LVA'],
      'Lithuania': ['LT', 'LTU'],
      'Luxembourg': ['LU', 'LUX'],
      'Malta': ['MT', 'MLT'],
      'Cyprus': ['CY', 'CYP'],
      'Croatia': ['HR', 'HRV'],
      'Bulgaria': ['BG', 'BGR'],
      'Romania': ['RO', 'ROU'],
      'Turkey': ['TR', 'TUR'],
      'Serbia': ['RS', 'SRB'],
      'Ukraine': ['UA', 'UKR'],
      'Russia': ['RU', 'RUS'],
      'Republic of Moldova': ['MD', 'MDA']
    };
    
    // Si no tenemos códigos ISO, buscar por nombre
    if (possibleCodes.length === 0 && countryName && countryNameMapping[countryName]) {
      possibleCodes.push(...countryNameMapping[countryName]);
    }
    
    console.log(`[Patents Map Debug] Códigos a buscar para ${countryName}: ${possibleCodes.join(', ')}`);
    
    // Normalizar el sector seleccionado
    let sectorCode = 'TOTAL';
    if (selectedSector === 'BES' || selectedSector === 'business') sectorCode = 'BES';
    else if (selectedSector === 'GOV' || selectedSector === 'government') sectorCode = 'GOV';
    else if (selectedSector === 'HES' || selectedSector === 'education') sectorCode = 'HES';
    else if (selectedSector === 'PNP' || selectedSector === 'nonprofit') sectorCode = 'PNP';
    
    console.log(`[Patents Map Debug] Sector normalizado: ${selectedSector} -> ${sectorCode}`);
    
    // Buscar los datos para cualquiera de los posibles códigos
    console.log(`[Patents Map Debug] Buscando datos para año: ${selectedYear}, sector: ${sectorCode}`);
    
    const countryData = data.find(item => {
      const geoMatch = possibleCodes.some(code => item.geo === code);
      const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
      const sectorMatch = item.sectperf === sectorCode;
      
      // Debug para matches encontrados
      if (geoMatch) {
        console.log(`[Patents Map Debug] Match encontrado para ${item.geo}: yearMatch=${yearMatch}, sectorMatch=${sectorMatch}, TIME_PERIOD=${item.TIME_PERIOD}, sectperf=${item.sectperf}, OBS_VALUE=${item.OBS_VALUE}`);
      }
      
      return geoMatch && yearMatch && sectorMatch;
    });
    
    if (countryData && countryData.OBS_VALUE) {
      const value = parseFloat(countryData.OBS_VALUE);
      console.log(`[Patents Map Debug] Valor encontrado para ${countryName}: ${value}`);
      return value;
    }
    
    console.log(`[Patents Map Debug] No se encontraron datos para ${countryName}`);
    return null;
  };

  // Función para obtener el color según el valor
  const getColorForValue = (value: number | null): string => {
    console.log(`[Patents Map Debug] Calculando color para valor: ${value}`);
    
    if (value === null) {
      console.log(`[Patents Map Debug] Valor null, retornando gris claro`);
      return '#f5f5f5'; // Gris claro para valores nulos
    }
    if (value === 0) {
      console.log(`[Patents Map Debug] Valor 0, retornando naranja`);
      return '#ff9800'; // Naranja para valores cero
    }
    
    // Obtener todos los valores para calcular rangos
    const allValues: number[] = [];
    if (geoData) {
      geoData.features.forEach(feature => {
        const val = getCountryValue(feature);
        if (val !== null && val > 0) {
          allValues.push(val);
        }
      });
    }
    
    console.log(`[Patents Map Debug] Valores para cálculo de rangos: ${allValues.length} países con datos`);
    
    if (allValues.length === 0) {
      console.log(`[Patents Map Debug] No hay valores para calcular rangos, retornando gris`);
      return '#e0e0e0';
    }
    
    // Ordenar valores para calcular cuartiles
    allValues.sort((a, b) => a - b);
    
    // Calcular cuartiles
    const q1 = allValues[Math.floor(allValues.length * 0.25)];
    const q2 = allValues[Math.floor(allValues.length * 0.5)];
    const q3 = allValues[Math.floor(allValues.length * 0.75)];
    
    console.log(`[Patents Map Debug] Cuartiles calculados: Q1=${q1}, Q2=${q2}, Q3=${q3}`);
    console.log(`[Patents Map Debug] Rango de valores: ${allValues[0]} - ${allValues[allValues.length - 1]}`);
    
    // Obtener color base del sector
    let normalizedId = selectedSector.toLowerCase();
    if (normalizedId === 'total' || normalizedId === 'TOTAL') normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business') normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government') normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education') normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit') normalizedId = 'nonprofit';
    
    const baseColor = PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
    console.log(`[Patents Map Debug] Color base del sector ${normalizedId}: ${baseColor}`);
    
    // Asignar colores basados en cuartiles
    let finalColor = '';
    if (value <= q1) {
      finalColor = d3.color(baseColor)?.brighter(1.5)?.toString() || '#e0e0e0';
      console.log(`[Patents Map Debug] Valor ${value} <= Q1, color: ${finalColor}`);
    } else if (value <= q2) {
      finalColor = d3.color(baseColor)?.brighter(0.8)?.toString() || '#d0d0d0';
      console.log(`[Patents Map Debug] Valor ${value} <= Q2, color: ${finalColor}`);
    } else if (value <= q3) {
      finalColor = baseColor;
      console.log(`[Patents Map Debug] Valor ${value} <= Q3, color: ${finalColor}`);
    } else {
      finalColor = d3.color(baseColor)?.darker(0.8)?.toString() || '#606060';
      console.log(`[Patents Map Debug] Valor ${value} > Q3, color: ${finalColor}`);
    }
    
    return finalColor;
  };

  // Referencias para el tooltip
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Añadir estilos CSS para el tooltip
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'tooltip-patents-map-styles';
    
    // Definir estilos CSS para el tooltip
    styleElement.textContent = `
      .patents-tooltip {
        transform-origin: top left;
        transform: scale(0.95);
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        opacity: 0;
        z-index: 9999;
        pointer-events: none;
        position: fixed;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border-radius: 8px;
      }
      .patents-tooltip.visible {
        opacity: 1 !important;
        transform: scale(1);
      }
      .patents-tooltip .text-green-600 { color: #059669; }
      .patents-tooltip .text-red-600 { color: #DC2626; }
      .patents-tooltip .bg-green-50 { background-color: #ECFDF5; }
      .patents-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
      .patents-tooltip .border-green-100 { border-color: #DCFCE7; }
      .patents-tooltip .border-gray-100 { border-color: #F3F4F6; }
      .patents-tooltip .text-gray-500 { color: #6B7280; }
      .patents-tooltip .text-green-700 { color: #15803D; }
      .patents-tooltip .text-gray-800 { color: #1F2937; }
      .patents-tooltip .text-gray-600 { color: #4B5563; }
      .patents-tooltip .text-gray-400 { color: #9CA3AF; }
      .patents-tooltip .text-yellow-500 { color: #F59E0B; }
      .patents-tooltip .bg-gray-50 { background-color: #F9FAFB; }
      .patents-tooltip .rounded-lg { border-radius: 0.5rem; }
      .patents-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      .patents-tooltip .p-3 { padding: 0.75rem; }
      .patents-tooltip .p-4 { padding: 1rem; }
      .patents-tooltip .p-2 { padding: 0.5rem; }
      .patents-tooltip .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .patents-tooltip .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .patents-tooltip .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
      .patents-tooltip .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
      .patents-tooltip .pt-3 { padding-top: 0.75rem; }
      .patents-tooltip .mb-3 { margin-bottom: 0.75rem; }
      .patents-tooltip .mb-1 { margin-bottom: 0.25rem; }
      .patents-tooltip .mb-4 { margin-bottom: 1rem; }
      .patents-tooltip .mr-1 { margin-right: 0.25rem; }
      .patents-tooltip .mr-2 { margin-right: 0.5rem; }
      .patents-tooltip .ml-2 { margin-left: 0.5rem; }
      .patents-tooltip .mt-1 { margin-top: 0.25rem; }
      .patents-tooltip .mt-3 { margin-top: 0.75rem; }
      .patents-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
      .patents-tooltip .text-xs { font-size: 0.75rem; }
      .patents-tooltip .text-sm { font-size: 0.875rem; }
      .patents-tooltip .text-lg { font-size: 1.125rem; }
      .patents-tooltip .text-xl { font-size: 1.25rem; }
      .patents-tooltip .font-bold { font-weight: 700; }
      .patents-tooltip .font-medium { font-weight: 500; }
      .patents-tooltip .flex { display: flex; }
      .patents-tooltip .items-center { align-items: center; }
      .patents-tooltip .justify-between { justify-content: space-between; }
      .patents-tooltip .w-8 { width: 2rem; }
      .patents-tooltip .h-6 { height: 1.5rem; }
      .patents-tooltip .w-36 { width: 9rem; }
      .patents-tooltip .w-44 { width: 11rem; }
      .patents-tooltip .w-48 { width: 12rem; }
      .patents-tooltip .rounded { border-radius: 0.25rem; }
      .patents-tooltip .rounded-md { border-radius: 0.375rem; }
      .patents-tooltip .overflow-hidden { overflow: hidden; }
      .patents-tooltip .border-t { border-top-width: 1px; }
      .patents-tooltip .border-b { border-bottom-width: 1px; }
      .patents-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
      .patents-tooltip .max-w-xs { max-width: 20rem; }
      .patents-tooltip .w-full { width: 100%; }
      .patents-tooltip .h-full { height: 100%; }
      .patents-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
      .patents-tooltip .relative { position: relative; }
      .patents-tooltip .inline-block { display: inline-block; }
    `;
    
    // Añadir al head
    document.head.appendChild(styleElement);
    
    // Eliminar cuando se desmonte el componente
    return () => {
      const existingStyle = document.getElementById('tooltip-patents-map-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Renderizar el mapa
  useEffect(() => {
    console.log("[Patents Map Render Debug] Iniciando renderizado del mapa");
    console.log("[Patents Map Render Debug] geoData disponible:", !!geoData);
    console.log("[Patents Map Render Debug] svgRef disponible:", !!svgRef.current);
    console.log("[Patents Map Render Debug] Datos disponibles:", data?.length || 0, "registros");
    
    if (!geoData || !svgRef.current) {
      console.log("[Patents Map Render Debug] No se puede renderizar - faltan datos GeoJSON o referencia SVG");
      return;
    }

    const renderMap = () => {
      console.log("[Patents Map Render Debug] Iniciando función renderMap");
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 1000;
      const height = 700;

      // Configurar proyección
      const projection = d3.geoMercator()
        .center([10, 54])
        .scale(800)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      console.log("[Patents Map Render Debug] Proyección configurada");
      console.log("[Patents Map Render Debug] Número de países en GeoJSON:", geoData.features.length);

      // Crear leyenda para el mapa
      const createLegend = () => {
        const legendGroup = svg.append('g')
          .attr('transform', `translate(60, 480)`);
        
        // Obtener todos los valores para calcular rangos
        const allValues: number[] = [];
        geoData.features.forEach(feature => {
          const val = getCountryValue(feature);
          if (val !== null && val > 0) {
            allValues.push(val);
          }
        });
        
        if (allValues.length === 0) {
          console.log("[Patents Map Legend Debug] No hay valores para crear leyenda");
          return;
        }
        
        // Ordenar valores para calcular cuartiles
        allValues.sort((a, b) => a - b);
        
        // Calcular cuartiles
        const q1 = allValues[Math.floor(allValues.length * 0.25)];
        const q2 = allValues[Math.floor(allValues.length * 0.5)];
        const q3 = allValues[Math.floor(allValues.length * 0.75)];
        const min = allValues[0];
        const max = allValues[allValues.length - 1];
        
        const quartiles = [min, q1, q2, q3, max];
        
        // Obtener color base del sector
        let normalizedId = selectedSector.toLowerCase();
        if (normalizedId === 'total' || normalizedId === 'TOTAL') normalizedId = 'total';
        if (normalizedId === 'bes' || normalizedId === 'business') normalizedId = 'business';
        if (normalizedId === 'gov' || normalizedId === 'government') normalizedId = 'government';
        if (normalizedId === 'hes' || normalizedId === 'education') normalizedId = 'education';
        if (normalizedId === 'pnp' || normalizedId === 'nonprofit') normalizedId = 'nonprofit';
        
        const baseColor = PATENTS_SECTOR_COLORS[normalizedId as keyof typeof PATENTS_SECTOR_COLORS] || PATENTS_SECTOR_COLORS.total;
        
        // Crear colores para la leyenda
        const colors = [
          d3.color(baseColor)?.brighter(1.5)?.toString() || '#e0e0e0',
          d3.color(baseColor)?.brighter(0.8)?.toString() || '#d0d0d0',
          baseColor,
          d3.color(baseColor)?.darker(0.8)?.toString() || '#606060',
          d3.color(baseColor)?.darker(1.6)?.toString() || '#404040'
        ];
        
        // Añadir título a la leyenda
        legendGroup.append('text')
          .attr('x', 0)
          .attr('y', -80)
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text(t.researchers);
        
        // Añadir etiqueta "Sin datos"
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', -60)
          .attr('width', 25)
          .attr('height', 25)
          .attr('fill', '#f5f5f5')
          .attr('stroke', '#666')
          .attr('stroke-width', 0.5);
          
        legendGroup.append('text')
          .attr('x', 35)
          .attr('y', -42)
          .attr('font-size', '14px')
          .text(language === 'es' ? 'Sin datos' : 'No data');
          
        // Añadir etiqueta para valores cero
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', -30)
          .attr('width', 25)
          .attr('height', 25)
          .attr('fill', '#ff9800')
          .attr('stroke', '#666')
          .attr('stroke-width', 0.5);
          
        legendGroup.append('text')
          .attr('x', 35)
          .attr('y', -12)
          .attr('font-size', '14px')
          .text('0');
        
        // Crear rangos para la leyenda
        for (let i = 0; i < 4; i++) {
          const rangeStart = Math.round(quartiles[i]);
          const rangeEnd = Math.round(quartiles[i + 1]);
          
          if (i > 0 && rangeStart === Math.round(quartiles[i-1])) {
            continue;
          }
          
          legendGroup.append('rect')
            .attr('x', 0)
            .attr('y', i * 30)
            .attr('width', 25)
            .attr('height', 25)
            .attr('fill', colors[i])
            .attr('stroke', '#666')
            .attr('stroke-width', 0.5);
          
          // Formatear números con separadores de miles
          const formattedStart = new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(rangeStart);
          const formattedEnd = new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(rangeEnd);
          
          legendGroup.append('text')
            .attr('x', 35)
            .attr('y', i * 30 + 18)
            .attr('font-size', '14px')
            .text(`${formattedStart} - ${formattedEnd}`);
        }
      };

      // Función para posicionar tooltip
      const positionTooltip = (tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, tooltipNode: HTMLElement) => {
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width || 300;
        const tooltipHeight = tooltipRect.height || 200;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = event.clientX + 15;
        let top = event.clientY - 15;
        
        if (left + tooltipWidth > windowWidth - 10) {
          left = event.clientX - tooltipWidth - 15;
        }
        
        if (top + tooltipHeight > windowHeight - 10) {
          if (tooltipHeight < windowHeight - 20) {
            top = windowHeight - tooltipHeight - 10;
          } else {
            top = 10;
          }
        }
        
        if (top < 10) top = 10;
        if (left < 10) left = 10;
        
        tooltip
          .style('left', `${left}px`)
          .style('top', `${top}px`);
      };

      // Función para obtener bandera del país
      const getCountryFlagUrl = (countryName: string, feature?: GeoJsonFeature): string => {
        // Intentar obtener ISO3 del feature si está disponible
        let iso3 = feature ? getCountryIso3(feature) : '';
        
        // Si no tenemos ISO3 del feature, buscar por nombre
        if (!iso3) {
          // Normalizar el nombre del país para búsqueda
          const normalizedCountryName = normalizarTexto(countryName);
          
          // Buscar en la lista de banderas
          const foundFlag = countryFlags.find(flag => 
            normalizarTexto(flag.country) === normalizedCountryName
          );
          
          if (foundFlag) {
            iso3 = foundFlag.iso3;
          }
        }
        
        // Buscar en la lista de banderas por ISO3
        const foundFlag = iso3 ? countryFlags.find(flag => flag.iso3 === iso3) : null;
        
        if (foundFlag && foundFlag.flag) {
          return foundFlag.flag;
        }
        
        // Fallback a una bandera genérica
        return '/data/flags/placeholder.svg';
      };

      // Función para obtener nombre localizado del país usando el mapeo global
      const getLocalizedCountryName = (countryCode: string): string => {
        if (countryCode in countryCodeMapping) {
          return countryCodeMapping[countryCode][language];
        }
        
        const flagInfo = countryFlags.find(flag => flag.code === countryCode || flag.iso3 === countryCode);
        if (flagInfo) {
          return flagInfo.country;
        }
        
        return countryCode;
      };

      // Función para obtener el ranking de un país
      const getCountryRank = (feature: GeoJsonFeature, countryValuesMap: Map<string, number>): { rank: number, total: number } | null => {
        const countryName = getCountryName(feature);
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        
        if (isSupranationalEntity(countryName)) return null;
        
        const codeMapping: Record<string, string> = {
          'GRC': 'EL',
          'GBR': 'UK',
          'DEU': 'DE',
          'FRA': 'FR',
          'ESP': 'ES',
          'ITA': 'IT',
          'CZE': 'CZ',
          'SWE': 'SE',
          'DNK': 'DK',
          'FIN': 'FI',
          'AUT': 'AT',
          'BEL': 'BE',
          'BGR': 'BG',
          'HRV': 'HR',
          'CYP': 'CY',
          'EST': 'EE',
          'HUN': 'HU',
          'IRL': 'IE',
          'LVA': 'LV',
          'LTU': 'LT',
          'LUX': 'LU',
          'MLT': 'MT',
          'NLD': 'NL',
          'POL': 'PL',
          'PRT': 'PT',
          'ROU': 'RO',
          'SVK': 'SK',
          'SVN': 'SI',
          'CHE': 'CH',
          'NOR': 'NO',
          'ISL': 'IS',
          'TUR': 'TR',
          'MKD': 'MK',
          'RUS': 'RU',
          'SRB': 'RS',
          'MNE': 'ME',
          'ALB': 'AL',
          'BIH': 'BA',
          'MDA': 'MD',
          'UKR': 'UA',
          'XKX': 'XK'
        };
        
        const possibleCodes = [countryIso2, countryIso3];
        if (countryIso3 && codeMapping[countryIso3]) {
          possibleCodes.push(codeMapping[countryIso3]);
        }
        
        let currentValue: number | null = null;
        let matchedCode: string | null = null;
        
        for (const code of possibleCodes) {
          if (code && countryValuesMap.has(code)) {
            currentValue = countryValuesMap.get(code)!;
            matchedCode = code;
            break;
          }
        }
        
        if (currentValue === null || matchedCode === null) return null;
        
        const sortedValues: [string, number][] = [];
        countryValuesMap.forEach((val, code) => {
          const isSupranational = code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
          
          if (!isSupranational) {
            sortedValues.push([code, val]);
          }
        });
        
        sortedValues.sort((a, b) => b[1] - a[1]);
        
        const position = sortedValues.findIndex(([, val]) => val === currentValue);
        
        if (position === -1) return null;
        
        return {
          rank: position + 1,
          total: sortedValues.length
        };
      };

      // Función para obtener países competidores (cercanos en el ranking)
      const getCompetitorCountries = (feature: GeoJsonFeature, countryValuesMap: Map<string, number>): string => {
        const countryName = getCountryName(feature);
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        
        if (isSupranationalEntity(countryName)) return '';
        
        const codeMapping: Record<string, string> = {
          'GRC': 'EL',
          'GBR': 'UK',
          'DEU': 'DE',
          'FRA': 'FR',
          'ESP': 'ES',
          'ITA': 'IT',
          'CZE': 'CZ',
          'SWE': 'SE',
          'DNK': 'DK',
          'FIN': 'FI',
          'AUT': 'AT',
          'BEL': 'BE',
          'BGR': 'BG',
          'HRV': 'HR',
          'CYP': 'CY',
          'EST': 'EE',
          'HUN': 'HU',
          'IRL': 'IE',
          'LVA': 'LV',
          'LTU': 'LT',
          'LUX': 'LU',
          'MLT': 'MT',
          'NLD': 'NL',
          'POL': 'PL',
          'PRT': 'PT',
          'ROU': 'RO',
          'SVK': 'SK',
          'SVN': 'SI',
          'CHE': 'CH',
          'NOR': 'NO',
          'ISL': 'IS',
          'TUR': 'TR',
          'MKD': 'MK',
          'RUS': 'RU',
          'SRB': 'RS',
          'MNE': 'ME',
          'ALB': 'AL',
          'BIH': 'BA',
          'MDA': 'MD',
          'UKR': 'UA',
          'XKX': 'XK'
        };
        
        const possibleCodes = [countryIso2, countryIso3];
        if (countryIso3 && codeMapping[countryIso3]) {
          possibleCodes.push(codeMapping[countryIso3]);
        }
        
        let currentValue: number | null = null;
        let matchedCode: string | null = null;
        
        for (const code of possibleCodes) {
          if (code && countryValuesMap.has(code)) {
            currentValue = countryValuesMap.get(code)!;
            matchedCode = code;
            break;
          }
        }
        
        if (currentValue === null || matchedCode === null) return '';
        
        // Crear array ordenado de países
        const sortedValues: [string, number][] = [];
        countryValuesMap.forEach((val, code) => {
          const isSupranational = code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
          
          if (!isSupranational) {
            sortedValues.push([code, val]);
          }
        });
        
        sortedValues.sort((a, b) => b[1] - a[1]);
        
        const currentPosition = sortedValues.findIndex(([, val]) => val === currentValue);
        
        if (currentPosition === -1) return '';
        
        // Obtener competidores cercanos (1 por arriba y 1 por abajo)
        const competitors: Array<{code: string, value: number, position: number, type: 'above' | 'below'}> = [];
        
        // País por arriba (mejor ranking)
        if (currentPosition > 0) {
          const [aboveCode, aboveValue] = sortedValues[currentPosition - 1];
          competitors.push({
            code: aboveCode, 
            value: aboveValue, 
            position: currentPosition, 
            type: 'above'
          });
        }
        
        // País por abajo (peor ranking)
        if (currentPosition < sortedValues.length - 1) {
          const [belowCode, belowValue] = sortedValues[currentPosition + 1];
          competitors.push({
            code: belowCode, 
            value: belowValue, 
            position: currentPosition + 2, 
            type: 'below'
          });
        }
        
        if (competitors.length === 0) return '';
        
        // Construir HTML para competidores
        let competitorsHtml = `
          <div class="space-y-1 border-t border-gray-100 pt-3 mt-3">
            <div class="text-xs text-gray-500 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="M8 3l4 8 5-5v7H3V6l5 5 4-8z"></path>
              </svg>
              ${language === 'es' ? 'Competencia directa' : 'Direct competition'}
            </div>
        `;
        
        competitors.forEach(competitor => {
          const competitorName = getLocalizedCountryName(competitor.code);
          const formattedValue = formatNumberComplete(Math.round(competitor.value), 0, language);
          const difference = Math.abs(currentValue - competitor.value);
          const percentDiff = currentValue > 0 ? ((difference / currentValue) * 100).toFixed(1) : '0.0';
          
          const isAbove = competitor.type === 'above';
          const arrowIcon = isAbove ? 
            'M12 19V5M5 12l7-7 7 7' : // Flecha hacia arriba
            'M12 5v14M5 12l7 7 7-7'; // Flecha hacia abajo
          
          competitorsHtml += `
            <div class="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 ${isAbove ? 'text-red-500' : 'text-green-500'}">
                  <path d="${arrowIcon}"></path>
                </svg>
                <span class="font-medium text-gray-700">${competitorName}</span>
              </div>
              <div class="text-right">
                <div class="font-bold text-gray-800">${formattedValue}</div>
                <div class="text-xs text-gray-500">${isAbove ? '+' : '-'}${percentDiff}%</div>
              </div>
            </div>
          `;
        });
        
        competitorsHtml += '</div>';
        
        return competitorsHtml;
      };

      // Funciones de interacción
      const handleMouseOver = (event: MouseEvent, feature: GeoJsonFeature) => {
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        const countryName = getLocalizedCountryName(countryIso3 || countryIso2 || '');
        const value = getCountryValue(feature);
        
        // Recopilar todos los valores basándose en los datos reales
        const countryValuesMap = new Map<string, number>();
        
        const countryDataForYear = data.filter(item => {
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          
          let sectorMatch = false;
          if (selectedSector === 'total') {
            sectorMatch = item.sectperf === 'TOTAL';
          } else if (selectedSector === 'business') {
            sectorMatch = item.sectperf === 'BES';
          } else if (selectedSector === 'government') {
            sectorMatch = item.sectperf === 'GOV';
          } else if (selectedSector === 'education') {
            sectorMatch = item.sectperf === 'HES';
          } else if (selectedSector === 'nonprofit') {
            sectorMatch = item.sectperf === 'PNP';
          }
          
          const isEuropean = EUROPEAN_COUNTRY_CODES.includes(item.geo);
          
          return yearMatch && sectorMatch && isEuropean;
        });
        
        const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
        
        countryDataForYear.forEach(item => {
          const countryCode = item.geo;
          let value = parseFloat(item.OBS_VALUE || '0');
          if (isNaN(value)) return;
          
          if (countryCode === 'EU27_2020') {
            value = Math.round(value / 27);
          } else if (countryCode === 'EA19') {
            value = Math.round(value / 19);
          } else if (countryCode === 'EA20') {
            value = Math.round(value / 20);
          }
          
          const isSupranational = countryCode === 'EU27_2020' || countryCode === 'EA19' || countryCode === 'EA20';
          tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
        });
        
        let sortedData = Array.from(tempCountryMap.values())
          .sort((a, b) => b.value - a.value);
        
        sortedData = sortedData.slice(0, 25);
        
        sortedData.forEach(item => {
          countryValuesMap.set(item.code, item.value);
        });
        
        const rankInfo = !isSupranationalEntity(countryName) ? 
          getCountryRank(feature, countryValuesMap) : null;
        
        // Obtener información de competencia
        const competitorsHtml = !isSupranationalEntity(countryName) && value !== null ? 
          getCompetitorCountries(feature, countryValuesMap) : '';
        
        const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
        
        if ((countryIso2 && !europeanCountryCodes.includes(countryIso2)) && 
            (countryIso3 && !europeanCountryCodes.includes(countryIso3))) {
          return;
        }
        
        const countryNameAlt = getCountryName(feature);
        if (isSupranationalEntity(countryNameAlt)) {
          console.log(`Tooltip para entidad supranacional: ${countryNameAlt}`);
        }
        
        // Destacar país seleccionado
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '1.5')
          .attr('stroke', '#333');
        
        // Buscar información adicional en los datos
        const countryData = data.find(item => {
          const possibleCodes = [countryIso3, countryIso2];
          
          const codeMapping: Record<string, string[]> = {
            'GRC': ['EL'],
            'GBR': ['UK'],
            'DEU': ['DE'],
            'FRA': ['FR'],
            'ESP': ['ES'],
            'ITA': ['IT'],
            'CZE': ['CZ'],
            'SWE': ['SE'],
            'DNK': ['DK'],
            'FIN': ['FI'],
            'AUT': ['AT'],
            'BEL': ['BE'],
            'BGR': ['BG'],
            'HRV': ['HR'],
            'CYP': ['CY'],
            'EST': ['EE'],
            'HUN': ['HU'],
            'IRL': ['IE'],
            'LVA': ['LV'],
            'LTU': ['LT'],
            'LUX': ['LU'],
            'MLT': ['MT'],
            'NLD': ['NL'],
            'POL': ['PL'],
            'PRT': ['PT'],
            'ROU': ['RO'],
            'SVK': ['SK'],
            'SVN': ['SI'],
            'CHE': ['CH'],
            'NOR': ['NO'],
            'ISL': ['IS'],
            'TUR': ['TR'],
            'MKD': ['MK'],
            'UA': ['UKR'],
            'RS': ['SRB'],
            'ME': ['MNE'],
            'AL': ['ALB'],
            'BA': ['BIH'],
            'XK': ['XKX'],
            'RU': ['RUS']
          };
          
          const codeMapping2to3: Record<string, string> = {
            'EL': 'GRC',
            'UK': 'GBR',
            'GB': 'GBR',
            'DE': 'DEU',
            'FR': 'FRA',
            'ES': 'ESP',
            'IT': 'ITA',
            'CZ': 'CZE',
            'SE': 'SWE',
            'DK': 'DNK',
            'FI': 'FIN',
            'AT': 'AUT',
            'BE': 'BEL',
            'BG': 'BGR',
            'HR': 'HRV',
            'CY': 'CYP',
            'EE': 'EST',
            'HU': 'HUN',
            'IE': 'IRL',
            'LV': 'LVA',
            'LT': 'LTU',
            'LU': 'LUX',
            'MT': 'MLT',
            'NL': 'NLD',
            'PL': 'POL',
            'PT': 'PRT',
            'RO': 'ROU',
            'SK': 'SVK',
            'SI': 'SVN',
            'CH': 'CHE',
            'NO': 'NOR',
            'IS': 'ISL',
            'TR': 'TUR',
            'MK': 'MKD',
            'UA': 'UKR',
            'RS': 'SRB',
            'ME': 'MNE',
            'AL': 'ALB',
            'BA': 'BIH',
            'RU': 'RUS'
          };
          
          if (countryIso3 && countryIso3.length === 3 && codeMapping[countryIso3]) {
            possibleCodes.push(...codeMapping[countryIso3]);
          }
          if (countryIso2 && countryIso2.length === 2) {
            if (codeMapping2to3[countryIso2]) {
              possibleCodes.push(codeMapping2to3[countryIso2]);
            }
          }
          
          const geoMatch = possibleCodes.some(code => item.geo === code);
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          
          let sectorMatch = false;
          if (selectedSector === 'total' && item.sectperf === 'TOTAL') sectorMatch = true;
          else if (selectedSector === 'business' && item.sectperf === 'BES') sectorMatch = true;
          else if (selectedSector === 'government' && item.sectperf === 'GOV') sectorMatch = true;
          else if (selectedSector === 'education' && item.sectperf === 'HES') sectorMatch = true;
          else if (selectedSector === 'nonprofit' && item.sectperf === 'PNP') sectorMatch = true;
          
          return geoMatch && yearMatch && sectorMatch;
        });
        
        // Buscar información adicional en los datos
        console.log(`[Patents Tooltip Debug] País: ${countryName}, ISO3: ${countryIso3}, geo data: ${countryData?.geo}, OBS_FLAG: ${countryData?.OBS_FLAG}, Objeto completo:`, countryData);
        
        // Obtener la bandera del país
        const flagUrl = getCountryFlagUrl(countryName, feature);
        
        // Verificar si es España o la UE para la visualización del tooltip
        const isSpain = countryIso2 === 'ES' || countryIso3 === 'ESP';
        const isEU = countryIso2 === 'EU' || countryData?.geo === 'EU27_2020';
        
        const euValue = !isEU ? getEUValue(data, selectedYear, selectedSector) : null;
        const euAverageValue = euValue !== null ? Math.round(euValue / 27) : null;
        const spainValue = !isSpain ? getSpainValue(data, selectedYear, selectedSector) : null;
        
        let previousYearValue = null;
        
        // Obtener el valor del año anterior para la comparación YoY - mejorar búsqueda
        if (value !== null) {
          // Intentar primero con códigos más específicos
          if (countryData?.geo) {
            previousYearValue = getPreviousYearValue(data, countryData.geo, selectedYear, selectedSector);
          }
          
          // Si no se encontró, intentar con ISO3 e ISO2
          if (previousYearValue === null && countryIso3) {
            previousYearValue = getPreviousYearValue(data, countryIso3, selectedYear, selectedSector);
          }
          
          if (previousYearValue === null && countryIso2) {
            previousYearValue = getPreviousYearValue(data, countryIso2, selectedYear, selectedSector);
          }
          
          // Búsqueda adicional en los datos directamente
          if (previousYearValue === null) {
            // Intentar buscar en los datos del año anterior por el nombre normalizado del país
            const normalizedCountryName = normalizarTexto(countryName);
            console.log(`[Patents YoY Debug] Intentando búsqueda por nombre: ${normalizedCountryName}`);
            
            const prevYearDirectData = data.filter(item => {
              const itemCountry = normalizarTexto(item.geo);
              const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear - 1;
              
              // Verificar si contiene parte del nombre del país
              return itemCountry.includes(normalizedCountryName) && yearMatch;
            });
            
            if (prevYearDirectData.length > 0 && prevYearDirectData[0].OBS_VALUE) {
              previousYearValue = parseFloat(prevYearDirectData[0].OBS_VALUE);
              console.log(`[Patents YoY Debug] Valor encontrado por coincidencia de nombre: ${previousYearValue}`);
            }
          }
        }
        
        console.log(`[Patents Tooltip Debug] Valor actual: ${value}, Valor año anterior: ${previousYearValue}`);
        
        // Preparar HTML para la comparación YoY
        let yoyComparisonHtml = '';
        if (value !== null && previousYearValue !== null && previousYearValue !== 0) {
          const difference = value - previousYearValue;
          const percentDiff = (difference / previousYearValue) * 100;
          const formattedDiff = percentDiff.toFixed(1);
          const isPositive = difference > 0;
          console.log(`[Patents Tooltip Debug] Generando HTML de comparación YoY: diff=${difference}, percentDiff=${percentDiff}%`);
          yoyComparisonHtml = `
            <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
              </svg>
              <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
            </div>
          `;
        } else {
          console.log(`[Patents Tooltip Debug] No se puede generar comparación YoY: value=${value}, previousYearValue=${previousYearValue}`);
          yoyComparisonHtml = `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
        }
        
        // Construir comparaciones HTML
        let comparisonsHtml = '';
        
        // Solo mostrar comparaciones si el país actual tiene datos
        if (value !== null) {
          // Comparación con la UE
          if (!isEU && euAverageValue !== null) {
            const difference = value - euAverageValue;
            const percentDiff = (difference / euAverageValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs Media UE (${formatNumberComplete(Math.round(euAverageValue), 0, language)}):` : 
                  `vs Avg UE (${formatNumberComplete(Math.round(euAverageValue), 0, language)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
              </div>
            `;
          }
          
          // Comparación con España
          if (!isSpain && spainValue !== null) {
            const difference = value - spainValue;
            const percentDiff = (difference / spainValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs España (${formatNumberComplete(Math.round(spainValue), 0, language)}):` : 
                  `vs Spain (${formatNumberComplete(Math.round(spainValue), 0, language)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
              </div>
            `;
          }
        }

        let tooltipContent = '';
        
        if (value === null) {
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div class="flex items-center p-3 bg-green-50 border-b border-green-100">
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${countryName}" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
              </div>
              <div class="p-4">
                <p class="text-gray-500">${t.noData}</p>
              </div>
            </div>
          `;
        } else {
          const safeValue = value;
          
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-green-50 border-b border-green-100">
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${countryName}" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                    <span>${t.researchers}:</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-green-700">${formatNumberComplete(Math.round(safeValue), 0, language)}</span>
                    ${countryData && countryData.OBS_FLAG ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${countryData.OBS_FLAG}</span>` : ''}
                  </div>
                  ${yoyComparisonHtml}
                </div>
                
                <!-- Ranking (si está disponible y no es entidad supranacional) -->
                ${rankInfo ? `
                <div class="mb-4">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Rank </span>
                    <span class="font-bold text-lg mx-1">${rankInfo.rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${rankInfo.total}` : `of ${rankInfo.total}`}</span>
                  </div>
                </div>
                ` : ''}
                
                <!-- Si hay comparaciones, mostrarlas -->
                ${comparisonsHtml ? `
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${comparisonsHtml}
                </div>
                ` : ''}
                
                <!-- Competidores directos -->
                ${competitorsHtml}
              </div>
              
              <!-- Footer con información de la bandera de observación -->
              ${countryData && countryData.OBS_FLAG && getLabelDescription(countryData.OBS_FLAG, language) ? `
                <div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  <span>${countryData.OBS_FLAG} - ${getLabelDescription(countryData.OBS_FLAG, language)}</span>
                </div>
              ` : ''}
            </div>
          `;
        }
        
        // Mostrar tooltip
        const tooltip = d3.select(tooltipRef.current!);
        tooltip
          .style('display', 'block')
          .html(tooltipContent)
          .classed('visible', true);
        
        setTimeout(() => {
          if (tooltipRef.current) {
            positionTooltip(tooltip, event, tooltipRef.current);
          }
        }, 10);
      };

      const handleMouseMove = (event: MouseEvent) => {
        const tooltip = d3.select(tooltipRef.current!);
        if (tooltip.style('display') !== 'none' && tooltipRef.current) {
          setTimeout(() => {
            if (tooltipRef.current) {
              positionTooltip(tooltip, event, tooltipRef.current);
            }
          }, 0);
        }
      };

      const handleMouseOut = (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '0.5')
          .attr('stroke', '#fff');
        
        const tooltip = d3.select(tooltipRef.current!);
        tooltip.classed('visible', false);
        
        setTimeout(() => {
          if (!tooltip.classed('visible')) {
            tooltip.style('display', 'none');
          }
        }, 150);
      };

      // Dibujar países con colores basados en datos
      const paths = svg.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', feature => {
          const value = getCountryValue(feature);
          const color = getColorForValue(value);
          console.log("[Patents Map Render Debug] País renderizado - valor:", value, "color:", color);
          return color;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.5px')
        .style('cursor', 'pointer')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          handleMouseOver(event, d);
        })
        .on('mousemove', function(event: MouseEvent) {
          handleMouseMove(event);
        })
        .on('mouseout', function(event: MouseEvent) {
          handleMouseOut(event);
        });
        
      console.log("[Patents Map Render Debug] Países renderizados:", paths.size());
      
      // Añadir leyenda
      createLegend();
      
      console.log("[Patents Map Render Debug] Renderizado completado");
    };

    renderMap();
  }, [geoData, data, selectedYear, selectedSector, language]);



  return (
    <div className="relative w-full h-full">
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getMapTitle()} · {selectedYear}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {getSectorText()}
        </div>
      </div>
      
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center text-red-500">{error}</div>
        </div>
      ) : (
        <>
          <svg 
            ref={svgRef} 
            className="w-full h-full min-h-[450px]" 
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
          />
          <div 
            ref={tooltipRef}
            className="patents-tooltip"
            style={{
              display: 'none',
              maxWidth: '350px',
              transformOrigin: 'top left'
            }}
          />
        </>
      )}
    </div>
  );
};

export default PatentsEuropeanMap; 