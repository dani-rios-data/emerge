import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
import { SECTOR_COLORS } from '../utils/colors';
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

// Definición de tipos más estrictos para propiedades
type GeoJsonProperties = {
  name?: string;
  name_es?: string;
  name_en?: string;
  code?: string;
  iso?: string;
  ccaa?: string;
  [key: string]: string | number | undefined;
};

// Tipo para las características GeoJSON
type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

interface SpanishRegionsMapProps {
  data: AutonomousCommunityData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (region: string) => void;
  dataDisplayType?: DataDisplayType;
}

// URL del archivo GeoJSON de España
const SPAIN_GEOJSON_URL = '/data/geo/spain-communities.geojson';

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
  
  // Crear gradiente basado en el color del sector
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    ZERO: '#666666',           // Gris fuerte para regiones con 0.00%
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
    title: "Inversión en I+D por Comunidad Autónoma",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de España",
    noData: "Sin datos",
    rdInvestment: "Inversión I+D",
    ofGDP: "del PIB",
    lessThan: "< 0.5%",
    between1: "0.5% - 1%",
    between2: "1% - 1.5%",
    between3: "1.5% - 2%",
    between4: "> 2%",
    allSectors: "Todos los sectores",
    rdInvestmentByRegion: "Inversión en I+D por Comunidad Autónoma",
    // Sectores traducidos
    sector_business: "Empresas",
    sector_government: "Gobierno",
    sector_education: "Educación superior",
    sector_nonprofit: "Organizaciones sin ánimo de lucro",
    sector_total: "Todos los sectores",
    percentOfGDP: "% del PIB",
  },
  en: {
    title: "R&D Investment by Autonomous Community",
    loading: "Loading map...",
    error: "Error loading Spain map",
    noData: "No data",
    rdInvestment: "R&D Investment",
    ofGDP: "of GDP",
    lessThan: "< 0.5%",
    between1: "0.5% - 1%",
    between2: "1% - 1.5%",
    between3: "1.5% - 2%",
    between4: "> 2%",
    allSectors: "All Sectors",
    rdInvestmentByRegion: "R&D Investment by Autonomous Community",
    // Sectores traducidos
    sector_business: "Business enterprise",
    sector_government: "Government",
    sector_education: "Higher education",
    sector_nonprofit: "Private non-profit",
    sector_total: "All sectors",
    percentOfGDP: "% of GDP",
  }
};

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en GeoJSON
const communityNameMapping: { [key: string]: string } = {
  // Mapeo de nombres en español (como aparecen en el CSV) a nombres esperados en GeoJSON
  // Andalucía
  'Andalucía': 'Andalucía',
  'Andalucia': 'Andalucía',
  // Aragón
  'Aragón': 'Aragón',
  'Aragon': 'Aragón',
  // Asturias
  'Principado de Asturias': 'Asturias',
  'Asturias': 'Asturias',
  // Baleares
  'Illes Balears / Islas Baleares': 'Islas Baleares',
  'Islas Baleares': 'Islas Baleares',
  'Illes Balears': 'Islas Baleares',
  'Baleares': 'Islas Baleares',
  'Balearic Islands': 'Islas Baleares',
  // Canarias
  'Canarias': 'Canarias',
  'Islas Canarias': 'Canarias',
  'Canary Islands': 'Canarias',
  // Cantabria
  'Cantabria': 'Cantabria',
  // Castilla-La Mancha
  'Castilla - La Mancha': 'Castilla-La Mancha',
  'Castilla-La Mancha': 'Castilla-La Mancha',
  'Castilla La Mancha': 'Castilla-La Mancha',
  // Castilla y León
  'Castilla y León': 'Castilla y León',
  'Castilla y Leon': 'Castilla y León',
  'Castilla León': 'Castilla y León',
  'Castile and León': 'Castilla y León',
  // Cataluña
  'Cataluña': 'Cataluña',
  'Cataluna': 'Cataluña',
  'Catalunya': 'Cataluña',
  'Catalonia': 'Cataluña',
  // Comunidad Valenciana
  'Comunidad Valenciana': 'Comunidad Valenciana',
  'C. Valenciana': 'Comunidad Valenciana',
  'Valencia': 'Comunidad Valenciana',
  'Valencian Community': 'Comunidad Valenciana',
  // Extremadura
  'Extremadura': 'Extremadura',
  // Galicia
  'Galicia': 'Galicia',
  // La Rioja
  'La Rioja': 'La Rioja',
  'Rioja': 'La Rioja',
  // Madrid
  'Comunidad de Madrid': 'Comunidad de Madrid',
  'Madrid': 'Comunidad de Madrid',
  // Murcia
  'Región de Murcia': 'Región de Murcia',
  'Region de Murcia': 'Región de Murcia',
  'Murcia': 'Región de Murcia',
  // Navarra
  'Comunidad Foral de Navarra': 'Navarra',
  'Navarra': 'Navarra',
  'Navarre': 'Navarra',
  // País Vasco
  'País Vasco': 'País Vasco',
  'Pais Vasco': 'País Vasco',
  'Euskadi': 'País Vasco',
  'Basque Country': 'País Vasco',
  // Ceuta
  'Ciudad Autónoma de Ceuta': 'Ceuta',
  'Ceuta': 'Ceuta',
  // Melilla
  'Ciudad Autónoma de Melilla': 'Melilla',
  'Melilla': 'Melilla'
};

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Función para obtener el nombre de la comunidad de las propiedades GeoJSON
function getCommunityName(feature: GeoJsonFeature, language: 'es' | 'en'): string {
  const props = feature.properties || {};
  
  // Manejar casos especiales por su código (códigos de comunidades autónomas españolas)
  if (props.iso) {
    const code = props.iso.toString().toUpperCase();
    // Mapeo de códigos ISO a nombres completos
    const isoCodeMap: Record<string, {es: string, en: string}> = {
      'ES-AN': {es: 'Andalucía', en: 'Andalusia'},
      'ES-AR': {es: 'Aragón', en: 'Aragon'},
      'ES-AS': {es: 'Asturias', en: 'Asturias'},
      'ES-CB': {es: 'Cantabria', en: 'Cantabria'},
      'ES-CL': {es: 'Castilla y León', en: 'Castile and León'},
      'ES-CM': {es: 'Castilla-La Mancha', en: 'Castilla-La Mancha'},
      'ES-CN': {es: 'Canarias', en: 'Canary Islands'},
      'ES-CT': {es: 'Cataluña', en: 'Catalonia'},
      'ES-EX': {es: 'Extremadura', en: 'Extremadura'},
      'ES-GA': {es: 'Galicia', en: 'Galicia'},
      'ES-IB': {es: 'Islas Baleares', en: 'Balearic Islands'},
      'ES-MC': {es: 'Región de Murcia', en: 'Murcia'},
      'ES-MD': {es: 'Comunidad de Madrid', en: 'Madrid'},
      'ES-NC': {es: 'Navarra', en: 'Navarre'},
      'ES-PV': {es: 'País Vasco', en: 'Basque Country'},
      'ES-RI': {es: 'La Rioja', en: 'La Rioja'},
      'ES-VC': {es: 'Comunidad Valenciana', en: 'Valencia'},
      'ES-CE': {es: 'Ceuta', en: 'Ceuta'},
      'ES-ML': {es: 'Melilla', en: 'Melilla'}
    };
    
    if (code in isoCodeMap) {
      return language === 'es' ? isoCodeMap[code].es : isoCodeMap[code].en;
    }
  }
  
  // Intentar obtener el nombre de la comunidad de diferentes propiedades posibles
  if (language === 'es') {
    return (
      props.name_es ||
      props.nameEsp ||
      props.nombre ||
      props.name ||
      props.ccaa ||
      'Desconocido'
    ) as string;
  } else {
    return (
      props.name_en ||
      props.nameEng ||
      props.name ||
      props.ccaa ||
      'Unknown'
    ) as string;
  }
}

// Función para obtener el código de la comunidad
function getCommunityCode(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  // Intentar obtener el código de la comunidad
  return (props.code || props.iso || '') as string;
}

// Función para obtener el valor de una comunidad autónoma
function getCommunityValue(
  feature: GeoJsonFeature,
  data: AutonomousCommunityData[],
  selectedYear: string,
  selectedSector: string,
  language: 'es' | 'en',
  dataDisplayType: DataDisplayType = 'percent_gdp'
): number | null {
  if (!data || data.length === 0) return null;
  
  const communityName = getCommunityName(feature, language);
  const communityCode = getCommunityCode(feature);
  
  // Buscar coincidencias por nombre normalizado
  const normalizedCommunityName = normalizarTexto(communityName);
  
  // Para debugging
  console.log(`Buscando coincidencia para: "${communityName}" (normalizado: "${normalizedCommunityName}"), código: "${communityCode}"`);
  
  // Mapear el sector seleccionado al Sector Id del CSV
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
      sectorId = '_T'; // Total/All sectors por defecto
  }
  
  // MEJORA: Añadir más formas de hacer coincidir las comunidades
  const matchingData = data.filter(item => {
    const itemCommunityOriginal = item["Comunidad (Original)"];
    const itemCommunityName = item["Comunidad Limpio"];
    const itemCommunityNameEn = item["Comunidad en Inglés"];
    
    const itemNormalizedOriginal = normalizarTexto(itemCommunityOriginal);
    const itemNormalizedName = normalizarTexto(itemCommunityName);
    const itemNormalizedNameEn = normalizarTexto(itemCommunityNameEn);
    
    // Primera forma: coincidencia directa con el nombre normalizado
    const directMatch = itemNormalizedName === normalizedCommunityName ||
                       itemNormalizedOriginal === normalizedCommunityName ||
                       itemNormalizedNameEn === normalizedCommunityName;
    
    // Segunda forma: coincidencia a través del mapeo
    const mappingMatch = Object.keys(communityNameMapping).some(key => {
      const keyNormalized = normalizarTexto(key);
      const valueNormalized = normalizarTexto(communityNameMapping[key]);
      
      return (keyNormalized === normalizedCommunityName && valueNormalized === itemNormalizedName) ||
             (valueNormalized === normalizedCommunityName && keyNormalized === itemNormalizedName);
    });
    
    // Tercera forma: verificar si el nombre del GeoJSON contiene parte del nombre del CSV o viceversa
    const containsMatch = 
      (normalizedCommunityName.includes(itemNormalizedName) && itemNormalizedName.length > 3) ||
      (itemNormalizedName.includes(normalizedCommunityName) && normalizedCommunityName.length > 3);
    
    // Cuarta forma: verificar coincidencias parciales (para casos como "Principado de Asturias" vs "Asturias")
    const partialMatch = 
      (itemNormalizedName.includes('asturias') && normalizedCommunityName.includes('asturias')) ||
      (itemNormalizedName.includes('cantabria') && normalizedCommunityName.includes('cantabria')) ||
      (itemNormalizedName.includes('rioja') && normalizedCommunityName.includes('rioja')) ||
      (itemNormalizedName.includes('madrid') && normalizedCommunityName.includes('madrid')) ||
      (itemNormalizedName.includes('murcia') && normalizedCommunityName.includes('murcia')) ||
      (itemNormalizedName.includes('navarra') && normalizedCommunityName.includes('navarra')) ||
      (itemNormalizedName.includes('pais vasco') && normalizedCommunityName.includes('pais vasco')) ||
      (itemNormalizedName.includes('vasca') && normalizedCommunityName.includes('vasca')) ||
      (itemNormalizedName.includes('euskadi') && normalizedCommunityName.includes('euskadi')) ||
      (itemNormalizedName.includes('cataluña') && normalizedCommunityName.includes('cataluña')) ||
      (itemNormalizedName.includes('cataluna') && normalizedCommunityName.includes('cataluna')) ||
      (itemNormalizedName.includes('catalunya') && normalizedCommunityName.includes('catalunya')) ||
      (itemNormalizedName.includes('valencia') && normalizedCommunityName.includes('valencia')) ||
      (itemNormalizedName.includes('baleares') && normalizedCommunityName.includes('baleares')) ||
      (itemNormalizedName.includes('balears') && normalizedCommunityName.includes('balears')) ||
      (itemNormalizedName.includes('canarias') && normalizedCommunityName.includes('canarias')) ||
      (itemNormalizedName.includes('canary') && normalizedCommunityName.includes('canary')) ||
      (itemNormalizedName.includes('andalucia') && normalizedCommunityName.includes('andalucia')) ||
      (itemNormalizedName.includes('aragon') && normalizedCommunityName.includes('aragon')) ||
      (itemNormalizedName.includes('castilla') && normalizedCommunityName.includes('castilla')) ||
      (itemNormalizedName.includes('extremadura') && normalizedCommunityName.includes('extremadura')) ||
      (itemNormalizedName.includes('galicia') && normalizedCommunityName.includes('galicia')) ||
      (itemNormalizedName.includes('ceuta') && normalizedCommunityName.includes('ceuta')) ||
      (itemNormalizedName.includes('melilla') && normalizedCommunityName.includes('melilla'));
    
    // Verificar si hay alguna coincidencia
    const nameMatch = directMatch || mappingMatch || containsMatch || partialMatch;
    
    if (nameMatch) {
      console.log(`Coincidencia encontrada para "${communityName}" con "${itemCommunityName}" (${item["Sector Id"]})`);
    }
    
    const yearMatch = item["Año"] === selectedYear;
    const sectorMatch = item["Sector Id"] === `(${sectorId})`;
    
    return nameMatch && yearMatch && sectorMatch;
  });
  
  if (matchingData.length === 0) {
    console.log(`No se encontraron datos para "${communityName}" (año: ${selectedYear}, sector: ${sectorId})`);
    return null;
  }
  
  // En función del tipo de visualización, devolver %PIB o miles de euros
  if (dataDisplayType === 'percent_gdp') {
    // Obtener el valor de porcentaje del PIB
    const gdpValueStr = matchingData[0]['% PIB I+D'];
    if (!gdpValueStr) return null;
    
    try {
      return parseFloat(gdpValueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Obtener el valor en miles de euros
    const euroValueStr = matchingData[0]['Gasto en I+D (Miles €)'];
    if (!euroValueStr) return null;
    
    try {
      return parseFloat(euroValueStr.replace(',', '.'));
    } catch {
      return null;
    }
  }
}

// Función para obtener el rango de valores de porcentaje del PIB
function getSectorValueRange(
  data: AutonomousCommunityData[], 
  selectedYear: string, 
  selectedSector: string,
  dataDisplayType: DataDisplayType = 'percent_gdp'
): { min: number, max: number } {
  if (!data || data.length === 0) {
    return { min: 0, max: 0 };
  }
  
  // Mapear el sector seleccionado al Sector Id del CSV
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
      sectorId = '_T'; // Total/All sectors por defecto
  }
  
  // Filtrar datos por año y sector
  const filteredData = data.filter(item => 
    item["Año"] === selectedYear &&
    item["Sector Id"] === `(${sectorId})`
  );
  
  if (filteredData.length === 0) {
    return { min: 0, max: 0 };
  }
  
  // Extraer valores según el tipo de visualización
  let values: number[] = [];
  
  if (dataDisplayType === 'percent_gdp') {
    values = filteredData
      .map(item => parseFloat(item['% PIB I+D'].replace(',', '.')))
      .filter(value => !isNaN(value));
  } else {
    values = filteredData
      .map(item => parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.')))
      .filter(value => !isNaN(value));
  }
  
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

// Función para asignar colores basados en el valor
function getColorForValue(
  value: number | null, 
  selectedSector: string, 
  data: AutonomousCommunityData[] = [], 
  selectedYear: string = '',
  dataDisplayType: DataDisplayType = 'percent_gdp'
): string {
  // Obtener la paleta de colores para el sector
  const palette = getSectorPalette(selectedSector);
  
  // MODIFICACIÓN: Si no hay valor, pero queremos un color para visualización,
  // usamos un color por defecto (gris muy claro) para indicar que no hay datos
  if (value === null) {
    // Valor predeterminado para comunidades sin datos
    return '#e0e0e0'; // Gris muy claro - mejor que el valor NULL anterior
  }
  
  // Si el valor es exactamente 0, usar color específico
  if (value === 0) return palette.ZERO;
  
  // Obtener el rango de valores para todos los países
  const valueRange = getSectorValueRange(data, selectedYear, selectedSector, dataDisplayType);
  
  // Si no hay rango, devolver color por defecto
  if (valueRange.min === valueRange.max) return palette.MID;
  
  // Para porcentaje del PIB, usar umbrales fijos para España
  if (dataDisplayType === 'percent_gdp') {
    // Umbrales para España (pueden ser diferentes a los de Europa)
    if (value < 0.5) return palette.MIN;
    if (value < 1) return palette.LOW;
    if (value < 1.5) return palette.MID;
    if (value < 2) return palette.HIGH;
    return palette.MAX;
  } else {
    // Para valores en miles de euros, usar cuartiles
    const range = valueRange.max - valueRange.min;
    const quartile1 = valueRange.min + range * 0.25;
    const quartile2 = valueRange.min + range * 0.5;
    const quartile3 = valueRange.min + range * 0.75;
    
    if (value <= quartile1) return palette.MIN;
    if (value <= quartile2) return palette.LOW;
    if (value <= quartile3) return palette.MID;
    return palette.HIGH;
  }
}

// Función para obtener la URL de la bandera de una comunidad autónoma
function getCommunityFlagUrl(communityName: string): string {
  // Normalizar el nombre de la comunidad
  const normalizedName = normalizarTexto(communityName);
  
  // Buscar coincidencias en el archivo de banderas
  const matchingFlag = communityFlags.find(flag => {
    const flagCommunityName = normalizarTexto(flag.community);
    
    // Verificar coincidencia directa
    if (flagCommunityName === normalizedName) return true;
    
    // Verificar coincidencia por mapeo
    return Object.keys(communityNameMapping).some(key => 
      normalizarTexto(key) === normalizedName && 
      normalizarTexto(communityNameMapping[key]) === flagCommunityName);
  });
  
  return matchingFlag ? matchingFlag.flag : '';
}

// Función para posicionar el tooltip
function positionTooltip(
  tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>, 
  event: MouseEvent, 
  tooltipNode: HTMLElement
): void {
  const tooltipWidth = tooltipNode.offsetWidth;
  const tooltipHeight = tooltipNode.offsetHeight;
  
  // Obtener posición del mouse
  const mouseX = event.pageX;
  const mouseY = event.pageY;
  
  // Calcular posición del tooltip
  let left = mouseX + 15;
  let top = mouseY + 15;
  
  // Ajustar posición si se sale de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (left + tooltipWidth > windowWidth) {
    left = mouseX - tooltipWidth - 15;
  }
  
  if (top + tooltipHeight > windowHeight) {
    top = mouseY - tooltipHeight - 15;
  }
  
  // Establecer posición
  tooltip
    .style('left', `${left}px`)
    .style('top', `${top}px`);
}

// Función para formatear números con separador de miles
function formatNumberWithThousandSeparator(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(value);
}

// Función para formatear valores según el tipo de visualización
const formatValue = (value: number, dataDisplayType: DataDisplayType = 'percent_gdp') => {
  if (dataDisplayType === 'percent_gdp') {
    return `${formatNumberWithThousandSeparator(value, 2)}%`;
  } else {
    return `${formatNumberWithThousandSeparator(value, 0)} mil €`;
  }
};

const SpanishRegionsMap: React.FC<SpanishRegionsMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language, 
  onClick, 
  dataDisplayType = 'percent_gdp'
}) => {
  // Referencias a elementos DOM
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Estado local
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJsonData | null>(null);
  
  // Textos según el idioma actual
  const t = mapTexts[language];
  
  // Obtener el título del mapa
  const getMapTitle = (): string => {
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
      return `Inversión I+D - ${sectorName} (${selectedYear})`;
    } else {
      return `R&D Investment - ${sectorName} (${selectedYear})`;
    }
  };
  
  // Efecto para cargar los datos GeoJSON
  useEffect(() => {
    const loadGeoJson = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(SPAIN_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Imprimir información de cada comunidad para depuración
        console.log("Comunidades del GeoJSON:");
        data.features.forEach((feature: GeoJsonFeature, index: number) => {
          const props = feature.properties || {};
          console.log(`[${index}] Propiedades:`, props);
          console.log(`   Nombre ES: ${props.name_es || props.name || props.ccaa || 'n/a'}`);
          console.log(`   Nombre EN: ${props.name_en || 'n/a'}`);
          console.log(`   Código: ${props.code || props.iso || 'n/a'}`);
        });
        
        setGeoJson(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error cargando GeoJSON:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setIsLoading(false);
      }
    };
    
    loadGeoJson();
  }, []);
  
  // Efecto para renderizar el mapa
  useEffect(() => {
    if (!geoJson || !svgRef.current) return;
    
    // Función para renderizar el mapa
    const renderMap = () => {
      // Limpiar SVG
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      
      // Obtener dimensiones del contenedor
      const containerWidth = mapRef.current?.clientWidth || 600;
      const containerHeight = mapRef.current?.clientHeight || 400;
      
      // Establecer dimensiones del SVG para aprovechar mejor el espacio
      svg
        .attr('width', containerWidth)
        .attr('height', containerHeight);
      
      // MEJORA: Ajustar escala para utilizar más espacio disponible
      const peninsulaScale = containerWidth * 3.2; // Aumentar escala
      const canariasScale = containerWidth * 2.5; // Incrementar más la escala para islas más grandes
      
      // Crear proyección para España peninsular (centrada y escalada para maximizar el espacio)
      const projectionMainland = d3.geoMercator()
        .center([-3.5, 40.0]) // Ligero ajuste del centro
        .scale(peninsulaScale)
        .translate([containerWidth / 2, containerHeight / 2.2]); // Mejor centrado vertical
      
      // Crear proyección específica para las Islas Canarias
      const projectionCanarias = d3.geoMercator()
        .center([-15.5, 28.2])
        .scale(canariasScale) // Escala aumentada para Canarias
        .translate([containerWidth * 0.14, containerHeight * 0.82]); // Mover más arriba
      
      // Crear generador de path para península
      const pathGeneratorMainland = d3.geoPath().projection(projectionMainland);
      
      // Crear generador de path para Canarias
      const pathGeneratorCanarias = d3.geoPath().projection(projectionCanarias);
      
      // Crear grupo para el mapa principal
      const mapGroup = svg.append('g');
      
      // Crear grupo para las Islas Canarias
      const canariasGroup = svg.append('g');
      
      // Función para obtener el ranking de una comunidad
      const getCommunityRank = (feature: GeoJsonFeature): { rank: number, total: number } | null => {
        const communityName = getCommunityName(feature, language);
        if (!communityName) return null;
        
        // Mapear el sector seleccionado al Sector Id del CSV
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
            sectorId = '_T'; // Total/All sectors por defecto
        }
        
        // Filtrar datos por año y sector
        const filteredData = data.filter(item => 
          item["Año"] === selectedYear.toString() &&
          item["Sector Id"] === `(${sectorId})`
        );
        
        if (filteredData.length === 0) return null;
        
        // Ordenar comunidades por valor
        const sortedCommunities = [...filteredData]
          .sort((a, b) => {
            const valueA = parseFloat(a['% PIB I+D'].replace(',', '.'));
            const valueB = parseFloat(b['% PIB I+D'].replace(',', '.'));
            return valueB - valueA; // Ordenar descendente
          });
        
        // Buscar la posición de la comunidad actual
        const normalizedCommunityName = normalizarTexto(communityName);
        
        const communityIndex = sortedCommunities.findIndex(item => {
          const itemCommunityName = item["Comunidad Limpio"];
          const itemNormalizedName = normalizarTexto(itemCommunityName);
          
          // Verificar coincidencia directa o por mapeo
          return itemNormalizedName === normalizedCommunityName ||
                Object.keys(communityNameMapping).some(key => 
                  normalizarTexto(key) === normalizedCommunityName && 
                  normalizarTexto(communityNameMapping[key]) === itemNormalizedName);
        });
        
        if (communityIndex === -1) return null;
        
        // Devolver ranking y total
        return {
          rank: communityIndex + 1,
          total: sortedCommunities.length
        };
      };
      
      // Filtrar características para península y Canarias
      const canariasFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return name.includes('Canarias') || name.includes('Canary');
      });
      
      const mainlandFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return !name.includes('Canarias') && !name.includes('Canary');
      });
      
      // Dibujar comunidades autónomas de la península
      mapGroup.selectAll('path.mainland')
        .data(mainlandFeatures)
        .enter()
        .append('path')
        .attr('d', pathGeneratorMainland as any)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language, dataDisplayType);
          return getColorForValue(value, selectedSector, data, selectedYear.toString(), dataDisplayType);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-${normalizarTexto(name)}`;
        })
        .attr('class', 'community mainland')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          // Destacar comunidad al pasar el mouse
          d3.select(this)
            .attr('stroke', '#000')
            .attr('stroke-width', 1.5);
          
          // Mostrar tooltip
          const tooltip = d3.select(tooltipRef.current);
          
          // Obtener datos de la comunidad
          const communityName = getCommunityName(d, language);
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language, dataDisplayType);
          const rank = getCommunityRank(d);
          
          // Obtener la URL de la bandera
          const flagUrl = getCommunityFlagUrl(communityName);
          
          // Construir contenido del tooltip
          let tooltipContent = `
            <div class="flex items-center mb-2">
              ${flagUrl ? `<img src="${flagUrl}" class="h-6 mr-2" alt="${communityName}" />` : ''}
              <span class="font-bold">${communityName}</span>
            </div>
          `;
          
          if (value !== null) {
            tooltipContent += `
              <div class="text-sm">
                ${t.rdInvestment}: <span class="font-semibold">${formatValue(value, dataDisplayType)}</span> ${dataDisplayType === 'percent_gdp' ? t.ofGDP : ''}
              </div>
            `;
            
            if (rank) {
              tooltipContent += `
                <div class="text-xs text-gray-600 mt-1">
                  Ranking: ${rank.rank}/${rank.total}
                </div>
              `;
            }
          } else {
            tooltipContent += `
              <div class="text-sm text-gray-600">
                ${t.noData}
              </div>
            `;
          }
          
          // Mostrar tooltip
          tooltip
            .html(tooltipContent)
            .style('display', 'block');
          
          // Posicionar tooltip
          positionTooltip(tooltip, event, tooltipRef.current!);
        })
        .on('mousemove', function(event: MouseEvent) {
          // Reposicionar tooltip al mover el mouse
          const tooltip = d3.select(tooltipRef.current);
          positionTooltip(tooltip, event, tooltipRef.current!);
        })
        .on('mouseout', function() {
          // Restaurar estilo al quitar el mouse
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
          
          // Ocultar tooltip
          d3.select(tooltipRef.current)
            .style('display', 'none');
        })
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          // Si hay una función onClick, llamarla con el nombre de la comunidad
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar Islas Canarias
      canariasGroup.selectAll('path.canarias')
        .data(canariasFeatures)
        .enter()
        .append('path')
        .attr('d', pathGeneratorCanarias as any)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language, dataDisplayType);
          return getColorForValue(value, selectedSector, data, selectedYear.toString(), dataDisplayType);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-canarias-${normalizarTexto(name)}`;
        })
        .attr('class', 'community canarias')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          // Destacar comunidad al pasar el mouse
          d3.select(this)
            .attr('stroke', '#000')
            .attr('stroke-width', 1.5);
          
          // Mostrar tooltip
          const tooltip = d3.select(tooltipRef.current);
          
          // Obtener datos de la comunidad
          const communityName = getCommunityName(d, language);
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language, dataDisplayType);
          const rank = getCommunityRank(d);
          
          // Obtener la URL de la bandera
          const flagUrl = getCommunityFlagUrl(communityName);
          
          // Construir contenido del tooltip
          let tooltipContent = `
            <div class="flex items-center mb-2">
              ${flagUrl ? `<img src="${flagUrl}" class="h-6 mr-2" alt="${communityName}" />` : ''}
              <span class="font-bold">${communityName}</span>
            </div>
          `;
          
          if (value !== null) {
            tooltipContent += `
              <div class="text-sm">
                ${t.rdInvestment}: <span class="font-semibold">${formatValue(value, dataDisplayType)}</span> ${dataDisplayType === 'percent_gdp' ? t.ofGDP : ''}
              </div>
            `;
            
            if (rank) {
              tooltipContent += `
                <div class="text-xs text-gray-600 mt-1">
                  Ranking: ${rank.rank}/${rank.total}
                </div>
              `;
            }
          } else {
            tooltipContent += `
              <div class="text-sm text-gray-600">
                ${t.noData}
              </div>
            `;
          }
          
          // Mostrar tooltip
          tooltip
            .html(tooltipContent)
            .style('display', 'block');
          
          // Posicionar tooltip
          positionTooltip(tooltip, event, tooltipRef.current!);
        })
        .on('mousemove', function(event: MouseEvent) {
          // Reposicionar tooltip al mover el mouse
          const tooltip = d3.select(tooltipRef.current);
          positionTooltip(tooltip, event, tooltipRef.current!);
        })
        .on('mouseout', function() {
          // Restaurar estilo al quitar el mouse
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
          
          // Ocultar tooltip
          d3.select(tooltipRef.current)
            .style('display', 'none');
        })
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          // Si hay una función onClick, llamarla con el nombre de la comunidad
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar el recuadro que contiene a las Islas Canarias
      if (canariasFeatures.length > 0) {
        // Fondo blanco translúcido para el recuadro - ajustar posición y tamaño
        canariasGroup.append('rect')
          .attr('x', containerWidth * 0.02) // Más a la izquierda
          .attr('y', containerHeight * 0.74) // Mover más arriba
          .attr('width', containerWidth * 0.24) // Mantener ancho
          .attr('height', containerHeight * 0.17) // Mantener altura
          .attr('rx', 4) 
          .attr('ry', 4)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke', '#0077b6')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .lower();
        
        // Etiqueta para Canarias - ajustar posición
        canariasGroup.append('text')
          .attr('x', containerWidth * 0.04) 
          .attr('y', containerHeight * 0.76) // Mover más arriba
          .attr('font-size', '8px') 
          .attr('font-weight', 'bold')
          .attr('fill', '#0077b6')
          .text(language === 'es' ? 'Islas Canarias' : 'Canary Islands');
      }
    };
    
    // Renderizar mapa
    renderMap();
    
    // Manejar redimensionamiento de ventana
    const handleResize = () => {
      renderMap();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Limpiar eventos al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [geoJson, data, selectedYear, selectedSector, language, dataDisplayType]);
  
  return (
    <div className="relative w-full h-full" ref={mapRef}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-500">{t.error}: {error}</p>
        </div>
      ) : (
        <>
          <div className="mb-2 text-center">
            <h3 className="text-base font-semibold text-gray-800">{getMapTitle()}</h3>
          </div>
          <div className="h-[calc(100%-2rem)]">
            <svg ref={svgRef} className="w-full h-full"></svg>
            <div 
              ref={tooltipRef}
              className="absolute hidden bg-white p-3 rounded-md shadow-lg border border-gray-200 z-10 pointer-events-none max-w-[250px]"
            ></div>
          </div>
        </>
      )}
    </div>
  );
};

export default SpanishRegionsMap; 