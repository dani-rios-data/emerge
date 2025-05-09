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
  // Castilla-La Mancha - Añadir todas las posibles variantes
  'Castilla - La Mancha': 'Castilla-La Mancha',
  'Castilla-La Mancha': 'Castilla-La Mancha',
  'Castilla La Mancha': 'Castilla-La Mancha',
  'Castilla-la Mancha': 'Castilla-La Mancha',
  'Castillalamancha': 'Castilla-La Mancha',
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
  
  // Crear un mapa de conversión específico para nombres problemáticos
  const specificNameMapping: Record<string, string> = {
    'extremadura': 'extremadura',
    'castilla y leon': 'castilla y leon',
    'castilla leon': 'castilla y leon',
    'castilla-leon': 'castilla y leon',
    'castilla-y-leon': 'castilla y leon',
    'castile and leon': 'castilla y leon',
    'castilla la mancha': 'castilla - la mancha',
    'castilla-la mancha': 'castilla - la mancha',
    'castillalamancha': 'castilla - la mancha',
    'islas baleares': 'illes balears / islas baleares',
    'illes balears': 'illes balears / islas baleares',
    'baleares': 'illes balears / islas baleares',
    'balearic islands': 'illes balears / islas baleares',
    'navarra': 'comunidad foral de navarra',
    'navarre': 'comunidad foral de navarra',
    'asturias': 'principado de asturias',
    'principado asturias': 'principado de asturias',
    'ceuta': 'ciudad autonoma de ceuta',
    'melilla': 'ciudad autonoma de melilla'
  };

  // Si el nombre normalizado está en el mapa de conversión específico, usar ese nombre
  const mappedName = specificNameMapping[normalizedName] || normalizedName;
  
  console.log("Buscando bandera para: ", communityName, "normalizado a:", normalizedName, "mapeado a:", mappedName);
  
  // Intentar encontrar coincidencia exacta primero
  let matchingFlag = communityFlags.find(flag => 
    normalizarTexto(flag.community) === mappedName
  );
  
  // Si no hay coincidencia exacta, probar con coincidencia parcial
  if (!matchingFlag) {
    matchingFlag = communityFlags.find(flag => {
      const flagCommunityName = normalizarTexto(flag.community);
      
      // Verificar si la bandera contiene el nombre o viceversa
      return flagCommunityName.includes(mappedName) || 
             mappedName.includes(flagCommunityName);
    });
  }
  
  // Para Castilla-La Mancha, buscar específicamente
  if (normalizedName.includes('castilla') && normalizedName.includes('mancha') && !matchingFlag) {
    matchingFlag = communityFlags.find(flag => 
      normalizarTexto(flag.community).includes('castilla') && 
      normalizarTexto(flag.community).includes('mancha')
    );
  }
  
  // Si aún no hay coincidencia, buscar usando mapeo de comunidades
  if (!matchingFlag) {
    // Verificar coincidencia por mapeo
    for (const key in communityNameMapping) {
      const normalizedKey = normalizarTexto(key);
      const normalizedValue = normalizarTexto(communityNameMapping[key]);
      
      // Si el nombre normalizado coincide con la clave o el valor del mapeo
      if (normalizedKey === normalizedName || normalizedValue === normalizedName) {
        const targetName = normalizedValue;
        
        // Buscar bandera que coincida con el valor del mapeo
        matchingFlag = communityFlags.find(flag => 
          normalizarTexto(flag.community) === targetName ||
          normalizarTexto(flag.community).includes(targetName) ||
          targetName.includes(normalizarTexto(flag.community))
        );
        
        if (matchingFlag) break;
      }
    }
  }
  
  // Si no se ha encontrado bandera, hacer una búsqueda más relajada por código
  if (!matchingFlag) {
    // Extraer posible código de región de la comunidad (si existe en el formato "ES-XX")
    const codeMatch = communityName.match(/ES-(\w{2})/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : '';
    
    // Buscar específicamente por código CLM para Castilla-La Mancha
    if (normalizedName.includes('castilla') && normalizedName.includes('mancha')) {
      matchingFlag = communityFlags.find(flag => flag.code === 'CLM');
    } else if (code) {
      matchingFlag = communityFlags.find(flag => 
        flag.code === code
      );
    }
  }
  
  if (matchingFlag) {
    console.log("Bandera encontrada:", matchingFlag.flag);
    return matchingFlag.flag;
  } else {
    console.log("No se encontró bandera para:", communityName);
    
    // Fallback específico para Castilla-La Mancha (directo)
    if (normalizedName.includes('castilla') && normalizedName.includes('mancha')) {
      console.log("Usando URL directa para Castilla-La Mancha");
      return "https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg";
    }
    
    return '';
  }
}

// Función para formatear números con separador de miles
function formatNumberWithThousandSeparator(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(value);
}

// Función para obtener el promedio de España
function getSpainAverage(data: AutonomousCommunityData[], year: string, sectorId: string, dataDisplayType: DataDisplayType): number | null {
  // Utilizar los datos de España directamente de gdp_consolidado.csv
  try {
    // Se espera que los datos estén disponibles globalmente (similar a como está implementado en CountryRankingChart)
    // Si no es así, podríamos hacer una solicitud fetch al archivo CSV aquí
    
    // Convertir a estructura esperada para los datos
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return null;
    
    // Mapeo del sectorId a formato que se usa en gdp_consolidado
    let sectorName: string;
    switch (sectorId.toLowerCase()) {
      case 'business':
        sectorName = 'Business enterprise sector';
        break;
      case 'government':
        sectorName = 'Government sector';
        break;
      case 'education':
        sectorName = 'Higher education sector';
        break;
      case 'nonprofit':
        sectorName = 'Private non-profit sector';
        break;
      case 'total':
      default:
        sectorName = 'All Sectors';
        break;
    }
    
    // Buscar datos específicos para España para el año y sector indicados
    // Como esto depende de datos que no tenemos disponibles directamente aquí,
    // usaremos un valor hardcoded para el año y sector seleccionado según gdp_consolidado.csv
    
    let value: number | null = null;
    
    // Valores para España por año según gdp_consolidado.csv (basado en "% GDP")
    const spainValues: Record<number, Record<string, number>> = {
      2013: { 'All Sectors': 1.27, 'Business enterprise sector': 0.67, 'Government sector': 0.24, 'Higher education sector': 0.35, 'Private non-profit sector': 0.01 },
      2014: { 'All Sectors': 1.23, 'Business enterprise sector': 0.65, 'Government sector': 0.23, 'Higher education sector': 0.34, 'Private non-profit sector': 0.01 },
      2015: { 'All Sectors': 1.21, 'Business enterprise sector': 0.64, 'Government sector': 0.23, 'Higher education sector': 0.33, 'Private non-profit sector': 0.01 },
      2016: { 'All Sectors': 1.18, 'Business enterprise sector': 0.63, 'Government sector': 0.22, 'Higher education sector': 0.32, 'Private non-profit sector': 0.01 },
      2017: { 'All Sectors': 1.20, 'Business enterprise sector': 0.66, 'Government sector': 0.21, 'Higher education sector': 0.32, 'Private non-profit sector': 0.01 },
      2018: { 'All Sectors': 1.23, 'Business enterprise sector': 0.70, 'Government sector': 0.21, 'Higher education sector': 0.31, 'Private non-profit sector': 0.01 },
      2019: { 'All Sectors': 1.24, 'Business enterprise sector': 0.70, 'Government sector': 0.21, 'Higher education sector': 0.32, 'Private non-profit sector': 0.01 },
      2020: { 'All Sectors': 1.40, 'Business enterprise sector': 0.78, 'Government sector': 0.24, 'Higher education sector': 0.37, 'Private non-profit sector': 0.01 },
      2021: { 'All Sectors': 1.40, 'Business enterprise sector': 0.78, 'Government sector': 0.24, 'Higher education sector': 0.37, 'Private non-profit sector': 0.01 },
      2022: { 'All Sectors': 1.41, 'Business enterprise sector': 0.79, 'Government sector': 0.24, 'Higher education sector': 0.37, 'Private non-profit sector': 0.01 },
      2023: { 'All Sectors': 1.49, 'Business enterprise sector': 0.84, 'Government sector': 0.24, 'Higher education sector': 0.40, 'Private non-profit sector': 0.01 }
    };
    
    if (yearNum in spainValues && sectorName in spainValues[yearNum]) {
      if (dataDisplayType === 'percent_gdp') {
        value = spainValues[yearNum][sectorName];
      } else {
        // Para miles de euros, convertimos el porcentaje del PIB a un valor aproximado
        // Este es un cálculo aproximado y podría requerir ajustes
        // En gdp_consolidado.csv se usa la columna "Approx_RD_Investment_million_euro" para esto
        
        // Valores del PIB de España por año (en millones de euros)
        const spainGDP: Record<number, number> = {
          2013: 1025652,
          2014: 1038949,
          2015: 1087112,
          2016: 1122967,
          2017: 1170024,
          2018: 1212276,
          2019: 1253710,
          2020: 1129214,
          2021: 1235474,
          2022: 1373629,
          2023: 1498324
        };
        
        if (yearNum in spainGDP) {
          // Convertir el porcentaje a miles de euros
          // % PIB / 100 * PIB (millones) * 1000 = miles de euros
          value = (spainValues[yearNum][sectorName] / 100) * spainGDP[yearNum] * 1000;
        }
      }
    }
    
    return value;
  } catch (error) {
    console.error("Error al obtener datos de España desde gdp_consolidado.csv:", error);
    
    // Si hay algún error, volvemos al método original
    const spainData = data.filter(item => {
      const normalizedSector = sectorId.toLowerCase();
      let sectorToFind = '_T';
      
      switch (normalizedSector) {
        case 'business': sectorToFind = 'EMPRESAS'; break;
        case 'government': sectorToFind = 'ADMINISTRACION_PUBLICA'; break;
        case 'education': sectorToFind = 'ENSENIANZA_SUPERIOR'; break;
        case 'nonprofit': sectorToFind = 'IPSFL'; break;
        case 'total': sectorToFind = '_T'; break;
      }
      
      return item["Año"] === year && item["Sector Id"] === `(${sectorToFind})`;
    });
    
    if (spainData.length === 0) return null;
    
    let sum = 0;
    let count = 0;
    
    for (const item of spainData) {
      if (dataDisplayType === 'percent_gdp') {
        const value = parseFloat(item['% PIB I+D'].replace(',', '.'));
        if (!isNaN(value)) {
          sum += value;
          count++;
        }
      } else {
        const value = parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.'));
        if (!isNaN(value)) {
          sum += value;
          count++;
        }
      }
    }
    
    return count > 0 ? sum / count : null;
  }
}

// Función para obtener el valor de Canarias
function getCanariasValue(data: AutonomousCommunityData[], year: string, sectorId: string, dataDisplayType: DataDisplayType): number | null {
  // Filtrar datos para Canarias en el año y sector especificados
  const canariasData = data.filter(item => {
    // Normalizar el sector seleccionado
    const normalizedSector = sectorId.toLowerCase();
    let sectorToFind = '_T'; // Total/All sectors por defecto
    
    switch (normalizedSector) {
      case 'business':
        sectorToFind = 'EMPRESAS';
        break;
      case 'government':
        sectorToFind = 'ADMINISTRACION_PUBLICA';
        break;
      case 'education':
        sectorToFind = 'ENSENIANZA_SUPERIOR';
        break;
      case 'nonprofit':
        sectorToFind = 'IPSFL';
        break;
      case 'total':
        sectorToFind = '_T';
        break;
    }
    
    // Verificar que sea Canarias, el año y sector correctos
    return normalizarTexto(item["Comunidad Limpio"]) === "canarias" && 
           item["Año"] === year && 
           item["Sector Id"] === `(${sectorToFind})`;
  });
  
  if (canariasData.length === 0) return null;
  
  // Obtener el valor según el tipo de visualización
  if (dataDisplayType === 'percent_gdp') {
    const valueStr = canariasData[0]['% PIB I+D'];
    return parseFloat(valueStr.replace(',', '.'));
  } else {
    const valueStr = canariasData[0]['Gasto en I+D (Miles €)'];
    return parseFloat(valueStr.replace(',', '.'));
  }
}

// Función para obtener el valor del año anterior
function getPreviousYearValue(
  feature: GeoJsonFeature,
  data: AutonomousCommunityData[],
  previousYear: string,
  selectedSector: string,
  language: 'es' | 'en',
  dataDisplayType: DataDisplayType
): number | null {
  return getCommunityValue(feature, data, previousYear, selectedSector, language, dataDisplayType);
}

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
      
      // Función para crear un tooltip de nivel global
      const createGlobalTooltip = (): HTMLElement => {
        // Verificar si ya existe un tooltip global
        let tooltipElement = document.getElementById('global-map-tooltip');
        
        if (!tooltipElement) {
          // Crear nuevo tooltip y agregarlo al body
          tooltipElement = document.createElement('div');
          tooltipElement.id = 'global-map-tooltip';
          tooltipElement.className = 'map-tooltip'; // Clase para poder aplicar estilos
          
          // Aplicar estilos base manualmente
          Object.assign(tooltipElement.style, {
            position: 'fixed',
            display: 'none',
            opacity: '0',
            zIndex: '999999',
            pointerEvents: 'none',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '0', // No aplicamos padding aquí porque lo aplicaremos en las clases internas
            minWidth: '150px',
            maxWidth: '280px',
            border: '1px solid #e2e8f0',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            transition: 'opacity 0.15s ease-in-out'
          });
          
          document.body.appendChild(tooltipElement);
          
          // Crear hoja de estilo inline para las clases de Tailwind
          const styleSheet = document.createElement('style');
          styleSheet.id = 'tooltip-styles';
          styleSheet.textContent = `
            #global-map-tooltip .text-green-600 { color: #059669; }
            #global-map-tooltip .text-red-600 { color: #DC2626; }
            #global-map-tooltip .bg-blue-50 { background-color: #EFF6FF; }
            #global-map-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
            #global-map-tooltip .border-blue-100 { border-color: #DBEAFE; }
            #global-map-tooltip .border-gray-100 { border-color: #F3F4F6; }
            #global-map-tooltip .text-gray-500 { color: #6B7280; }
            #global-map-tooltip .text-blue-700 { color: #1D4ED8; }
            #global-map-tooltip .text-gray-800 { color: #1F2937; }
            #global-map-tooltip .text-gray-600 { color: #4B5563; }
            #global-map-tooltip .text-yellow-500 { color: #F59E0B; }
            #global-map-tooltip .rounded-lg { border-radius: 0.5rem; }
            #global-map-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            #global-map-tooltip .p-3 { padding: 0.75rem; }
            #global-map-tooltip .p-4 { padding: 1rem; }
            #global-map-tooltip .p-2 { padding: 0.5rem; }
            #global-map-tooltip .pt-3 { padding-top: 0.75rem; }
            #global-map-tooltip .mb-3 { margin-bottom: 0.75rem; }
            #global-map-tooltip .mb-1 { margin-bottom: 0.25rem; }
            #global-map-tooltip .mb-4 { margin-bottom: 1rem; }
            #global-map-tooltip .mr-1 { margin-right: 0.25rem; }
            #global-map-tooltip .mr-2 { margin-right: 0.5rem; }
            #global-map-tooltip .mt-1 { margin-top: 0.25rem; }
            #global-map-tooltip .text-xs { font-size: 0.75rem; }
            #global-map-tooltip .text-sm { font-size: 0.875rem; }
            #global-map-tooltip .text-lg { font-size: 1.125rem; }
            #global-map-tooltip .text-xl { font-size: 1.25rem; }
            #global-map-tooltip .font-bold { font-weight: 700; }
            #global-map-tooltip .font-medium { font-weight: 500; }
            #global-map-tooltip .flex { display: flex; }
            #global-map-tooltip .items-center { align-items: center; }
            #global-map-tooltip .justify-between { justify-content: space-between; }
            #global-map-tooltip .w-8 { width: 2rem; }
            #global-map-tooltip .h-6 { height: 1.5rem; }
            #global-map-tooltip .w-36 { width: 9rem; }
            #global-map-tooltip .rounded { border-radius: 0.25rem; }
            #global-map-tooltip .rounded-md { border-radius: 0.375rem; }
            #global-map-tooltip .overflow-hidden { overflow: hidden; }
            #global-map-tooltip .border-t { border-top-width: 1px; }
            #global-map-tooltip .border-b { border-bottom-width: 1px; }
            #global-map-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
            #global-map-tooltip .max-w-xs { max-width: 20rem; }
            #global-map-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
            #global-map-tooltip .w-full { width: 100%; }
            #global-map-tooltip .h-full { height: 100%; }
            #global-map-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
            #global-map-tooltip .flag-container { min-width: 2rem; min-height: 1.5rem; }
          `;
          document.head.appendChild(styleSheet);
        }
        
        return tooltipElement;
      };

      // Crear tooltip global
      const globalTooltip = createGlobalTooltip();

      // Función para posicionar el tooltip global
      const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
        const tooltipEl = globalTooltip;
        if (!tooltipEl) return;
        
        // Actualizar contenido - Asegurarnos que el HTML se aplica correctamente
        tooltipEl.innerHTML = content;
        
        // Aplicar estilos base - Asegurar que el tooltip sea visible y con estilos correctos
        Object.assign(tooltipEl.style, {
          position: 'fixed',
          display: 'block',
          opacity: '1',
          zIndex: '999999',
          pointerEvents: 'none',
          transition: 'opacity 0.15s'
        });
        
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;
        
        // Obtener posición del mouse
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Calcular posición del tooltip
        let left = mouseX + 15;
        let top = mouseY - tooltipHeight / 2;
        
        // Ajustar posición si se sale de la ventana
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left + tooltipWidth > windowWidth) {
          left = mouseX - tooltipWidth - 15;
        }
        
        if (top + tooltipHeight > windowHeight) {
          top = mouseY - tooltipHeight - 15;
        }
        
        if (top < 0) {
          top = 15;
        }
        
        // Establecer posición y visibilidad
        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      };

      // Función para manejar el evento mouseover común para ambas regiones
      function handleMouseOver(this: d3.BaseType, event: MouseEvent, d: GeoJsonFeature): void {
        // Destacar comunidad al pasar el mouse
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
        
        // Obtener datos de la comunidad
        const communityName = getCommunityName(d, language);
        const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language, dataDisplayType);
        const rank = getCommunityRank(d);
        
        // Obtener la URL de la bandera
        const flagUrl = getCommunityFlagUrl(communityName);

        // Obtener valores adicionales para comparativas
        const spainValue = getSpainAverage(data, selectedYear.toString(), selectedSector, dataDisplayType);
        const canariasValue = getCanariasValue(data, selectedYear.toString(), selectedSector, dataDisplayType);
        
        // Obtener valor del año anterior para calcular variación YoY
        const prevYearValue = getPreviousYearValue(d, data, (selectedYear - 1).toString(), selectedSector, language, dataDisplayType);
        const hasYoYData = value !== null && prevYearValue !== null;
        const yoyChange = hasYoYData ? ((value - prevYearValue) / prevYearValue) * 100 : null;
        const yoyIsPositive = yoyChange !== null && yoyChange > 0;
        
        // Construir contenido del tooltip con estilos inline para mayor compatibilidad
        let tooltipContent = `
          <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <!-- Cabecera con bandera y nombre -->
            <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
              ${flagUrl ? 
                `<div class="w-8 h-6 mr-2 rounded overflow-hidden border border-gray-200">
                  <img src="${flagUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${communityName}" />
                 </div>` 
                : ''}
              <h3 class="text-lg font-bold text-gray-800">${communityName}</h3>
            </div>
            
            <!-- Contenido principal -->
            <div class="p-4">
        `;
        
        if (value !== null) {
          tooltipContent += `
            <!-- Métrica principal -->
            <div class="mb-3">
              <div class="flex items-center text-gray-500 text-sm mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                <span>${t.rdInvestment}:</span>
              </div>
              <div class="flex items-center">
                <span class="text-xl font-bold text-blue-700">
                  ${dataDisplayType === 'percent_gdp' 
                    ? `${value.toFixed(2)}%` 
                    : formatNumberWithThousandSeparator(value, 0) + ' mil €'}
                </span>
                <span class="ml-1 text-sm text-gray-500">
                  ${dataDisplayType === 'percent_gdp' ? t.ofGDP : ''}
                </span>
              </div>
          `;
          
          // Añadir variación YoY si está disponible
          if (hasYoYData && yoyChange !== null) {
            tooltipContent += `
              <div class="${yoyIsPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <path d="${yoyIsPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                </svg>
                <span>${yoyIsPositive ? '+' : ''}${yoyChange.toFixed(2)}% vs ${selectedYear - 1}</span>
              </div>
            `;
          }
          
          tooltipContent += `</div>`;
          
          // Añadir ranking si está disponible
          if (rank) {
            tooltipContent += `
              <!-- Ranking -->
              <div class="mb-4">
                <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                  <span class="font-medium">Rank </span>
                  <span class="font-bold text-lg mx-1">${rank.rank}</span>
                  <span class="text-gray-600">${language === 'es' ? `de ${rank.total}` : `of ${rank.total}`}</span>
                </div>
              </div>
            `;
          }
          
          // Añadir comparativas
          tooltipContent += `
            <!-- Comparativas -->
            <div class="space-y-2 border-t border-gray-100 pt-3">
              <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
          `;
          
          // Comparativa con España
          if (spainValue !== null && value !== null) {
            const spainDiff = value - spainValue;
            const spainPercent = (spainDiff / spainValue) * 100;
            const isSpainPositive = spainDiff > 0;
            
            tooltipContent += `
              <!-- vs España -->
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-36">
                  vs ${language === 'es' ? 'España' : 'Spain'} (${dataDisplayType === 'percent_gdp' ? spainValue.toFixed(2) + '%' : formatNumberWithThousandSeparator(spainValue, 0) + ' mil €'}):
                </span>
                <span class="font-medium ${isSpainPositive ? 'text-green-600' : 'text-red-600'}">
                  ${isSpainPositive ? '+' : ''}${spainPercent.toFixed(1)}%
                </span>
              </div>
            `;
          }
          
          // Comparativa con Canarias
          if (canariasValue !== null && value !== null && normalizarTexto(communityName) !== "canarias") {
            const canariasDiff = value - canariasValue;
            const canariasPercent = (canariasDiff / canariasValue) * 100;
            const isCanariasPositive = canariasDiff > 0;
            
            tooltipContent += `
              <!-- vs Canarias -->
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-36">
                  vs ${language === 'es' ? 'Canarias' : 'Canary Islands'} (${dataDisplayType === 'percent_gdp' ? canariasValue.toFixed(2) + '%' : formatNumberWithThousandSeparator(canariasValue, 0) + ' mil €'}):
                </span>
                <span class="font-medium ${isCanariasPositive ? 'text-green-600' : 'text-red-600'}">
                  ${isCanariasPositive ? '+' : ''}${canariasPercent.toFixed(1)}%
                </span>
              </div>
            `;
          }
          
          // PIB y gasto para contextualizar (solo en modo porcentaje del PIB)
          if (dataDisplayType === 'percent_gdp') {
            // Intentar obtener PIB y Gasto de los datos
            const communityData = data.find((item: AutonomousCommunityData) => 
              normalizarTexto(item["Comunidad Limpio"]) === normalizarTexto(communityName) &&
              item["Año"] === selectedYear.toString() &&
              item["Sector Id"] === `(${selectedSector === 'total' ? '_T' : selectedSector.toUpperCase()})`
            );
            
            if (communityData) {
              const gdpValue = parseFloat(communityData["PIB (Miles €)"].replace(',', '.'));
              const spendingValue = parseFloat(communityData["Gasto en I+D (Miles €)"].replace(',', '.'));
              
              if (!isNaN(gdpValue) && !isNaN(spendingValue)) {
                tooltipContent += `
                  <!-- Datos adicionales de contexto -->
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-xs text-gray-700">
                      <div class="flex justify-between items-center mb-1">
                        <span>PIB:</span>
                        <span class="font-medium">${formatNumberWithThousandSeparator(gdpValue / 1000000, 2)} ${language === 'es' ? 'mill. €' : 'M€'}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span>${language === 'es' ? 'Gasto I+D:' : 'R&D Spend:'}</span>
                        <span class="font-medium">${formatNumberWithThousandSeparator(spendingValue, 0)} ${language === 'es' ? 'mil €' : 'k€'}</span>
                      </div>
                    </div>
                  </div>
                `;
              }
            }
          }
          
          tooltipContent += `
            </div>
          `;
          
        } else {
          tooltipContent += `
            <div class="flex justify-center items-center py-4">
              <div class="text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>${t.noData}</span>
              </div>
            </div>
          `;
        }
        
        tooltipContent += `
          </div>
        `;
        
        // Mostrar tooltip global
        positionGlobalTooltip(event, tooltipContent);
      }

      // Función para manejar el evento mousemove común para ambas regiones
      function handleMouseMove(this: d3.BaseType, event: MouseEvent): void {
        const tooltipEl = globalTooltip;
        if (!tooltipEl) return;
        
        // Obtener posición del mouse
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;
        
        // Calcular posición del tooltip
        let left = mouseX + 15;
        let top = mouseY - tooltipHeight / 2;
        
        // Ajustar posición si se sale de la ventana
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left + tooltipWidth > windowWidth) {
          left = mouseX - tooltipWidth - 15;
        }
        
        if (top + tooltipHeight > windowHeight) {
          top = mouseY - tooltipHeight - 15;
        }
        
        if (top < 0) {
          top = 15;
        }
        
        // Establecer posición y visibilidad
        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      }

      // Función para manejar el evento mouseout común para ambas regiones
      function handleMouseOut(this: d3.BaseType): void {
        // Restaurar estilo al quitar el mouse
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5);
        
        // Ocultar tooltip global
        const tooltipEl = globalTooltip;
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }

      // Dibujar comunidades autónomas de la península
      mapGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.mainland')
        .data(mainlandFeatures)
        .enter()
        .append('path')
        .attr('d', (d) => pathGeneratorMainland(d) as string)
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
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          // Si hay una función onClick, llamarla con el nombre de la comunidad
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar Islas Canarias
      canariasGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.canarias')
        .data(canariasFeatures)
        .enter()
        .append('path')
        .attr('d', (d) => pathGeneratorCanarias(d) as string)
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
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
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
    
    // Ejecutar renderMap
    renderMap();
    
    // Limpieza: remover tooltip global al desmontar
    return () => {
      const globalTooltip = document.getElementById('global-map-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
    };
  }, [geoJson, data, selectedYear, selectedSector, language, dataDisplayType, onClick]);
  
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
          </div>
        </>
      )}
    </div>
  );
};

export default SpanishRegionsMap; 