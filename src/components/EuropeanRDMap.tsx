import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
import { SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';
// Para usar las banderas SVG, debes importarlas del archivo logos/country-flags.tsx
// import { FlagSpain, FlagEU, FlagCanaryIslands, FlagSweden, FlagFinland } from '../logos/country-flags';

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

// Interfaz para los datos de etiquetas
interface LabelData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Label: string;
}

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

interface EuropeanRDMapProps {
  data: EuropeCSVData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
  labels?: LabelData[]; // Añadir la propiedad de etiquetas
  autonomousCommunitiesData?: AutonomousCommunityData[]; // Datos de comunidades autónomas
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
    ZERO: '#666666',           // Gris fuerte para países con 0.00%
    MIN: d3.color(baseColor)?.brighter(1.5)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1)?.toString() || '#d0d0d0',    // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(0.7)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.2)?.toString() || '#707070',    // Muy oscuro
  };
};

// Textos localizados para el mapa
type MapTexts = {
  es: {
    [key: string]: string;
  };
  en: {
    [key: string]: string;
  };
};

const mapTexts: MapTexts = {
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

// Función para obtener el valor de la UE
function getEUValue(data: EuropeCSVData[], yearStr: string, sector: string): number | null {
  const euData = data.filter(item => {
    const isEU = (item.Country && normalizarTexto(String(item.Country)).includes('european union')) || 
              (item.País && normalizarTexto(String(item.País)).includes('union europea'));
    const yearMatch = item.Year === yearStr;
    const sectorMatch = item.Sector === sector;
    return isEU && yearMatch && sectorMatch;
  });
  
  if (euData.length === 0) return null;
  
  try {
    return parseFloat(String(euData[0]['%GDP']).replace(',', '.'));
  } catch {
    return null;
  }
}

// Función para obtener el valor de España
function getSpainValue(data: EuropeCSVData[], yearStr: string, sector: string): number | null {
  const spainData = data.filter(item => {
    const isSpain = (item.Country && normalizarTexto(String(item.Country)).includes('spain')) || 
                  (item.País && normalizarTexto(String(item.País)).includes('espana') || 
                   item.País && normalizarTexto(String(item.País)).includes('españa'));
    const yearMatch = item.Year === yearStr;
    const sectorMatch = item.Sector === sector;
    return isSpain && yearMatch && sectorMatch;
  });
  
  if (spainData.length === 0) return null;
  
  try {
    return parseFloat(String(spainData[0]['%GDP']).replace(',', '.'));
  } catch {
    return null;
  }
}

// Función para obtener el valor de Canarias
function getCanariasValue(data: AutonomousCommunityData[], yearStr: string, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar Canarias en los datos de comunidades autónomas
  const canariasData = data.filter(item => {
    const isCommunity = normalizarTexto(item["Comunidad Limpio"]) === "canarias";
    const yearMatch = item["Año"] === yearStr;
    const sectorMatch = item["Sector"] === sector;
    return isCommunity && yearMatch && sectorMatch;
  });
  
  if (canariasData.length === 0) return null;
  
  try {
    return parseFloat(String(canariasData[0]["% PIB I+D"]).replace(',', '.'));
  } catch {
    return null;
  }
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
  
  // Verificar si ya tenemos el nombre completo del sector (como 'Business enterprise sector')
  // o si tenemos que mapearlo (como 'business')
  let sectorNameEn = selectedSector;
  
  // Si parece ser un ID de sector corto (business, government, etc.), lo mapeamos al nombre completo
  if (['total', 'all', 'business', 'government', 'education', 'nonprofit'].includes(selectedSector.toLowerCase())) {
    const sectorNameMapping: Record<string, string> = {
      'total': 'All Sectors',
      'all': 'All Sectors',
      'business': 'Business enterprise sector',
      'government': 'Government sector',
      'education': 'Higher education sector',
      'nonprofit': 'Private non-profit sector'
    };
    sectorNameEn = sectorNameMapping[selectedSector.toLowerCase()] || 'All Sectors';
  }
  
  console.log(`Buscando datos para: País=${countryName}, ISO3=${countryIso3}, Año=${selectedYear}, Sector=${sectorNameEn}`);

  // 1. Intentar coincidir primero por ISO3 (prioridad)
  let countryData: EuropeCSVData[] = [];
  if (countryIso3) {
    countryData = data.filter(d => {
    const iso3Match = d.ISO3 && countryIso3 && 
                    normalizarTexto(d.ISO3) === normalizarTexto(countryIso3);
    return iso3Match;
  });
  }

  // 2. Si no hay coincidencia por ISO3, intentar por nombre
  if (countryData.length === 0) {
    countryData = data.filter(d => {
      const nameMatch = (d.Country || d.País) && countryName && 
        (normalizarTexto(d.Country || '') === normalizarTexto(countryName) ||
         normalizarTexto(d.País || '') === normalizarTexto(countryName));
      return nameMatch;
    });
  }

  if (countryData.length === 0) {
    // Si no se encuentra ningún dato para este país, devolver null
    return null;
  }

  // Filtrar por año y sector
  const filteredByYear = countryData.filter(d => {
    return d.Year && selectedYear && 
      d.Year.toString().trim() === selectedYear.toString().trim();
  });

  if (filteredByYear.length === 0) {
    // Si no se encuentra ningún dato para este año, devolver null
    return null;
  }

  // Filtrar por sector específico
  const filteredData = filteredByYear.filter(d => {
    const sectorMatch = d.Sector && 
      (sectorNameEn === 'All Sectors' || 
       normalizarTexto(d.Sector) === normalizarTexto(sectorNameEn));
    console.log(`Comprobando sector: ${d.Sector} con ${sectorNameEn}, coincide: ${sectorMatch}`);
    return sectorMatch;
  });

  if (filteredData.length === 0) {
    console.log(`No se encontraron datos para el sector ${sectorNameEn} del país ${countryName}`);
    // Si no se encuentra ningún dato para este sector específico, devolver null
    // Esto es importante para distinguir entre "sin datos" y "valor cero"
    return null;
  }

  // Usar el campo value o %GDP si está disponible
  const dataPoint = filteredData[0];
  const valueStr = dataPoint['%GDP'] || dataPoint.Value || '';
  
  console.log(`Valor encontrado para ${countryName}, sector ${sectorNameEn}: "${valueStr}"`);
  
  if (valueStr === undefined || valueStr === '') {
    console.log(`Valor vacío para ${countryName}, se devuelve null`);
    return null;
  }

  try {
    // Convertir a número y manejar decimales con coma o punto
    const valueNum = parseFloat(String(valueStr).replace(',', '.'));
    
    // Si el valor no es un número válido, considerarlo como "sin datos" (null)
    if (isNaN(valueNum)) {
      console.log(`Valor no numérico para ${countryName}: ${valueStr}, se devuelve null`);
      return null;
    }
    
    console.log(`Valor numérico para ${countryName}: ${valueNum}`);
    return valueNum;
  } catch (error) {
    console.log(`Error al procesar valor para ${countryName}: ${error}`);
    return null;
  }
}

// Crear una función para obtener los rangos de valores de un sector específico
function getSectorValueRange(data: EuropeCSVData[], selectedYear: string, selectedSector: string): { min: number, max: number } {
  // Valores predeterminados en caso de no tener datos
  const defaultRange = { min: 0, max: 3.5 };
  
  if (!data || data.length === 0) return defaultRange;
  
  // Verificar si ya tenemos el nombre completo del sector o si necesitamos convertirlo
  let sectorNameEn = selectedSector;
  
  // Si parece ser un ID de sector corto, convertirlo al nombre completo
  if (['total', 'all', 'business', 'government', 'education', 'nonprofit'].includes(selectedSector.toLowerCase())) {
    const sectorNameMapping: Record<string, string> = {
      'total': 'All Sectors',
      'all': 'All Sectors',
      'business': 'Business enterprise sector',
      'government': 'Government sector',
      'education': 'Higher education sector',
      'nonprofit': 'Private non-profit sector'
    };
    sectorNameEn = sectorNameMapping[selectedSector.toLowerCase()] || 'All Sectors';
  }
  
  // Filtrar por año y sector seleccionados
  const filteredData = data.filter(d => {
    const yearMatch = d.Year && d.Year.toString().trim() === selectedYear.trim();
    const sectorMatch = d.Sector && 
                      (sectorNameEn === 'All Sectors' || 
                       normalizarTexto(d.Sector) === normalizarTexto(sectorNameEn));
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

// Obtiene el color para un valor dado basado en la paleta de colores
function getColorForValue(
  value: number | null, 
  selectedSector: string, 
  data: EuropeCSVData[] = [], 
  selectedYear: string = ''
): string {
  // Log inicial para depuración
  console.log(`getColorForValue llamado con: valor=${value}, sector=${selectedSector}, año=${selectedYear}, datos=${data.length}`);
  
  // Si no hay datos, usar el color NULL
  if (value === null || value === undefined) {
    console.log(`getColorForValue: valor null o undefined, usando color NULL para ${selectedSector}`);
    return getSectorPalette(selectedSector).NULL;
  }
  
  // Si el valor es exactamente 0, usar el color ZERO
  if (value === 0 || value === 0.0 || value.toString() === '0' || value.toString() === '0.0') {
    console.log(`getColorForValue: valor exactamente 0, usando color ZERO para ${selectedSector}`);
    return getSectorPalette(selectedSector).ZERO;
  }

  // Para valores positivos, asignar color según su valor
  const palette = getSectorPalette(selectedSector);
  
  // Si no tenemos datos para calcular rangos, usar valores por defecto
  if (!data || !data.length || !selectedYear) {
    console.log(`getColorForValue: usando rangos por defecto para valor=${value}`);
    if (value < 1.0) {
      return palette.MIN;
    } else if (value < 1.8) {
      return palette.LOW;
    } else if (value < 2.5) {
      return palette.MID;
    } else {
      return palette.HIGH;
    }
  }
  
  try {
    // Calcular rangos basados en los datos disponibles
    const range = getSectorValueRange(data, selectedYear, selectedSector);
    console.log(`getColorForValue: calculando rangos - min=${range.min}, max=${range.max}`);
    
    // Si no hay suficiente rango, usar valores predeterminados
    if (range.max <= range.min || range.max - range.min < 0.001) {
      console.log(`getColorForValue: rango insuficiente, usando valores por defecto`);
      if (value < 1.0) {
        return palette.MIN;
      } else if (value < 1.8) {
        return palette.LOW;
      } else if (value < 2.5) {
        return palette.MID;
      } else {
        return palette.HIGH;
      }
    }
    
    // Calcular rangos basados en min y max
    const step = (range.max - range.min) / 4;
    const threshold1 = range.min + step;
    const threshold2 = range.min + 2 * step;
    const threshold3 = range.min + 3 * step;
    
    console.log(`getColorForValue: umbrales - t1=${threshold1}, t2=${threshold2}, t3=${threshold3}`);
    
    // Asignar color según el rango
    let colorUsed;
    if (value <= threshold1) {
      colorUsed = palette.MIN;
      console.log(`getColorForValue: valor ${value} <= ${threshold1}, usando color MIN`);
    } else if (value <= threshold2) {
      colorUsed = palette.LOW;
      console.log(`getColorForValue: valor ${value} <= ${threshold2}, usando color LOW`);
    } else if (value <= threshold3) {
      colorUsed = palette.MID;
      console.log(`getColorForValue: valor ${value} <= ${threshold3}, usando color MID`);
    } else {
      colorUsed = palette.HIGH;
      console.log(`getColorForValue: valor ${value} > ${threshold3}, usando color HIGH`);
    }
    
    return colorUsed;
  } catch (error) {
    console.error(`Error en getColorForValue: ${error}`);
    // En caso de error, usar valores por defecto
    if (value < 1.0) {
      return palette.MIN;
    } else if (value < 1.8) {
      return palette.LOW;
    } else if (value < 2.5) {
      return palette.MID;
    } else {
      return palette.HIGH;
    }
  }
}

// Función para obtener la descripción de una etiqueta
function getLabelDescription(label: string, language: 'es' | 'en'): string {
  const descriptions: Record<string, {es: string, en: string}> = {
    'e': {
      es: 'Estimado',
      en: 'Estimated'
    },
    'p': {
      es: 'Provisional',
      en: 'Provisional'
    },
    'd': {
      es: 'Definición difiere',
      en: 'Definition differs'
    },
    'b': {
      es: 'Ruptura en series temporales',
      en: 'Break in time series'
    },
    'dp': {
      es: 'Definición difiere, provisional',
      en: 'Definition differs, provisional'
    },
    'ep': {
      es: 'Estimado, provisional',
      en: 'Estimated, provisional'
    },
    'bp': {
      es: 'Ruptura en series temporales, provisional',
      en: 'Break in time series, provisional'
    },
    'bd': {
      es: 'Ruptura en series temporales, definición difiere',
      en: 'Break in time series, definition differs'
    },
    'de': {
      es: 'Definición difiere, estimado',
      en: 'Definition differs, estimated'
    },
    'u': {
      es: 'Baja fiabilidad',
      en: 'Low reliability'
    }
  };
  
  return descriptions[label] ? descriptions[label][language] : '';
}

// Función para obtener la URL de la bandera de un país
function getCountryFlagUrl(countryName: string, feature?: GeoJsonFeature): string {  
  if (!countryName) return "https://flagcdn.com/un.svg"; // Bandera ONU por defecto
  
  // 1. Primero buscar por ISO3 si está disponible en el feature
  if (feature) {
    const iso3 = getCountryIso3(feature);
    if (iso3) {
      // Buscar en countryFlags por ISO3
      const flagItem = countryFlags.find(flag => flag.iso3 === iso3);
      if (flagItem) {
        return flagItem.flag;
      }
    }
  }
  
  // Si no tenemos feature o no encontramos por ISO3, seguimos con el método anterior
  const normalizedName = normalizarTexto(countryName);
  
  // 2. Casos especiales
  if (normalizedName.includes('union europea') || normalizedName.includes('european union')) {
    return "https://flagcdn.com/eu.svg"; // La UE tiene un código especial en flagcdn
  } else if (normalizedName.includes('zona euro') || normalizedName.includes('euro area')) {
    return "https://flagcdn.com/eu.svg"; // Usamos también la bandera de la UE para la zona euro
  } else if (normalizedName.includes('espana') || normalizedName.includes('españa') || normalizedName.includes('spain')) {
    return "https://flagcdn.com/es.svg";
  } else if (normalizedName.includes('alemania') || normalizedName.includes('germany')) {
    return "https://flagcdn.com/de.svg";
  } else if (normalizedName.includes('francia') || normalizedName.includes('france')) {
    return "https://flagcdn.com/fr.svg";
  } else if (normalizedName.includes('reino unido') || normalizedName.includes('united kingdom') || normalizedName.includes('uk')) {
    return "https://flagcdn.com/gb.svg";
  } else if (normalizedName.includes('italia') || normalizedName.includes('italy')) {
    return "https://flagcdn.com/it.svg";
  } else if (normalizedName.includes('suecia') || normalizedName.includes('sweden')) {
    return "https://flagcdn.com/se.svg";
  } else if (normalizedName.includes('finlandia') || normalizedName.includes('finland')) {
    return "https://flagcdn.com/fi.svg";
  } else if (normalizedName.includes('canarias') || normalizedName.includes('canary islands')) {
    return "https://flagcdn.com/es-ct.svg"; // Usamos un código regional para Canarias
  } else if (normalizedName.includes('estados unidos') || normalizedName.includes('united states')) {
    return "https://flagcdn.com/us.svg";
  }
  // Nuevos casos específicos para países que no muestran correctamente su bandera
  else if (normalizedName.includes('belgica') || normalizedName.includes('belgium')) {
    return "https://flagcdn.com/be.svg";
  } else if (normalizedName.includes('dinamarca') || normalizedName.includes('denmark')) {
    return "https://flagcdn.com/dk.svg";
  } else if (normalizedName.includes('islandia') || normalizedName.includes('iceland')) {
    return "https://flagcdn.com/is.svg";
  } else if (normalizedName.includes('noruega') || normalizedName.includes('norway')) {
    return "https://flagcdn.com/no.svg";
  } else if (normalizedName.includes('eslovenia') || normalizedName.includes('slovenia')) {
    return "https://flagcdn.com/si.svg";
  } else if (normalizedName.includes('paises bajos') || normalizedName.includes('netherlands') || normalizedName.includes('holanda')) {
    return "https://flagcdn.com/nl.svg";
  } else if (normalizedName.includes('republica checa') || normalizedName.includes('czech') || normalizedName.includes('czechia')) {
    return "https://flagcdn.com/cz.svg";
  } else if (normalizedName.includes('polonia') || normalizedName.includes('poland')) {
    return "https://flagcdn.com/pl.svg";
  } else if (normalizedName.includes('grecia') || normalizedName.includes('greece')) {
    return "https://flagcdn.com/gr.svg";
  } else if (normalizedName.includes('croacia') || normalizedName.includes('croatia')) {
    return "https://flagcdn.com/hr.svg";
  } else if (normalizedName.includes('hungria') || normalizedName.includes('hungary')) {
    return "https://flagcdn.com/hu.svg";
  } else if (normalizedName.includes('lituania') || normalizedName.includes('lithuania')) {
    return "https://flagcdn.com/lt.svg";
  } else if (normalizedName.includes('eslovaquia') || normalizedName.includes('slovakia')) {
    return "https://flagcdn.com/sk.svg";
  } else if (normalizedName.includes('luxemburgo') || normalizedName.includes('luxembourg')) {
    return "https://flagcdn.com/lu.svg";
  } else if (normalizedName.includes('letonia') || normalizedName.includes('latvia')) {
    return "https://flagcdn.com/lv.svg";
  } else if (normalizedName.includes('chipre') || normalizedName.includes('cyprus')) {
    return "https://flagcdn.com/cy.svg";
  } else if (normalizedName.includes('rusia') || normalizedName.includes('russia')) {
    return "https://flagcdn.com/ru.svg";
  } else if (normalizedName.includes('corea del sur') || normalizedName.includes('south korea')) {
    return "https://flagcdn.com/kr.svg";
  } else if (normalizedName.includes('japon') || normalizedName.includes('japan')) {
    return "https://flagcdn.com/jp.svg";
  } else if (normalizedName.includes('suiza') || normalizedName.includes('switzerland')) {
    return "https://flagcdn.com/ch.svg";
  } else if (normalizedName.includes('macedonia del norte') || normalizedName.includes('north macedonia')) {
    return "https://flagcdn.com/mk.svg";
  } else if (normalizedName.includes('turquia') || normalizedName.includes('turkiye') || normalizedName.includes('turkey')) {
    return "https://flagcdn.com/tr.svg";
  }
  
  // 3. Si aún no encontramos, buscar en el JSON de banderas por nombre
  const countryData = countryFlags.find(country => {
    const normalizedCountry = normalizarTexto(country.country);
    return normalizedName.includes(normalizedCountry);
  });
  
  return countryData?.flag || "https://flagcdn.com/un.svg"; // Devolvemos un por defecto (Naciones Unidas)
}

// Añadir función para obtener el valor del año anterior
function getPreviousYearValue(data: EuropeCSVData[], countryIso3: string | undefined, countryName: string, yearStr: string, sector: string): number | null {
  if (!data || data.length === 0 || !yearStr || parseInt(yearStr) <= 1) return null;
  
  const previousYear = (parseInt(yearStr) - 1).toString();
  
  // Buscar por ISO3 si está disponible
  if (countryIso3) {
    const countryPrevYearData = data.filter(item => 
      item.ISO3 === countryIso3 && 
      item.Year === previousYear && 
      (item.Sector === sector || (item.Sector === 'All Sectors' && sector === 'All Sectors'))
    );
    
    if (countryPrevYearData.length > 0) {
      try {
        return parseFloat(countryPrevYearData[0]['%GDP'].replace(',', '.'));
      } catch {
        return null;
      }
    }
  }
  
  // Si no encontramos por ISO3, buscar por nombre
  const normalizedName = normalizarTexto(countryName);
  const countryPrevYearData = data.filter(item => {
    const nameMatch = 
      normalizarTexto(item.Country).includes(normalizedName) || 
      (item.País && normalizarTexto(item.País).includes(normalizedName));
    const yearMatch = item.Year === previousYear;
    const sectorMatch = item.Sector === sector || 
                       (item.Sector === 'All Sectors' && sector === 'All Sectors');
    return nameMatch && yearMatch && sectorMatch;
  });
  
  if (countryPrevYearData.length === 0) return null;
  
  try {
    return parseFloat(countryPrevYearData[0]['%GDP'].replace(',', '.'));
  } catch {
    return null;
  }
}

// Añadir una función para posicionar el tooltip inteligentemente
function positionTooltip(
  tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>, 
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

const EuropeanRDMap: React.FC<EuropeanRDMapProps> = ({ data, selectedYear, selectedSector, language, onClick, labels = [], autonomousCommunitiesData = [] }) => {
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
    
    // Determinar qué ID de sector usar para obtener el texto localizado
    let sectorId: string;
    
    // Si el selectedSector parece ser un nombre completo en inglés
    if (selectedSector.includes(' ')) {
      // Mapeo de nombres completos a IDs
      const sectorIdMapping: Record<string, string> = {
        'All Sectors': 'total',
        'Business enterprise sector': 'business',
        'Government sector': 'government',
        'Higher education sector': 'education',
        'Private non-profit sector': 'nonprofit'
      };
      sectorId = sectorIdMapping[selectedSector] || 'total';
    } else {
      // Es probablemente ya un ID (total, business, etc.)
      sectorId = selectedSector.toLowerCase();
      // Normalizar para asegurar compatibilidad
      if (sectorId === 'all') sectorId = 'total';
    }
    
    console.log(`Generando título para sector: ${selectedSector} -> ID: ${sectorId}`);
    
    const sectorKey = `sector_${sectorId}` as keyof typeof t;
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
      
      // Preparar datos para poder calcular el ranking
      const countryValues: Array<{ feature: GeoJsonFeature; value: number | null }> = [];
      
      // Primero, recopilamos todos los valores de los países
      geojsonData.features.forEach(feature => {
        const value = getCountryValueOptimized(feature);
        if (value !== null) {
          countryValues.push({ feature, value });
        }
      });
      
      // Ordenar países por valor de mayor a menor (para calcular ranking)
      const sortedCountries = countryValues
        .sort((a, b) => (b.value || 0) - (a.value || 0));
      
      // Función para obtener el ranking de un país
      const getCountryRank = (feature: GeoJsonFeature): { rank: number, total: number } | null => {
        const value = getCountryValueOptimized(feature);
        if (value === null) return null;
        
        const index = sortedCountries.findIndex(
          item => item.feature === feature
        );
        
        if (index === -1) return null;
        
        return {
          rank: index + 1, // +1 porque los índices empiezan en 0
          total: sortedCountries.length
        };
      };
      
      // Renderizar países
      mapGroup.selectAll('path')
        .data(geojsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: GeoJsonFeature) => path(d) || '')
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCountryValueOptimized(d);
          return getColorForValue(value, selectedSector, data, selectedYear.toString());
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'country')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          // Cambiar el estilo al pasar el mouse
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
          // Obtener el nombre del país en el idioma correspondiente
          let countryName;
          const countryIso3 = getCountryIso3(d);
          const feature = d.properties || {};
          
          // Buscar el país en los datos originales para obtener el nombre correcto
          const countryData = data.find(item => 
            (countryIso3 && item.ISO3 && normalizarTexto(item.ISO3) === normalizarTexto(countryIso3)) ||
            normalizarTexto(item.Country) === normalizarTexto(getCountryName(d))
          );
          
          if (language === 'es') {
            // Para español, intentar usar el nombre en español de los datos
            countryName = countryData?.País || feature.NAME_ES || getCountryName(d);
          } else {
            // Para inglés, usar el nombre en inglés de los datos
            countryName = countryData?.Country || feature.NAME_EN || feature.NAME || getCountryName(d);
          }
          
          const value = getCountryValueOptimized(d);
          
          // Obtener el ranking del país
          const rankInfo = getCountryRank(d);
          
          // Positioning directly with clientX/clientY for better accuracy
          const tooltip = d3.select('.country-tooltip');
          
          // Verificar si es España
          const isSpain = (countryName && (
            normalizarTexto(String(countryName)).includes('spain') || 
            normalizarTexto(String(countryName)).includes('espana') ||
            normalizarTexto(String(countryName)).includes('españa')
          ));
          
          // Verificar si es la UE
            const isEU = (countryName && (
              normalizarTexto(String(countryName)).includes('union europea') || 
              normalizarTexto(String(countryName)).includes('european union')
            ));
            
          // Verificar si es Canarias
          const isCanarias = (countryName && (
            normalizarTexto(String(countryName)).includes('canarias') || 
            normalizarTexto(String(countryName)).includes('canary islands')
          ));
          
          let tooltipContent = '';
          
          // Si no hay datos, mostrar un mensaje simple
          if (value === null) {
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                <div class="p-4">
                  <p class="text-gray-500">${t.noData}</p>
                </div>
              </div>
            `;
          } else if (value === 0) {
            // Caso especial para valores exactamente cero
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                <div class="p-4">
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>
                        ${language === 'es' ? 'Inversión I+D' : 'R&D Investment'}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">0.00%</span>
                      <span class="ml-1 text-gray-600 text-sm">${language === 'es' ? 'del PIB' : 'of GDP'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          } else {
            // Obtener valores para comparativas
            const euValue = !isEU ? getEUValue(data, selectedYear.toString(), selectedSector) : null;
            const spainValue = !isSpain ? getSpainValue(data, selectedYear.toString(), selectedSector) : null;
            const canariasValue = !isCanarias ? getCanariasValue(autonomousCommunitiesData, selectedYear.toString(), selectedSector) : null;
            const previousYearValue = getPreviousYearValue(data, d.properties?.iso_a3, String(countryName), selectedYear.toString(), selectedSector);
            
            // Preparar HTML para la comparación YoY
            let yoyComparisonHtml = '';
            if (previousYearValue !== null && previousYearValue > 0) {
              const difference = value - previousYearValue;
              const percentDiff = (difference / previousYearValue) * 100;
              const formattedDiff = percentDiff.toFixed(2);
              const isPositive = difference > 0;
              
              yoyComparisonHtml = `
                <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                    <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                  </svg>
                  <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
                </div>
              `;
            }
            
            // Preparar comparaciones
            let euComparisonHtml = '';
            if (!isEU && euValue !== null && euValue > 0) {
              const difference = value - euValue;
              const percentDiff = (difference / euValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              euComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? `vs UE (${euValue.toFixed(2)}%):` : `vs EU (${euValue.toFixed(2)}%):`}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (!isEU) {
              euComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? 'vs UE:' : 'vs EU:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            let spainComparisonHtml = '';
            if (!isSpain && spainValue !== null && spainValue > 0) {
              const difference = value - spainValue;
              const percentDiff = (difference / spainValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              spainComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? `vs España (${spainValue.toFixed(2)}%):` : `vs Spain (${spainValue.toFixed(2)}%):`}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (!isSpain) {
              spainComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? 'vs España:' : 'vs Spain:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            let canariasComparisonHtml = '';
            if (!isCanarias && canariasValue !== null && canariasValue > 0) {
              const difference = value - canariasValue;
              const percentDiff = (difference / canariasValue) * 100;
              const formattedDiff = percentDiff.toFixed(1);
              const isPositive = difference > 0;
              const color = isPositive ? 'text-green-600' : 'text-red-600';
              
              canariasComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? `vs Canarias (${canariasValue.toFixed(2)}%):` : `vs Canary Islands (${canariasValue.toFixed(2)}%):`}</span>
                  <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                </div>
              `;
            } else if (!isCanarias) {
              canariasComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-36">${language === 'es' ? 'vs Canarias:' : 'vs Canary Islands:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            // Buscar etiqueta para este país y año
            let label = '';
            if (labels && labels.length > 0) {
              // Buscar etiqueta para este país y sector
              const matchingLabel = labels.find(item => {
                // Normalizar nombres para comparación
                const itemCountryNormalized = normalizarTexto(String(item.Country || ''));
                const itemPaisNormalized = normalizarTexto(String(item.País || ''));
                const countryNameNormalized = normalizarTexto(String(countryName));
                
                // Verificar si coincide el país (en inglés o español)
                const countryMatches = 
                  itemCountryNormalized === countryNameNormalized ||
                  itemPaisNormalized === countryNameNormalized;
                
                // Verificar si coincide el año y sector
                const yearMatches = item.Year === selectedYear.toString();
                const sectorMatches = item.Sector === selectedSector;
                
                return countryMatches && yearMatches && sectorMatches;
              });
              
              if (matchingLabel && matchingLabel.Label) {
                label = matchingLabel.Label;
              }
            }
            
            // Renderizar el tooltip con el nuevo diseño
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <!-- Header con el nombre del país -->
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                
                <!-- Contenido principal -->
                <div class="p-4">
                  <!-- Métrica principal -->
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>
                        ${language === 'es' ? 'Inversión I+D' : 'R&D Investment'}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">${value.toFixed(2)}%</span>
                      <span class="ml-1 text-gray-600 text-sm">${language === 'es' ? 'del PIB' : 'of GDP'}</span>
                      ${label ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${label}</span>` : ''}
                    </div>
                    ${yoyComparisonHtml}
                  </div>
                  
                  <!-- Ranking (si está disponible) -->
                  ${rankInfo ? `
                  <div class="mb-4">
                    <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                      <span class="font-medium">Rank </span>
                      <span class="font-bold text-base mx-1">${rankInfo.rank}</span>
                      <span class="text-gray-600">${language === 'es' ? `de ${rankInfo.total}` : `of ${rankInfo.total}`}</span>
                    </div>
                  </div>
                  ` : ''}
                  
                  <!-- Comparativas -->
                  <div class="space-y-2 border-t border-gray-100 pt-3">
                    <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                    ${euComparisonHtml}
                    ${spainComparisonHtml}
                    ${canariasComparisonHtml}
                  </div>
                </div>
                
                <!-- Footer -->
                ${label && getLabelDescription(label, language) ? `
                  <div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    <span>${label} - ${getLabelDescription(label, language)}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }
          
          // Actualizar el contenido del tooltip y mostrarlo
          tooltip.html(tooltipContent)
            .style('display', 'block')
            .style('opacity', 1);
          
          // Posicionar el tooltip de manera inteligente
          const tooltipNode = document.querySelector('.country-tooltip') as HTMLElement;
          if (tooltipNode) {
            positionTooltip(tooltip, event, tooltipNode);
          }
        })
        .on('mousemove', function(event: MouseEvent) {
          // Actualizar posición del tooltip con suavidad usando clientX/clientY
          const tooltip = d3.select('.country-tooltip');
          const tooltipNode = document.querySelector('.country-tooltip') as HTMLElement;
          if (tooltipNode) {
            positionTooltip(tooltip, event, tooltipNode);
          }
        })
        .on('mouseout', function() {
          // Restaurar el estilo al quitar el mouse
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
            
          // Fade out tooltip
          const tooltip = d3.select('.country-tooltip');
          tooltip.style('opacity', 0);
          
          // Ocultar después de la transición
          setTimeout(() => {
            if (tooltip.style('opacity') === '0') {
              tooltip.style('display', 'none');
            }
          }, 100);
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
        .attr('transform', `translate(20, ${height - 170})`);
      
      const legend = [
        { color: colorPalette.NULL, label: String(t.noData) },
        { color: colorPalette.ZERO, label: `0.00%` },
        { color: colorPalette.MIN, label: `< ${formatValue(threshold1)}%` },
        { color: colorPalette.LOW, label: `${formatValue(threshold1)} - ${formatValue(threshold2)}%` },
        { color: colorPalette.MID, label: `${formatValue(threshold2)} - ${formatValue(threshold3)}%` },
        { color: colorPalette.HIGH, label: `${formatValue(threshold3)} - ${formatValue(threshold4)}%` },
        { color: colorPalette.MAX, label: `> ${formatValue(threshold4)}%` }
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
  }, [geojsonData, getCountryValueOptimized, language, onClick, colorPalette, valueRange, t, labels, autonomousCommunitiesData]);
  
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
        className="country-tooltip absolute z-50 pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed',
          opacity: 0,
          transition: 'opacity 0.1s ease-in-out',
          maxWidth: '300px'
        }}
      >
      </div>
    </div>
  );
};

export default EuropeanRDMap; 