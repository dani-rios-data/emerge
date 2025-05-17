import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
import { SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Definir la interfaz para los datos de entrada
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
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

interface ResearchersEuropeanMapProps {
  data: ResearchersData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

// Añadir mapeo de códigos de país a nombres en español e inglés
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
  'AL': {es: 'Albania', en: 'Albania'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'RU': {es: 'Rusia', en: 'Russia'},
  'JP': {es: 'Japón', en: 'Japan'},
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'}
};

// Paleta de colores para el mapa
const getSectorPalette = (sectorId: string) => {
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar sectores a IDs
  if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
  if (normalizedId === 'business enterprise sector' || normalizedId === 'bes') normalizedId = 'business';
  if (normalizedId === 'government sector' || normalizedId === 'gov') normalizedId = 'government';
  if (normalizedId === 'higher education sector' || normalizedId === 'hes') normalizedId = 'education';
  if (normalizedId === 'private non-profit sector' || normalizedId === 'pnp') normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para SECTOR_COLORS
  const validSectorId = (normalizedId in SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = SECTOR_COLORS[validSectorId as keyof typeof SECTOR_COLORS];
  
  // Crear un contraste más fuerte para el mapa de calor
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    ZERO: '#666666',           // Gris fuerte para países con 0 investigadores
    MIN: d3.color(baseColor)?.brighter(1.9)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1.1)?.toString() || '#d0d0d0',  // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(1.0)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.8)?.toString() || '#707070',    // Muy oscuro
  };
};

// Textos localizados para el mapa
const mapTexts = {
  es: {
    title: "Investigadores por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    researchers: "Investigadores",
    fullTimeEquivalent: "ETC (Equivalente Tiempo Completo)",
    sector_business: "Empresas",
    sector_government: "Gobierno",
    sector_education: "Educación superior",
    sector_nonprofit: "Organizaciones sin ánimo de lucro",
    sector_total: "Todos los sectores",
    researchersByCountry: "Investigadores por país"
  },
  en: {
    title: "Researchers by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    researchers: "Researchers",
    fullTimeEquivalent: "FTE (Full-Time Equivalent)",
    sector_business: "Business enterprise",
    sector_government: "Government",
    sector_education: "Higher education",
    sector_nonprofit: "Private non-profit",
    sector_total: "All sectors",
    researchersByCountry: "Researchers by Country"
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

// Función para verificar si una entidad es UE o zona euro (no un país)
// Esta función se usa en el tooltip para mostrar información adicional
function isSupranationalEntity(name: string | undefined): boolean {
  if (!name) return false;
  const normalizedName = normalizarTexto(name);
  return normalizedName.includes('union europea') || 
         normalizedName.includes('european union') ||
         normalizedName.includes('zona euro') || 
         normalizedName.includes('euro area') ||
         normalizedName.includes('oecd') ||
         normalizedName.includes('ocde') ||
         normalizedName.includes('average');
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

// Función para obtener el ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  
  // Mapeo especial para países que podrían tener problemas con ISO3
  const countryNameToISO3: { [key: string]: string } = {
    'Czech Republic': 'CZE',
    'Czechia': 'CZE',
    'Chequia': 'CZE',
    'República Checa': 'CZE',
    'North Macedonia': 'MKD',
    'Bosnia and Herzegovina': 'BIH'
  };
  
  // Verificar si es un país con mapeo especial
  const countryName = getCountryName(feature);
  if (countryName && countryNameToISO3[countryName]) {
    return countryNameToISO3[countryName];
  }
  
  // Intentar obtener el código ISO3 de diferentes propiedades posibles
  const iso3 = props.ISO3 || props.iso_a3 || props.ADM0_A3 || '';
  return iso3 as string;
}

// Función para obtener el valor de la UE
function getEUValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar los datos de la UE
  const euData = data.filter(item => {
    const isEU = item.geo === 'EU27_2020';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector para manejar diferentes valores
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
  
  // Usar el primer resultado que coincida
  if (euData.length > 0 && euData[0].OBS_VALUE) {
    return parseFloat(euData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para obtener el valor para España
function getSpainValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar los datos de España
  const spainData = data.filter(item => {
    const isSpain = item.geo === 'ES';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector
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
  
  // Usar el primer resultado que coincida
  if (spainData.length > 0 && spainData[0].OBS_VALUE) {
    return parseFloat(spainData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para verificar si el código es de una entidad supranacional
function isSupranationalCode(code: string): boolean {
  if (!code) return false;
  
  // Lista específica de códigos supranacionales (no países)
  const supranationalCodes = [
    'EU27_2020', 'EA19', 'EA20',           // Códigos directos
    'EU', 'EZ', 'EA', 'OECD', 'OCDE',      // Otros posibles códigos
    'EU27', 'EZ19', 'EZ20', 'EU28',        // Variantes adicionales
    'EU_27', 'EU-27', 'EA-19', 'EA-20'     // Variantes con guiones
  ];
  
  // Solo usar coincidencia exacta o prefijos específicos para evitar falsos positivos
  return supranationalCodes.includes(code) || 
         (code.startsWith('EU') && code.length <= 5) || 
         (code.startsWith('EA') && code.length <= 5) ||
         code === 'European Union' ||
         code === 'Euro area';
}

// Función para obtener rango de valores para todos los países
function getValueRange(
  data: ResearchersData[], 
  year: number, 
  sector: string
): { min: number, max: number, median: number, quartiles: number[] } {
  if (!data || data.length === 0) return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  
  const values: number[] = [];
  
  // Lista ampliada de códigos de países europeos (excluyendo entidades supranacionales)
  const europeanCountryCodes = [
    // Códigos ISO2
    'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
    'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
    'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'GB', 'CH', 
    'NO', 'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 
    'XK', 'RU', 'GR', 'BY', 'VA',
    // Códigos ISO3
    'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'GRC', 'ESP',
    'FIN', 'FRA', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT',
    'NLD', 'POL', 'PRT', 'ROU', 'SWE', 'SVN', 'SVK', 'GBR', 'CHE', 'NOR',
    'ISL', 'TUR', 'MNE', 'MKD', 'ALB', 'SRB', 'BIH', 'MDA', 'UKR', 'RUS',
    'BLR', 'VAT', 'KOS', 'MCO', 'SMR', 'AND', 'LIE'
  ];
  
  // Filtrar datos por año y sector, solo países europeos y excluir entidades supranacionales
  const filteredData = data.filter(item => {
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector
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
    
    // Verificar si es un país europeo (y no una entidad supranacional)
    const isEuropeanCountry = europeanCountryCodes.includes(item.geo) && !isSupranationalCode(item.geo);
    
    return yearMatch && sectorMatch && isEuropeanCountry;
  });
  
  console.log(`Datos filtrados para rango de valores: ${filteredData.length} registros`);
  
  // Extraer valores numéricos
  filteredData.forEach(item => {
    if (item.OBS_VALUE) {
      const value = parseFloat(item.OBS_VALUE);
      if (!isNaN(value) && value > 0) { // Solo incluir valores positivos
        values.push(value);
      }
    }
  });
  
  // Si no hay valores, retornar un rango por defecto
  if (values.length === 0) {
    console.warn("No se encontraron valores para calcular el rango");
    return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  }
  
  // Ordenar valores para calcular estadísticas
  values.sort((a, b) => a - b);
  
  // Calcular min, max y estadísticas
  const min = values[0];
  const max = values[values.length - 1];
  
  // Calcular la mediana
  const midpoint = Math.floor(values.length / 2);
  const median = values.length % 2 === 0
    ? (values[midpoint - 1] + values[midpoint]) / 2
    : values[midpoint];
  
  // Calcular cuartiles (divide los datos en 4 partes)
  const calculateQuantile = (arr: number[], q: number) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  };
  
  const quartiles = [
    min,
    calculateQuantile(values, 0.25),
    calculateQuantile(values, 0.5),
    calculateQuantile(values, 0.75),
    max
  ];
  
  console.log(`Estadísticas calculadas (${values.length} valores):`);
  console.log(`Min: ${min}, Max: ${max}, Mediana: ${median}`);
  console.log(`Cuartiles: ${quartiles.join(', ')}`);
  
  return {
    min,
    max,
    median,
    quartiles
  };
}

// Función para obtener el color según el valor
function getColorForValue(
  value: number | null, 
  selectedSector: string,
  data: ResearchersData[] = [], 
  year: number = 0
): string {
  if (value === null) return getSectorPalette(selectedSector).NULL;
  if (value === 0) return getSectorPalette(selectedSector).ZERO;
  
  // Obtener estadísticas y rango de valores (solo de países europeos, sin entidades supranacionales)
  const stats = getValueRange(data, year, selectedSector);
  const { min, max, quartiles } = stats;
  
  // Usar una interpolación más intensa para el mapa de calor
  const palette = getSectorPalette(selectedSector);
  
  // Calcular ratio de rango (para determinar si usar escala log o lineal)
  const rangeRatio = max / min;
  
  // Usar una escala logarítmica si el rango es muy grande
  if (rangeRatio > 15) {
    // Si hay una gran diferencia, usar escala logarítmica para mejor visualización
    const logScale = d3.scaleLog<string>()
      .domain([Math.max(min, 0.1), max]) // Evitar logaritmo de 0
      .range([palette.MIN, palette.MAX])
      .clamp(true);
    
    return logScale(Math.max(value, 0.1)); // Evitar logaritmo de 0
  } else {
    // Escala lineal con cuartiles reales para mejor distribución de colores
    const colorScale = d3.scaleLinear<string>()
      .domain(quartiles)
      .range([
        palette.MIN,
        palette.LOW,
        palette.MID,
        palette.HIGH,
        palette.MAX
      ])
      .clamp(true);
    
    return colorScale(value);
  }
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

// Función para obtener URL de bandera del país
function getCountryFlagUrl(countryName: string, feature?: GeoJsonFeature): string {  
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
}

// Función para formatear números con separadores de miles
function formatNumberWithThousandSeparator(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Corregir los tipos para la función positionTooltip usando un tipo genérico más amplio
function positionTooltip<T extends Element>(
  tooltip: d3.Selection<T, unknown, null, undefined>, 
  event: MouseEvent, 
  tooltipNode: HTMLElement
): void {
  // Obtener las dimensiones del tooltip
  const tooltipRect = tooltipNode.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 300; // Usar un valor por defecto si aún no se ha renderizado
  const tooltipHeight = tooltipRect.height || 200;
  
  // Obtener dimensiones de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Calcular la posición óptima
  let left = event.clientX + 15;
  let top = event.clientY - 15;
  
  // Ajustar horizontalmente si se sale por la derecha
  if (left + tooltipWidth > windowWidth - 10) {
    left = event.clientX - tooltipWidth - 15; // Mover a la izquierda del cursor
  }
  
  // Ajustar verticalmente si se sale por abajo
  if (top + tooltipHeight > windowHeight - 10) {
    if (tooltipHeight < windowHeight - 20) {
      // Si cabe en la pantalla, ajustar hacia arriba
      top = windowHeight - tooltipHeight - 10;
    } else {
      // Si es demasiado grande, colocarlo en la parte superior con scroll
      top = 10;
    }
  }
  
  // Asegurar que no se salga por arriba
  if (top < 10) {
    top = 10;
  }
  
  // Asegurar que no se salga por la izquierda
  if (left < 10) {
    left = 10;
  }
  
  // Aplicar la posición
  tooltip
    .style('left', `${left}px`)
    .style('top', `${top}px`);
}

// Actualizar la función para obtener nombre del país
function getLocalizedCountryName(countryCode: string, language: 'es' | 'en'): string {
  if (countryCode in countryCodeMapping) {
    return countryCodeMapping[countryCode][language];
  }
  
  // Si no está en el mapeo, ver si podemos encontrarlo en countryFlags
  const flagInfo = countryFlags.find(flag => flag.code === countryCode || flag.iso3 === countryCode);
  if (flagInfo) {
    return flagInfo.country;
  }
  
  // Si no se encuentra, devolver el código como fallback
  return countryCode;
}

const ResearchersEuropeanMap: React.FC<ResearchersEuropeanMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language, 
  onClick 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [europeanMapData, setEuropeanMapData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Añadir estado para almacenar el rango de valores
  const [valueRange, setValueRange] = useState<{min: number, max: number, median?: number, quartiles?: number[]}>({min: 0, max: 1});
  
  // Textos del idioma seleccionado
  const t = mapTexts[language];
  
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
    
    // Obtener color del sector
    const baseColor = SECTOR_COLORS[normalizedId as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(baseColor)?.darker(0.8)?.toString() || '#333333';
  };
  
  // Calcular el rango de valores cuando cambian los datos, año o sector
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Calcular el rango de valores solo para países europeos (sin entidades supranacionales)
    const range = getValueRange(data, selectedYear, selectedSector);
    setValueRange(range);
    
    console.log("Rango de valores actualizado para mapa:");
    console.log(`- Año: ${selectedYear}`);
    console.log(`- Sector: ${selectedSector}`);
    console.log(`- Valor mínimo: ${range.min}`);
    console.log(`- Valor máximo: ${range.max}`);
    console.log(`- Cuartiles: ${range.quartiles?.join(', ')}`);
  }, [data, selectedYear, selectedSector]);
  
  // Cargar mapa de Europa
  useEffect(() => {
    const fetchMap = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(EUROPE_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEuropeanMapData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading map data:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMap();
  }, [t.error]);
  
        // Añadir estilos CSS para el tooltip en el useEffect
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'tooltip-researchers-map-styles';
    
    // Definir estilos CSS para el tooltip
    styleElement.textContent = `
      .country-tooltip {
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
      .country-tooltip.visible {
        opacity: 1 !important;
        transform: scale(1);
      }
      .country-tooltip .text-green-600 { color: #059669; }
      .country-tooltip .text-red-600 { color: #DC2626; }
      .country-tooltip .bg-blue-50 { background-color: #EFF6FF; }
      .country-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
      .country-tooltip .border-blue-100 { border-color: #DBEAFE; }
      .country-tooltip .border-gray-100 { border-color: #F3F4F6; }
      .country-tooltip .text-gray-500 { color: #6B7280; }
      .country-tooltip .text-blue-700 { color: #1D4ED8; }
      .country-tooltip .text-gray-800 { color: #1F2937; }
      .country-tooltip .text-gray-600 { color: #4B5563; }
      .country-tooltip .text-yellow-500 { color: #F59E0B; }
      .country-tooltip .rounded-lg { border-radius: 0.5rem; }
      .country-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      .country-tooltip .p-3 { padding: 0.75rem; }
      .country-tooltip .p-4 { padding: 1rem; }
      .country-tooltip .p-2 { padding: 0.5rem; }
      .country-tooltip .pt-3 { padding-top: 0.75rem; }
      .country-tooltip .mb-3 { margin-bottom: 0.75rem; }
      .country-tooltip .mb-1 { margin-bottom: 0.25rem; }
      .country-tooltip .mb-4 { margin-bottom: 1rem; }
      .country-tooltip .mr-1 { margin-right: 0.25rem; }
      .country-tooltip .mr-2 { margin-right: 0.5rem; }
      .country-tooltip .mt-1 { margin-top: 0.25rem; }
      .country-tooltip .mt-3 { margin-top: 0.75rem; }
      .country-tooltip .text-xs { font-size: 0.75rem; }
      .country-tooltip .text-sm { font-size: 0.875rem; }
      .country-tooltip .text-lg { font-size: 1.125rem; }
      .country-tooltip .text-xl { font-size: 1.25rem; }
      .country-tooltip .font-bold { font-weight: 700; }
      .country-tooltip .font-medium { font-weight: 500; }
      .country-tooltip .flex { display: flex; }
      .country-tooltip .items-center { align-items: center; }
      .country-tooltip .justify-between { justify-content: space-between; }
      .country-tooltip .w-8 { width: 2rem; }
      .country-tooltip .h-6 { height: 1.5rem; }
      .country-tooltip .w-36 { width: 9rem; }
      .country-tooltip .w-44 { width: 11rem; }
      .country-tooltip .w-48 { width: 12rem; }
      .country-tooltip .rounded { border-radius: 0.25rem; }
      .country-tooltip .rounded-md { border-radius: 0.375rem; }
      .country-tooltip .overflow-hidden { overflow: hidden; }
      .country-tooltip .border-t { border-top-width: 1px; }
      .country-tooltip .border-b { border-bottom-width: 1px; }
      .country-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
      .country-tooltip .max-w-xs { max-width: 20rem; }
      .country-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
      .country-tooltip .w-full { width: 100%; }
      .country-tooltip .h-full { height: 100%; }
      .country-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
      .country-tooltip .relative { position: relative; }
    `;
    
    // Añadir al head
    document.head.appendChild(styleElement);
    
    // Eliminar cuando se desmonte el componente
    return () => {
      const existingStyle = document.getElementById('tooltip-researchers-map-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);
  
  // Renderizar el mapa cuando cambian los datos
  useEffect(() => {
    if (!svgRef.current || !europeanMapData || isLoading) return;
    
    const renderMap = () => {
      // Limpiar SVG
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      
      // Configurar proyección
      const projection = d3.geoMercator()
        .center([10, 55])
        .scale(700)
        .translate([svg.node()?.getBoundingClientRect().width ?? 500 / 2, 350]);
      
      // Crear generador de paths
      const pathGenerator = d3.geoPath().projection(projection);
      
      // Crear una leyenda para el mapa
      const createLegend = () => {
        const legendGroup = svg.append('g')
          .attr('transform', `translate(60, 480)`);
        
        // Obtener los valores necesarios para la leyenda
        const { min, max } = valueRange;
        const quartiles = valueRange.quartiles || [min, min + (max-min)*0.25, min + (max-min)*0.5, min + (max-min)*0.75, max];
        
        // Crear rectángulos para cada categoría
        const palette = getSectorPalette(selectedSector);
        const colors = [palette.MIN, palette.LOW, palette.MID, palette.HIGH, palette.MAX];
        
        // Mostrar nota de leyenda con valores mínimo y máximo (sin la palabra "Rango")
        legendGroup.append('text')
          .attr('x', 0)
          .attr('y', -30)
          .attr('font-size', '12px')
          .attr('fill', '#666')
          .text(`${formatNumberWithThousandSeparator(min)} - ${formatNumberWithThousandSeparator(max)}`);
        
        // Usar los cuartiles para las etiquetas de la leyenda
        const rangeValues = quartiles;
        
        for (let i = 0; i < 4; i++) {
          const rangeStart = Math.round(rangeValues[i]);
          const rangeEnd = Math.round(rangeValues[i + 1]);
          
          legendGroup.append('rect')
            .attr('x', 0)
            .attr('y', i * 30)
            .attr('width', 25)
            .attr('height', 25)
            .attr('fill', colors[i]);
          
          legendGroup.append('text')
            .attr('x', 35)
            .attr('y', i * 30 + 18)
            .attr('font-size', '14px')
            .text(`${formatNumberWithThousandSeparator(rangeStart)} - ${formatNumberWithThousandSeparator(rangeEnd)}`);
        }
        
        // Añadir título a la leyenda
        legendGroup.append('text')
          .attr('x', 0)
          .attr('y', -15)
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text(t.researchers);
      };
      
      // Función para obtener el valor de un país
      const getCountryValue = (
        feature: GeoJsonFeature,
        data: ResearchersData[],
        year: number,
        sector: string
      ): number | null => {
        if (!data || data.length === 0) return null;
        
        // Obtener códigos del país desde el feature
        const iso3 = getCountryIso3(feature);
        const iso2 = feature.properties?.iso_a2 as string;
        
        // Lista de códigos de países europeos
        const europeanCountryCodes = [
          'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
          'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
          'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'GB', 'CH', 
          'NO', 'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 
          'XK', 'RU', 'EU27_2020', 'EA19', 'EA20',
          'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'GRC', 'ESP',
          'FIN', 'FRA', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT',
          'NLD', 'POL', 'PRT', 'ROU', 'SWE', 'SVN', 'SVK', 'GBR', 'CHE', 'NOR',
          'ISL', 'TUR', 'MNE', 'MKD', 'ALB', 'SRB', 'BIH', 'MDA', 'UKR', 'RUS'
        ];
        
        // Verificar si el país es europeo de forma más permisiva
        // Solo excluir si ambos códigos (iso2 e iso3) no están en la lista
        if (iso2 && iso3 && 
            !europeanCountryCodes.includes(iso2) && 
            !europeanCountryCodes.includes(iso3)) {
          // Si claramente no es un país europeo, no mostrar datos
          return null;
        }
        
                  // Solo excluir entidades claramente supranacionales
          if (isSupranationalCode(iso3) || isSupranationalCode(iso2)) {
            return null;
          }
        
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
          'RUS': ['RU']
        };
        
        // Lista de posibles códigos a buscar
        const possibleCodes = [iso3, iso2];
        
        // Añadir códigos alternativos del mapeo
        if (iso3 && iso3 in codeMapping) {
          possibleCodes.push(...codeMapping[iso3]);
        }
        if (iso2 && codeMapping[iso2]) {
          possibleCodes.push(...codeMapping[iso2]);
        }
        
        // Buscar los datos para cualquiera de los posibles códigos
        const countryData = data.filter(item => {
          // Verificar si el código geo coincide con cualquiera de los posibles códigos
          const geoMatch = possibleCodes.some(code => item.geo === code);
          const yearMatch = parseInt(item.TIME_PERIOD) === year;
          
          // Normalizar el sector para manejar diferentes valores
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
          
          return geoMatch && yearMatch && sectorMatch;
        });
        
        // Usar el primer resultado que coincida
        if (countryData.length > 0 && countryData[0].OBS_VALUE) {
          return parseFloat(countryData[0].OBS_VALUE);
        }
        
        return null;
      };
      
      // Funciones de interacción con tooltip mejorado
      const handleMouseOver = (event: MouseEvent, feature: GeoJsonFeature) => {
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        const countryName = getLocalizedCountryName(countryIso3 || countryIso2, language);
        const value = getCountryValue(feature, data, selectedYear, selectedSector);
        
        // Lista de códigos de países europeos - usar la misma que está definida en otra parte del código
        const europeanCountryCodes = [
          'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
          'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
          'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'GB', 'CH', 
          'NO', 'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 
          'XK', 'RU', 'GR', 'BY', 'VA',
          'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'GRC', 'ESP',
          'FIN', 'FRA', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT',
          'NLD', 'POL', 'PRT', 'ROU', 'SWE', 'SVN', 'SVK', 'GBR', 'CHE', 'NOR',
          'ISL', 'TUR', 'MNE', 'MKD', 'ALB', 'SRB', 'BIH', 'MDA', 'UKR', 'RUS',
          'BLR', 'VAT', 'KOS', 'MCO', 'SMR', 'AND', 'LIE'
        ];
        
        // Verificar si el país es europeo de forma más flexible
        if ((countryIso2 && !europeanCountryCodes.includes(countryIso2)) && 
            (countryIso3 && !europeanCountryCodes.includes(countryIso3))) {
          // Si no es un país europeo, ignorar
          return;
        }
        
        // Verificar si es una entidad supranacional para personalizar el tooltip
        const countryNameAlt = getCountryName(feature);
        if (isSupranationalEntity(countryNameAlt)) {
          // Si es una entidad supranacional podríamos mostrar información adicional
          console.log(`Tooltip para entidad supranacional: ${countryNameAlt}`);
        }
        
        // Ignorar hover en países sin datos
        if (value === null) return;
        
        // Destacar país seleccionado
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '1.5')
          .attr('stroke', '#333');
        
        // Buscar información adicional en los datos
        const countryData = data.find(item => {
          // Lista de posibles códigos a buscar
          const possibleCodes = [countryIso3, countryIso2];
          
          // Verificar mapeo especial para códigos
          if (countryIso3 && countryCodeMapping[countryIso3]) {
            possibleCodes.push(countryIso3);
          }
          if (countryIso2 && countryCodeMapping[countryIso2]) {
            possibleCodes.push(countryIso2);
          }
          
          // Comprobar si el código geo coincide con cualquiera de los posibles códigos
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
        
        // Obtener la bandera del país
        const flagUrl = getCountryFlagUrl(countryName, feature);
        
        // Obtener descripción de flag si existe
        let flagDescription = '';
        if (countryData?.OBS_FLAG) {
          const description = getLabelDescription(countryData.OBS_FLAG, language);
          if (description) {
            flagDescription = `<div class="text-xs text-gray-500 mt-1">(${description})</div>`;
          }
        }
        
        // Verificar si es España o la UE para la visualización del tooltip
        const isSpain = countryIso2 === 'ES' || countryIso3 === 'ESP';
        const isEU = countryIso2 === 'EU' || countryData?.geo === 'EU27_2020';
        
        // Obtener valores para comparativas
        const euValue = !isEU ? getEUValue(data, selectedYear, selectedSector) : null;
        const spainValue = !isSpain ? getSpainValue(data, selectedYear, selectedSector) : null;
        
        // Construir comparaciones HTML
        let comparisonsHtml = '';
        
        // Comparación con la UE
        if (!isEU && euValue !== null) {
          const difference = value - euValue;
          const percentDiff = (difference / euValue) * 100;
          const formattedDiff = percentDiff.toFixed(1);
          const isPositive = difference > 0;
          
          comparisonsHtml += `
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                `vs Unión Europea (${formatNumberWithThousandSeparator(euValue, 0)}):` : 
                `vs European Union (${formatNumberWithThousandSeparator(euValue, 0)}):`}</span>
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
                `vs España (${formatNumberWithThousandSeparator(spainValue, 0)}):` : 
                `vs Spain (${formatNumberWithThousandSeparator(spainValue, 0)}):`}</span>
              <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
            </div>
          `;
        }

        // Añadir indicador de porcentaje sobre el máximo
        const percentOfMax = valueRange.max > 0 ? (value / valueRange.max) * 100 : 0;
        const rankIndicator = `
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentOfMax}%"></div>
          </div>
          <div class="text-xs text-gray-500 text-right mt-1">${percentOfMax.toFixed(1)}% del máximo</div>
        `;
        
        // Construir contenido del tooltip con estilo mejorado
        const tooltipContent = `
          <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <!-- Header con el nombre del país -->
            <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
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
                  <span class="text-xl font-bold text-blue-700">${formatNumberWithThousandSeparator(value, 0)}</span>
                  <span class="ml-1 text-gray-600 text-sm">${t.fullTimeEquivalent}</span>
                </div>
                ${rankIndicator}
                ${flagDescription}
              </div>
              
              <!-- Si hay comparaciones, mostrarlas -->
              ${comparisonsHtml ? `
              <div class="space-y-2 border-t border-gray-100 pt-3">
                <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                ${comparisonsHtml}
              </div>
              ` : ''}
            </div>
          </div>
        `;
        
        // Mostrar tooltip
        const tooltip = d3.select(tooltipRef.current!);
        tooltip
          .style('display', 'block')
          .html(tooltipContent)
          .classed('visible', true);
        
        // Posicionar tooltip con animación - usar setTimeout para asegurar que el DOM se ha actualizado
        setTimeout(() => {
          if (tooltipRef.current) {
            positionTooltip(tooltip, event, tooltipRef.current);
          }
        }, 10);
      };
      
              const handleMouseMove = (event: MouseEvent) => {
          // Solo actualizar la posición si el tooltip es visible
          const tooltip = d3.select(tooltipRef.current!);
          if (tooltip.style('display') !== 'none' && tooltipRef.current) {
            // Usar setTimeout para recalcular posición después de que el DOM se actualice
            setTimeout(() => {
              if (tooltipRef.current) {
                positionTooltip(tooltip, event, tooltipRef.current);
              }
            }, 0);
          }
        };
      
      const handleMouseOut = (event: MouseEvent) => {
        // Restaurar estilo original
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '0.5')
          .attr('stroke', '#fff');
        
        // Fade out tooltip
        const tooltip = d3.select(tooltipRef.current!);
        tooltip.classed('visible', false);
        
        // Ocultar después de la transición
        setTimeout(() => {
          if (!tooltip.classed('visible')) {
            tooltip.style('display', 'none');
          }
        }, 150);
      };
      
      const handleClick = (event: MouseEvent, feature: GeoJsonFeature) => {
        if (onClick) {
          const countryName = getCountryName(feature);
          onClick(countryName);
        }
      };
      
      // Dibujar países
      svg.selectAll<SVGPathElement, GeoJsonFeature>('path')
        .data(europeanMapData!.features)
        .enter()
        .append('path')
        .attr('d', feature => pathGenerator(feature) || '')
        .attr('fill', feature => {
          const value = getCountryValue(feature, data, selectedYear, selectedSector);
          return getColorForValue(value, selectedSector, data, selectedYear);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          handleMouseOver(event, d);
        })
        .on('mousemove', function(event: MouseEvent) {
          handleMouseMove(event);
        })
        .on('mouseout', function(event: MouseEvent) {
          handleMouseOut(event);
        })
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          handleClick(event, d);
        })
        .style('cursor', onClick ? 'pointer' : 'default')
        .append('title')
        .text(feature => getCountryName(feature));
      
      // Añadir leyenda
      createLegend();
    };
    
    renderMap();
  }, [europeanMapData, data, selectedYear, selectedSector, language, valueRange]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
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
        className="country-tooltip"
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

export default ResearchersEuropeanMap; 