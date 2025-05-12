import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Definición de los sectores de I+D
const rdSectors = [
  {
    id: 'total',
    code: '_T',
    name: {
      es: 'Total',
      en: 'Total'
    }
  },
  {
    id: 'business',
    code: 'BES',
    name: {
      es: 'Sector empresarial',
      en: 'Business enterprise sector'
    }
  },
  {
    id: 'government',
    code: 'GOV',
    name: {
      es: 'Administración Pública',
      en: 'Government sector'
    }
  },
  {
    id: 'education',
    code: 'HES',
    name: {
      es: 'Enseñanza Superior',
      en: 'Higher education sector'
    }
  },
  {
    id: 'nonprofit',
    code: 'PNP',
    name: {
      es: 'Instituciones privadas sin fines de lucro',
      en: 'Private non-profit sector'
    }
  }
];

// Interfaces para los datos
interface GastoIDComunidadesData {
  'Comunidad (Original)': string;
  'Comunidad Limpio': string;
  'Comunidad en Inglés': string;
  'Año': string;
  'Sector Id': string;
  'Sector': string;
  'Gasto en I+D (Miles €)': string;
  'PIB (Miles €)': string;
  '% PIB I+D': string;
  'Sector Nombre': string;
}

interface GDPConsolidadoData {
  Country?: string;
  País?: string;
  Year?: string;
  Sector?: string;
  'Approx_RD_Investment_million_euro'?: string;
  'GDP Current prices, million euro'?: string;
  '%GDP'?: string;
}

// Interfaz para resultados de Papa.parse
interface PapaParseResults<T> {
  data: T[];
  errors: Array<{type: string; code: string; message: string; row?: number}>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  };
}

// Interfaces para los datos procesados
interface SectorDataItem {
  name: string;
  value: number;
  color: string;
  sharePercentage?: number;
  regionName?: string;
  totalPib?: string;
  yoyChange?: number;
  monetaryValue?: number; // Valor monetario en millones de euros
  id?: string; // ID del sector
}

type FlagCode = 'es' | 'community' | 'canary_islands' | string;

interface RegionData {
  name: string;
  flagCode: FlagCode;
  code?: string;
  totalPercentage: string;
  total: number;
  data: SectorDataItem[];
}

interface CommunityOption {
  name: string;
  code: string;
  flag: string;
}

interface FlagProps {
  code: FlagCode;
  width?: number;
  height?: number;
  className?: string;
  communityCode?: string;
}

// Componente para mostrar la bandera de la comunidad
const Flag: React.FC<FlagProps> = ({ code, width = 24, height = 18, className = "", communityCode }) => {
  // Encontrar la bandera correcta basándose en el código
  let flagUrl = '';
  let extraStyles = '';
  
  // Búsqueda de banderas en el JSON
  const esFlag = "https://flagcdn.com/es.svg";
  const canaryFlag = autonomous_communities_flags.find(community => community.code === 'CAN');
  const communityFlag = code === 'community' && communityCode ? 
    autonomous_communities_flags.find(community => community.code === communityCode) : null;
  
  switch(code) {
    case 'es':
      // Usar bandera de España
      flagUrl = esFlag;
      break;
    case 'canary_islands':
      // Usar bandera de Canarias
      flagUrl = canaryFlag?.flag || '';
      extraStyles = 'border border-gray-200 shadow-sm bg-gray-50';
      break;
    case 'community':
      // Usar bandera de la comunidad seleccionada
      flagUrl = communityFlag?.flag || '';
      break;
    default:
      return null;
  }
  
  // Renderizar la imagen de la bandera si se encontró una URL
  if (flagUrl) {
    return (
      <img 
        src={flagUrl} 
        alt={code} 
        width={width} 
        height={height} 
        className={`rounded ${extraStyles} ${className}`}
      />
    );
  }
  
  return null;
};

interface CommunityDistributionProps {
  language: 'es' | 'en';
}

// Añadimos un tipo para el mapa de colores de sectores
type SectorColorMap = {
  [key in 'business' | 'government' | 'education' | 'nonprofit']: string;
};

// Definimos un tipo para los datos del tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SectorDataItem;
  }>;
  region: string;
}

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en español/inglés
const communityNameMapping: { [key: string]: { es: string, en: string } } = {
  'Andalucía': { es: 'Andalucía', en: 'Andalusia' },
  'Aragón': { es: 'Aragón', en: 'Aragon' },
  'Principado de Asturias': { es: 'Asturias', en: 'Asturias' },
  'Illes Balears / Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Cantabria': { es: 'Cantabria', en: 'Cantabria' },
  'Castilla - La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla y León': { es: 'Castilla y León', en: 'Castile and León' },
  'Cataluña': { es: 'Cataluña', en: 'Catalonia' },
  'Comunidad Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'Extremadura': { es: 'Extremadura', en: 'Extremadura' },
  'Galicia': { es: 'Galicia', en: 'Galicia' },
  'La Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Comunidad de Madrid': { es: 'Madrid', en: 'Madrid' },
  'Región de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Comunidad Foral de Navarra': { es: 'Navarra', en: 'Navarre' },
  'País Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Ciudad Autónoma de Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ciudad Autónoma de Melilla': { es: 'Melilla', en: 'Melilla' }
};

const CommunityDistribution: React.FC<CommunityDistributionProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const selectedSector = 'total'; // Sector fijo en 'total'
  const [years, setYears] = useState<string[]>([]);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Madrid',
    code: 'MAD',
    flag: autonomous_communities_flags.find(f => f.code === 'MAD')?.flag || ''
  });
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  const [ccaaData, setCcaaData] = useState<GastoIDComunidadesData[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [sectorOrder, setSectorOrder] = useState<string[]>([]);
  
  // Textos localizados
  const texts = {
    es: {
      year: "Año",
      sector: "Sector",
      ofGDP: "del PIB",
      total: "Total",
      distributionTitle: "Distribución sectorial de la inversión en I+D",
      pibPercentage: "%PIB",
      community: "Comunidad",
      selectCommunity: "Seleccionar comunidad",
      changeCommunity: "Cambiar comunidad"
    },
    en: {
      year: "Year",
      sector: "Sector",
      ofGDP: "of GDP",
      total: "Total",
      distributionTitle: "R&D Investment Distribution by Sectors",
      pibPercentage: "%GDP",
      community: "Community",
      selectCommunity: "Select community",
      changeCommunity: "Change community"
    }
  };

  const t = texts[language];

  // Colores para cada sector - usamos colores más distintivos
  const sectorColors: SectorColorMap = {
    'business': '#3b82f6',      // Sector empresarial - Azul
    'government': '#ef4444',    // Administración Pública - Rojo
    'education': '#f59e0b',     // Enseñanza Superior - Naranja
    'nonprofit': '#10b981'      // Instituciones Privadas sin Fines de Lucro - Verde
  };

  // Dentro del componente

  // Cargar datos desde archivos CSV
  useEffect(() => {
    async function fetchData() {
      try {
        // Cargar datos de comunidades autónomas
        const gastoIDResponse = await fetch('/data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        const gastoIDContent = await gastoIDResponse.text();
        
        // Cargar datos consolidados de España
        const gdpConsolidadoResponse = await fetch('/data/GDP_data/gdp_consolidado.csv');
        const gdpConsolidadoContent = await gdpConsolidadoResponse.text();
        
        // Array para almacenar los datos consolidados
        let dataConsolidada: GastoIDComunidadesData[] = [];
        
        // Procesar CSV de comunidades autónomas
        Papa.parse(gastoIDContent, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
          complete: (results: PapaParseResults<GastoIDComunidadesData>) => {
            dataConsolidada = results.data;
            
            // Ahora procesar el CSV de datos consolidados de España
            Papa.parse(gdpConsolidadoContent, {
              header: true,
              delimiter: ",",
              skipEmptyLines: true,
              complete: (resultsSpain: PapaParseResults<GDPConsolidadoData>) => {
                // Filtrar para obtener solo los datos de España
                const spainData = resultsSpain.data.filter((row) => 
                  row.Country === "Spain" || row.País === "España"
                );
                
                // Convertir datos de España al formato GastoIDComunidadesData
                const spainFormattedData = spainData.map((row) => {
                  return {
                    'Comunidad (Original)': 'España',
                    'Comunidad Limpio': 'España',
                    'Comunidad en Inglés': 'Spain',
                    'Año': row.Year || '',
                    'Sector Id': row.Sector === 'All Sectors' ? '(_T)' : 
                                 row.Sector === 'Business enterprise sector' ? '(EMPRESAS)' :
                                 row.Sector === 'Government sector' ? '(ADMINISTRACION_PUBLICA)' :
                                 row.Sector === 'Higher education sector' ? '(ENSENIANZA_SUPERIOR)' :
                                 row.Sector === 'Private non-profit sector' ? '(IPSFL)' : '',
                    'Sector': row.Sector || '',
                    'Gasto en I+D (Miles €)': row.Approx_RD_Investment_million_euro ? 
                                             (parseFloat(row.Approx_RD_Investment_million_euro) * 1000).toString() : '',
                    'PIB (Miles €)': row['GDP Current prices, million euro'] ? 
                                    (parseFloat(row['GDP Current prices, million euro']) * 1000).toString() : '',
                    '% PIB I+D': row['%GDP'] ? row['%GDP'].toString() : '',
                    'Sector Nombre': row.Sector === 'Business enterprise sector' ? 'Empresas' :
                                     row.Sector === 'Government sector' ? 'Administración Pública' :
                                     row.Sector === 'Higher education sector' ? 'Enseñanza Superior' :
                                     row.Sector === 'Private non-profit sector' ? 'Instituciones Privadas sin Fines de Lucro' : 
                                     row.Sector === 'All Sectors' ? 'Total' : row.Sector
                  } as GastoIDComunidadesData;
                });
                
                // Combinar ambos conjuntos de datos
                dataConsolidada = [...dataConsolidada, ...spainFormattedData];
                setCcaaData(dataConsolidada);
                
                // Extraer comunidades autónomas disponibles
                const uniqueCommunities = new Set<string>();
                const communitiesData: CommunityOption[] = [];

                // Filtrar por el año seleccionado y sector total
                const filteredData = dataConsolidada.filter(item => 
                  item['Año'] === selectedYear && 
                  item['Sector Id'] === "(_T)" &&
                  item['Comunidad Limpio'] !== 'Total nacional' &&
                  item['Comunidad Limpio'] !== 'España'
                );

                // Extraer comunidades únicas
                filteredData.forEach(item => {
                  const communityName = item['Comunidad Limpio'];
                  
                  if (!uniqueCommunities.has(communityName)) {
                    uniqueCommunities.add(communityName);
                    
                    // Buscar el código y la bandera
                    let code = '';
                    let flagUrl = '';
                    
                    // Buscar en el mapeo de comunidades
                    for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
                      if (normalizeText(originalName) === normalizeText(communityName)) {
                        // Usar el nombre normalizado para buscar en autonomous_communities_flags
                        const communityFlag = autonomous_communities_flags.find(flag => 
                          normalizeText(flag.community).includes(normalizeText(mappedNames.es)) ||
                          normalizeText(mappedNames.es).includes(normalizeText(flag.community))
                        );
                        
                        if (communityFlag) {
                          code = communityFlag.code;
                          flagUrl = communityFlag.flag;
                          break;
                        }
                      }
                    }
                    
                    // Si no encontramos bandera, hacemos una búsqueda más flexible
                    if (!flagUrl) {
                      const communityFlag = autonomous_communities_flags.find(flag => 
                        normalizeText(flag.community).includes(normalizeText(communityName)) ||
                        normalizeText(communityName).includes(normalizeText(flag.community))
                      );
                      
                      if (communityFlag) {
                        code = communityFlag.code;
                        flagUrl = communityFlag.flag;
                      }
                    }
                    
                    // Agregar a la lista de comunidades disponibles
                    communitiesData.push({
                      name: communityName,
                      code: code,
                      flag: flagUrl
                    });
                  }
                });
                
                // Ordenar comunidades alfabéticamente, pero con Madrid primero
                const sortedCommunities = communitiesData.sort((a, b) => {
                  if (a.code === 'MAD') return -1;
                  if (b.code === 'MAD') return 1;
                  return a.name.localeCompare(b.name, language === 'es' ? 'es' : 'en');
                });
                
                setAvailableCommunities(sortedCommunities);
                
                // Asegurar que la comunidad seleccionada existe en los datos
                const currentCommunityExists = sortedCommunities.some(c => c.code === selectedCommunity.code);
                if (!currentCommunityExists && sortedCommunities.length > 0) {
                  setSelectedCommunity(sortedCommunities[0]);
                }
                
                // Extraer años disponibles y configurar estado
                const years = [...new Set(dataConsolidada.map(row => row['Año']))].sort((a, b) => b.localeCompare(a));
                setYears(years);
                
                // Procesar datos para el año y sector actual
                const processed = processData(dataConsolidada, selectedYear, selectedSector);
                setRegionsData(processed);
                setLoading(false);
              },
              error: (error: Error) => {
                console.error('Error parsing Spain GDP CSV:', error);
                // Si falla al cargar los datos de España, continuar con los datos de CCAA solamente
                setCcaaData(dataConsolidada);
            
            // Extraer años disponibles
                const years = [...new Set(dataConsolidada.map(row => row['Año']))].sort((a, b) => b.localeCompare(a));
                setYears(years);
            
            setSelectedCommunity(selectedCommunity);
            
                const processed = processData(dataConsolidada, selectedYear, selectedSector);
            setRegionsData(processed);
            setLoading(false);
              }
            });
          },
          error: (error: Error) => {
            console.error('Error parsing CCAA CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, [language, selectedYear]);
  
  // Actualizar datos cuando cambia algún filtro
  useEffect(() => {
    if (ccaaData.length > 0) {
      const processed = processData(ccaaData, selectedYear, selectedSector);
      
      // Establecer el orden de los sectores según la primera región (España)
      if (processed.length > 0 && processed[0].name === (language === 'es' ? 'España' : 'Spain')) {
        const spainSectorsOrder = processed[0].data
          .sort((a, b) => b.value - a.value)
          .map(sector => sector.id || '');
        setSectorOrder(spainSectorsOrder);
      }
      
      setRegionsData(processed);
    }
  }, [selectedYear, selectedCommunity, language, ccaaData]);

  // Procesar datos CSV
  const processData = (ccaaData: GastoIDComunidadesData[], year: string, sector: string) => {
    console.log(`Procesando datos para año: ${year}, sector: ${sector}, idioma: ${language}`);
    
    // IMPORTANTE: Los datos en el CSV ya están en formato de porcentaje correcto
    // Por ejemplo, 1.49 significa 1.49% del PIB
    
    // Usar valores predefinidos de España para datos históricos
    // Estos valores vienen de GDP_consolidated.csv usado en RegionRankingChart
    const spainHistoricalValues: Record<string, Record<string, number>> = {
      '2013': { 'total': 1.27, 'business': 0.67, 'government': 0.24, 'education': 0.35, 'nonprofit': 0.01 },
      '2014': { 'total': 1.23, 'business': 0.65, 'government': 0.23, 'education': 0.34, 'nonprofit': 0.01 },
      '2015': { 'total': 1.21, 'business': 0.64, 'government': 0.23, 'education': 0.33, 'nonprofit': 0.01 },
      '2016': { 'total': 1.18, 'business': 0.63, 'government': 0.22, 'education': 0.32, 'nonprofit': 0.01 },
      '2017': { 'total': 1.20, 'business': 0.66, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
      '2018': { 'total': 1.23, 'business': 0.70, 'government': 0.21, 'education': 0.31, 'nonprofit': 0.01 },
      '2019': { 'total': 1.24, 'business': 0.70, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
      '2020': { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      '2021': { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      '2022': { 'total': 1.41, 'business': 0.79, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      '2023': { 'total': 1.49, 'business': 0.84, 'government': 0.24, 'education': 0.40, 'nonprofit': 0.01 }
    };
    
    // Calcular el valor para España - primero de datos históricos para garantizar consistencia
    let spainValue = 0;
    
    if (year in spainHistoricalValues && sector in spainHistoricalValues[year]) {
      spainValue = spainHistoricalValues[year][sector];
      console.log(`Usando valor histórico para España: ${spainValue}% para año ${year} y sector ${sector}`);
    } else {
      // Si no hay valor histórico, buscar en los datos del CSV
    const spainTotalData = ccaaData.find(row => 
      row['Año'] === year && 
      (row['Comunidad Limpio'] === 'Total nacional' || row['Comunidad Limpio'] === 'España') && 
        (sector === 'total' && row['Sector Id'] === "(_T)" || 
         row['Sector Id'] === `(${sector.toUpperCase()})`)
    );
    
    if (spainTotalData) {
      spainValue = parseFloat(spainTotalData['% PIB I+D'].replace(',', '.'));
        console.log(`Usando valor del CSV para España: ${spainValue}% para año ${year} y sector ${sector}`);
    } else {
        // Si no hay dato específico para España, usar promedio ponderado
      const totalNational = ccaaData.filter(row => 
        row['Año'] === year && 
        row['Sector Id'] === "(_T)" && 
        row['Comunidad Limpio'] !== 'Total nacional' && 
        row['Comunidad Limpio'] !== 'España'
      );
      
      if (totalNational.length > 0) {
        // Calculamos una media ponderada por PIB
        let totalPib = 0;
        let totalInversion = 0;
        
        totalNational.forEach(row => {
          if (row['PIB (Miles €)'] && row['% PIB I+D']) {
            const pib = parseFloat(row['PIB (Miles €)'].replace('.', '').replace(',', '.'));
            const porcentaje = parseFloat(row['% PIB I+D'].replace(',', '.'));
            totalPib += pib;
            totalInversion += (pib * porcentaje / 100);
          }
        });
        
        if (totalPib > 0) {
          spainValue = (totalInversion / totalPib) * 100;
            console.log(`Usando valor calculado para España: ${spainValue}% para año ${year} y sector ${sector}`);
          }
        }
      }
    }
    
    // Función mejorada para encontrar datos de una comunidad
    const findCommunityData = (communityCode: string, communityName?: string) => {
      // Intentar diferentes estrategias para encontrar los datos de la comunidad

      // 1. Buscar por código de comunidad
      const communityFlag = autonomous_communities_flags.find(flag => flag.code === communityCode);
      if (!communityFlag && !communityName) return null;
      
      // 2. Usar el nombre proporcionado o obtenerlo del código
      const searchName = communityName || communityFlag?.community || '';
      
      // 3. Buscar en los datos por nombre normalizado - CORREGIR CONDICIÓN LÓGICA (problema encontrado)
      let communityData = ccaaData.find(row => 
        row['Año'] === year &&
        (row['Sector Id'] === `(${sector.toUpperCase()})` || 
        (sector === 'total' && row['Sector Id'] === "(_T)")) &&
        normalizeText(row['Comunidad Limpio']) === normalizeText(searchName)
      );
      
      // 4. Si no se encuentra, buscar usando los mapeos de nombres
      if (!communityData) {
        for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
          const normalizedOriginal = normalizeText(originalName);
          const normalizedMappedEs = normalizeText(mappedNames.es);
          
          // Normalizar el nombre de búsqueda
          const normalizedSearchName = normalizeText(searchName);
          
          // Verificar coincidencias con los nombres mapeados
          if (normalizedOriginal === normalizedSearchName || 
              normalizedMappedEs === normalizedSearchName) {
            
            // Buscar en los datos usando este nombre mapeado
            communityData = ccaaData.find(row => 
              row['Año'] === year &&
              (row['Sector Id'] === `(${sector.toUpperCase()})` || 
               (sector === 'total' && row['Sector Id'] === "(_T)")) &&
              (normalizeText(row['Comunidad Limpio']) === normalizedOriginal ||
               normalizeText(row['Comunidad Limpio']) === normalizedMappedEs)
            );
            
            if (communityData) break;
          }
        }
      }
      
      // 5. Intento adicional: buscar coincidencia parcial
      if (!communityData) {
        communityData = ccaaData.find(row => 
          row['Año'] === year &&
          (row['Sector Id'] === `(${sector.toUpperCase()})` || 
           (sector === 'total' && row['Sector Id'] === "(_T)")) &&
          (normalizeText(row['Comunidad Limpio']).includes(normalizeText(searchName)) ||
           normalizeText(searchName).includes(normalizeText(row['Comunidad Limpio'])))
        );
      }
      
      // 6. Último recurso: buscar por código específico para Ceuta y Melilla
      if (!communityData && (communityCode === 'CEU' || communityCode === 'MEL')) {
        const specialName = communityCode === 'CEU' ? 'ceuta' : 'melilla';
        communityData = ccaaData.find(row => 
          row['Año'] === year &&
          (row['Sector Id'] === `(${sector.toUpperCase()})` || 
           (sector === 'total' && row['Sector Id'] === "(_T)")) &&
          normalizeText(row['Comunidad Limpio']).includes(specialName)
        );
      }
      
      return communityData;
    };
    
    // Datos para la comunidad seleccionada
    const selectedCommunityData = findCommunityData(selectedCommunity.code, selectedCommunity.name);
    
    // Datos para Canarias
    const canaryData = ccaaData.filter(row => 
      row['Año'] === year && 
      normalizeText(row['Comunidad Limpio']) === "canarias" &&
      (row['Sector Id'] === `(${sector.toUpperCase()})` || 
       (sector === 'total' && row['Sector Id'] === "(_T)"))
    );
    
    // Función para obtener datos de sectores para una comunidad
    const getSectorData = (communityName: string) => {
      // Buscar datos de sectores para la comunidad
      let sectorDataFilter;
      
      // Normalizar el nombre de la comunidad para búsquedas
      const normalizedCommunityName = normalizeText(communityName);
      console.log(`Buscando datos de sectores para: "${communityName}"`);
      
      if (communityName === 'España' || communityName === 'Total nacional' || normalizedCommunityName === 'espana') {
        // Para España, buscamos por 'Total nacional' o 'España' en cualquiera de los campos de comunidad
        sectorDataFilter = ccaaData.filter(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === 'total nacional' || 
           normalizeText(row['Comunidad Limpio']) === 'espana' || 
           normalizeText(row['Comunidad (Original)']) === 'total nacional' || 
           normalizeText(row['Comunidad (Original)']) === 'espana') && 
          row['Sector Id'] !== "(_T)" && 
          row['Sector Id'] !== "_T"
        );
      } else {
        // Para otras comunidades, buscar por nombre de comunidad
        sectorDataFilter = ccaaData.filter(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === normalizedCommunityName ||
           normalizeText(row['Comunidad (Original)']) === normalizedCommunityName ||
           normalizeText(row['Comunidad en Inglés']) === normalizedCommunityName) && 
          row['Sector Id'] !== "(_T)" && 
          row['Sector Id'] !== "_T"
        );
        
        // Si no se encuentra, intentar con los mapeos de comunidades
        if (sectorDataFilter.length === 0) {
          for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
            const normalizedOriginal = normalizeText(originalName);
            const normalizedMappedEs = normalizeText(mappedNames.es);
            const normalizedMappedEn = normalizeText(mappedNames.en);
            
            if (normalizedOriginal === normalizedCommunityName ||
                normalizedMappedEs === normalizedCommunityName ||
                normalizedMappedEn === normalizedCommunityName) {
              
              // Buscar usando estos nombres mapeados
              sectorDataFilter = ccaaData.filter(row => 
                row["Año"] === year && 
                (normalizeText(row['Comunidad Limpio']) === normalizedOriginal ||
                  normalizeText(row['Comunidad Limpio']) === normalizedMappedEs) && 
                row['Sector Id'] !== "(_T)" && 
                row['Sector Id'] !== "_T"
              );
              
              if (sectorDataFilter.length > 0) {
                console.log(`Encontrados ${sectorDataFilter.length} sectores para "${communityName}" usando mapeo`);
                break;
              }
            }
          }
        }
        
        // Para casos especiales como Ceuta y Melilla, intentar búsqueda por coincidencia parcial
        if (sectorDataFilter.length === 0) {
          if (normalizedCommunityName.includes('ceuta')) {
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('ceuta') && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
            console.log(`Búsqueda especial para Ceuta: ${sectorDataFilter.length} sectores encontrados`);
          } else if (normalizedCommunityName.includes('melilla')) {
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('melilla') && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
            console.log(`Búsqueda especial para Melilla: ${sectorDataFilter.length} sectores encontrados`);
          } else {
            // Último recurso: búsqueda por coincidencia parcial para otras comunidades
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              (normalizeText(row['Comunidad Limpio']).includes(normalizedCommunityName) || 
               normalizedCommunityName.includes(normalizeText(row['Comunidad Limpio']))) && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
          }
        }
      }
      
      // Si no hay datos específicos para España, pero estamos procesando España, crear aproximación
      if (sectorDataFilter.length === 0 && (communityName === 'España' || communityName === 'Total nacional' || normalizedCommunityName === 'espana')) {
        console.log("No se encontraron datos específicos de sectores para España, generando datos aproximados");
        
        // Podemos usar los valores históricos definidos para calcular los sectores en proporción
        if (year in spainHistoricalValues) {
          return [
            {
              id: 'business',
              name: language === 'es' ? 'Sector empresarial' : 'Business enterprise sector',
              value: spainHistoricalValues[year]['business'],
              color: sectorColors.business,
              sharePercentage: (spainHistoricalValues[year]['business'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: 0
            },
            {
              id: 'government',
              name: language === 'es' ? 'Administración Pública' : 'Government sector',
              value: spainHistoricalValues[year]['government'],
              color: sectorColors.government,
              sharePercentage: (spainHistoricalValues[year]['government'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: 0
            },
            {
              id: 'education',
              name: language === 'es' ? 'Enseñanza Superior' : 'Higher education sector',
              value: spainHistoricalValues[year]['education'],
              color: sectorColors.education,
              sharePercentage: (spainHistoricalValues[year]['education'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: 0
            },
            {
              id: 'nonprofit',
              name: language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit sector',
              value: spainHistoricalValues[year]['nonprofit'],
              color: sectorColors.nonprofit,
              sharePercentage: (spainHistoricalValues[year]['nonprofit'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: 0
            }
          ];
        }
        
        // Usar distribución sectorial promedio de todas las comunidades
        const allSectors = ccaaData.filter(row => 
          row["Año"] === year && 
          row['Sector Id'] !== "(_T)" && 
          row['Sector Id'] !== "_T"
        );
        
        // Agrupar por sector y promediar
        const sectorGroups: {[key: string]: {count: number, sum: number, name: string, monetarySum: number}} = {};
        
        allSectors.forEach(row => {
          const sectorId = row['Sector Id'].replace(/[()]/g, '');
          if (!sectorGroups[sectorId]) {
            sectorGroups[sectorId] = {
              count: 0,
              sum: 0,
              name: row['Sector Nombre'] || row['Sector'],
              monetarySum: 0
            };
          }
          
          const value = parseFloat(row['% PIB I+D'].replace(',', '.')) || 0;
          const monetaryValue = row['Gasto en I+D (Miles €)'] ? 
            parseFloat(row['Gasto en I+D (Miles €)'].replace('.', '').replace(',', '.')) : 0;
          
          sectorGroups[sectorId].count += 1;
          sectorGroups[sectorId].sum += value;
          sectorGroups[sectorId].monetarySum += monetaryValue;
        });
        
        // Convertir los grupos a objetos SectorDataItem
        const approximatedSectors = Object.entries(sectorGroups).map(([sectorCode, data]) => {
          // Calcular el valor promedio para este sector
          const avgValue = data.count > 0 ? data.sum / data.count : 0;
          const avgMonetaryValue = data.count > 0 ? data.monetarySum / data.count / 1000 : 0; // Convertir a millones
          const sectorId = getSectorIdFromCode(sectorCode);
          
          return {
            id: sectorId,
            name: language === 'es' ? 
              rdSectors.find(s => s.id === sectorId)?.name.es || data.name :
              rdSectors.find(s => s.id === sectorId)?.name.en || data.name,
            value: avgValue,
            color: getSectorColor(sectorId),
            // Calcular la participación proporcional basada en el total nacional
            sharePercentage: spainValue > 0 ? (avgValue / spainValue) * 100 : 0,
            // Valor monetario aproximado
            monetaryValue: avgMonetaryValue
          };
        });
        
        return approximatedSectors;
      }
      
      // Si no hay datos para la comunidad seleccionada, devolver un array vacío
      if (sectorDataFilter.length === 0) {
        console.log(`No se encontraron datos de sectores para la comunidad: ${communityName}`);
        return [];
      }
      
      // Obtener el total de la comunidad para calcular porcentajes
      let totalValue = 0;
      
      // Método 1: Buscar el total directamente
      let totalData;
      
      if (communityName === 'España' || communityName === 'Total nacional' || normalizedCommunityName === 'espana') {
        totalData = ccaaData.find(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === 'total nacional' || 
           normalizeText(row['Comunidad Limpio']) === 'espana' || 
           normalizeText(row['Comunidad (Original)']) === 'total nacional' || 
           normalizeText(row['Comunidad (Original)']) === 'espana') && 
          row['Sector Id'] === "(_T)"
        );
      } else {
        totalData = ccaaData.find(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === normalizedCommunityName ||
           normalizeText(row['Comunidad (Original)']) === normalizedCommunityName ||
           normalizeText(row['Comunidad en Inglés']) === normalizedCommunityName) && 
          row['Sector Id'] === "(_T)"
        );
        
        // Si no encontramos datos totales, intentar búsqueda con los mapeos
        if (!totalData) {
          for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
            if (normalizeText(originalName) === normalizedCommunityName ||
                normalizeText(mappedNames.es) === normalizedCommunityName ||
                normalizeText(mappedNames.en) === normalizedCommunityName) {
              
              totalData = ccaaData.find(row => 
                row["Año"] === year && 
                (normalizeText(row['Comunidad Limpio']) === normalizeText(originalName) ||
                 normalizeText(row['Comunidad Limpio']) === normalizeText(mappedNames.es)) && 
                row['Sector Id'] === "(_T)"
              );
              
              if (totalData) break;
            }
          }
        }
        
        // Para casos especiales, intentar búsqueda por coincidencia parcial
        if (!totalData) {
          if (normalizedCommunityName.includes('ceuta')) {
            totalData = ccaaData.find(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('ceuta') && 
              row['Sector Id'] === "(_T)"
            );
          } else if (normalizedCommunityName.includes('melilla')) {
            totalData = ccaaData.find(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('melilla') && 
              row['Sector Id'] === "(_T)"
            );
          }
        }
      }
      
      // Método 2: Si no hay datos totales, calcular la suma de sectores
      if (totalData) {
        totalValue = parseFloat(totalData['% PIB I+D'].replace(',', '.'));
      } else {
        // Sumar los valores de todos los sectores
        totalValue = sectorDataFilter.reduce((sum, row) => {
          const sectorValue = parseFloat(row['% PIB I+D'].replace(',', '.')) || 0;
          return sum + sectorValue;
        }, 0);
      }
      
      // Si aún no tenemos valor total, usar el valor de España
      if (totalValue <= 0) {
        totalValue = spainValue;
      }
      
      // Mapear los sectores a SectorDataItem
      return sectorDataFilter.map(row => {
        const sectorId = getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, ''));
        
        // Procesar valor numérico con manejo seguro de errores
        let rawValue = 0;
        try {
          rawValue = parseFloat(row['% PIB I+D'].replace(',', '.'));
          if (isNaN(rawValue)) rawValue = 0;
        } catch (e) {
          console.error(`Error al parsear % PIB I+D: ${row['% PIB I+D']}`, e);
          rawValue = 0;
        }
        
        // Obtener el valor monetario con manejo seguro de errores
        let monetaryValue: number | undefined = undefined;
        try {
          if (row['Gasto en I+D (Miles €)']) {
            monetaryValue = parseFloat(row['Gasto en I+D (Miles €)'].replace('.', '').replace(',', '.')) / 1000;
            if (isNaN(monetaryValue)) monetaryValue = undefined;
          } else if (row['PIB (Miles €)'] && rawValue > 0) {
          // Si no hay valor directo, calcularlo a partir del porcentaje y el PIB
            const pib = parseFloat(row['PIB (Miles €)'].replace('.', '').replace(',', '.'));
            if (!isNaN(pib)) {
              monetaryValue = (pib * rawValue / 100) / 1000;
              if (isNaN(monetaryValue)) monetaryValue = undefined;
            }
          }
        } catch (e) {
          console.error(`Error al calcular valor monetario para sector ${sectorId}`, e);
          monetaryValue = undefined;
        }
        
        // Calcular el porcentaje de participación respecto al total
        const sharePercentage = totalValue > 0 ? (rawValue / totalValue) * 100 : 0;
        
        return {
          id: sectorId,
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row['Sector Nombre'] :
            rdSectors.find(s => s.id === sectorId)?.name.en || row['Sector'],
          value: rawValue,
          color: getSectorColor(sectorId),
          sharePercentage: sharePercentage,
          monetaryValue
        };
      });
    };
    
    // Procesar datos para cada región
    const regionsProcessed: RegionData[] = [];
    
    // España
    const spainSectors = getSectorData('España');
    if (spainSectors.length > 0 || spainValue > 0) {
      // Ordenar sectores de mayor a menor valor
      const sortedSpainSectors = spainSectors.sort((a, b) => b.value - a.value);
      
      regionsProcessed.push({
        name: language === 'es' ? 'España' : 'Spain',
        flagCode: 'es',
        totalPercentage: spainValue.toFixed(2),
        total: spainValue,
        data: sortedSpainSectors
      });
    }
    
    // Comunidad seleccionada
    if (selectedCommunityData) {
      const totalValue = parseFloat(selectedCommunityData['% PIB I+D'].replace(',', '.'));
      const communitySectors = getSectorData(selectedCommunityData['Comunidad Limpio']);
      
      // Ordenar sectores de mayor a menor valor
      const sortedCommunitySectors = communitySectors.sort((a, b) => b.value - a.value);
      
      // Obtener el nombre correcto de la comunidad usando el mapeo
      let displayName = selectedCommunityData['Comunidad Limpio'];
      
      // Buscar en el mapeo para usar nombres consistentes con los otros componentes
      for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
        if (normalizeText(originalName) === normalizeText(displayName)) {
          displayName = language === 'es' ? mappedNames.es : mappedNames.en;
          break;
        }
      }
      
      regionsProcessed.push({
        name: displayName,
        flagCode: 'community',
        code: selectedCommunity.code,
        totalPercentage: totalValue.toFixed(2),
        total: totalValue,
        data: sortedCommunitySectors
      });
    } else if (selectedCommunity) {
      console.log(`No se encontraron datos para la comunidad seleccionada: ${selectedCommunity.name}`);
      
      // Si no tenemos datos pero tenemos una comunidad seleccionada, 
      // mostrar un gráfico vacío pero con el nombre correcto
      
      // Buscar el nombre correcto en el mapeo
      let displayName = selectedCommunity.name;
      
      // Para comunidades especiales como Ceuta y Melilla, usar nombres consistentes
      if (selectedCommunity.code === 'CEU') {
        displayName = language === 'es' ? 'Ceuta' : 'Ceuta';
      } else if (selectedCommunity.code === 'MEL') {
        displayName = language === 'es' ? 'Melilla' : 'Melilla';
      } else {
        // Buscar en el mapeo para usar nombres consistentes
        for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
          if (normalizeText(originalName) === normalizeText(displayName) ||
              normalizeText(mappedNames.es) === normalizeText(displayName) ||
              normalizeText(mappedNames.en) === normalizeText(displayName)) {
            
            displayName = language === 'es' ? mappedNames.es : mappedNames.en;
            break;
          }
        }
      }
      
      // Buscar algún dato para esta comunidad en cualquier otro año para aproximar
      const anyYearData = ccaaData.find(row => 
        (normalizeText(row['Comunidad Limpio']) === normalizeText(selectedCommunity.name) ||
         normalizeText(row['Comunidad (Original)']) === normalizeText(selectedCommunity.name) ||
         (selectedCommunity.code === 'CEU' && normalizeText(row['Comunidad Limpio']).includes('ceuta')) ||
         (selectedCommunity.code === 'MEL' && normalizeText(row['Comunidad Limpio']).includes('melilla'))) &&
        row['Sector Id'] === "(_T)"
      );
      
      const defaultValue = anyYearData ? parseFloat(anyYearData['% PIB I+D'].replace(',', '.')) : 0;
      
      regionsProcessed.push({
        name: displayName,
        flagCode: 'community',
        code: selectedCommunity.code,
        totalPercentage: defaultValue.toFixed(2),
        total: defaultValue,
        data: [] // Sin datos de sectores
      });
    }
    
    // Canarias
    if (canaryData.length > 0) {
      const canaryTotalData = canaryData[0];
      const totalValue = parseFloat(canaryTotalData['% PIB I+D'].replace(',', '.'));
      const canarySectors = getSectorData('Canarias');
      
      // Ordenar sectores de mayor a menor valor
      const sortedCanarySectors = canarySectors.sort((a, b) => b.value - a.value);
      
      regionsProcessed.push({
        name: language === 'es' ? 'Canarias' : 'Canary Islands',
        flagCode: 'canary_islands',
        code: 'CAN',
        totalPercentage: totalValue.toFixed(2),
        total: totalValue,
        data: sortedCanarySectors
      });
    }
    
    return regionsProcessed;
  };

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Función para obtener el color del sector
  const getSectorColor = (sectorId: string): string => {
    // Asegurarnos de que el ID del sector es válido
    const validSectorId = sectorId.toLowerCase(); 
    
    // Mapeo directo para los ID conocidos
    if (validSectorId === 'business' || validSectorId === 'bes' || validSectorId === 'empresas') {
      return sectorColors.business;
    }
    if (validSectorId === 'government' || validSectorId === 'gov' || validSectorId === 'administracion_publica') {
      return sectorColors.government;
    }
    if (validSectorId === 'education' || validSectorId === 'hes' || validSectorId === 'ensenianza_superior') {
      return sectorColors.education;
    }
    if (validSectorId === 'nonprofit' || validSectorId === 'pnp' || validSectorId === 'ipsfl') {
      return sectorColors.nonprofit;
    }
    
    return '#cbd5e1'; // Color por defecto si no hay coincidencia
  };
  
  // Función para obtener el ID del sector a partir del código
  const getSectorIdFromCode = (sectorCode: string): string => {
    // Mapeo directo basado en los códigos del CSV
    if (sectorCode === 'EMPRESAS' || sectorCode === 'BES') return 'business';
    if (sectorCode === 'ADMINISTRACION_PUBLICA' || sectorCode === 'GOV') return 'government';
    if (sectorCode === 'ENSENIANZA_SUPERIOR' || sectorCode === 'HES') return 'education';
    if (sectorCode === 'IPSFL' || sectorCode === 'PNP') return 'nonprofit';
    
    const sector = rdSectors.find(s => s.code === sectorCode);
    return sector?.id || 'unknown';
  };

  // Obtener el valor de color sin el prefijo bg-
  const getHeaderColorValue = (code: FlagCode): string => {
    switch(code) {
      case 'es':
        return '#dc2626'; // red-600
      case 'community':
        return '#0ea5e9'; // sky-500
      case 'canary_islands':
        return '#3b82f6'; // blue-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  // Componente para mostrar la lista de sectores
  const SectorList: React.FC<{
    data: RegionData;
  }> = ({ data }) => {
    // Si no hay datos, mostrar mensaje
    if (data.data.length === 0) {
      return (
        <div className="mt-1 text-center py-4">
          <p className="text-sm text-gray-500">{language === 'es' ? 'No hay datos sectoriales disponibles' : 'No sector data available'}</p>
        </div>
      );
    }
    
    // Ordenar los sectores según el orden establecido por España
    const sortedData = [...data.data];
    
    if (sectorOrder.length > 0) {
      // Ordenar según el orden de España si está disponible
      sortedData.sort((a, b) => {
        const indexA = sectorOrder.indexOf(a.id || '');
        const indexB = sectorOrder.indexOf(b.id || '');
        
        // Si ambos sectores están en el orden, usar ese orden
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Si solo uno está en el orden, priorizar el que está
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Si ninguno está en el orden, ordenar por valor
        return b.value - a.value;
      });
    } else {
      // Fallback: ordenar por valor si no hay orden establecido
      sortedData.sort((a, b) => b.value - a.value);
    }
    
    return (
      <div className="mt-1">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-1">
          <div>{t.sector}</div>
          <div className="text-right">{t.pibPercentage}</div>
          <div className="text-right">%{t.total}</div>
        </div>
        
        {/* Filas de datos */}
        {sortedData.map((sector: SectorDataItem, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: sector.color, border: '1px solid rgba(0,0,0,0.1)' }}></div>
              <div className="leading-tight">{sector.name}</div>
            </div>
            <div className="font-medium text-right">{sector.value.toFixed(2)}%</div>
            <div className="text-right text-gray-600">{sector.sharePercentage?.toFixed(2)}%</div>
          </div>
        ))}
        
        {/* Fila de totales */}
        <div className="grid grid-cols-3 gap-2 text-xs py-1 border-t border-gray-200 font-medium mt-1">
          <div>{t.total}:</div>
          <div className="text-right">{data.total.toFixed(2)}%</div>
          <div className="text-right">100%</div>
        </div>
      </div>
    );
  };

  // Función para formatear números con separador de miles
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(value);
  };

  // Función personalizada para el contenido del tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, region }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      // Obtener el valor monetario desde los datos o calcularlo a partir del porcentaje
      const monetaryValue = data.monetaryValue !== undefined ? data.monetaryValue : 0;
      
      // Obtener el total de la región
      const totalRegion = regionsData.find(r => r.name === region)?.total || 0;
      
      // Usar el color del sector para la línea superior
      const borderColor = data.color || '#64748b'; // Color por defecto si no hay color de sector
      
      return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: "240px", boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          {/* Línea superior de color */}
          <div className="h-1" style={{ backgroundColor: borderColor }}></div>
          
          {/* Contenido principal */}
          <div className="p-4">
            {/* Cabecera con sector y región */}
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: data.color }}></div>
              <div>
                <div className="text-sm font-bold text-gray-900">{data.name}</div>
                <div className="text-xs text-gray-500">{region}</div>
              </div>
            </div>
            
            {/* Valores principales */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.value.toFixed(2)}%</div>
                <div className="text-xs text-gray-500">{t.ofGDP}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{data.sharePercentage?.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">del total</div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="flex justify-between items-center text-xs">
              <div className="text-gray-700 font-medium">{formatNumber(Math.round(monetaryValue))} M€</div>
              <div className="text-blue-600 font-medium">Total: {totalRegion.toFixed(2)}% {t.ofGDP}</div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Filter section */}
      <div className="bg-blue-50 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Selector de año */}
          <div className="flex items-center">
            <Calendar size={18} className="text-blue-600 mr-2" />
            <label htmlFor="year-select" className="text-gray-700 font-medium mr-2">{t.year}:</label>
            <select 
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Chart grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {regionsData.map((region, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Region header */}
              <div className="bg-white p-3 flex items-center justify-between border-t-4" style={{ borderColor: getHeaderColorValue(region.flagCode) }}>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Flag 
                      code={region.flagCode} 
                      width={24} 
                      height={18} 
                      communityCode={region.code} 
                    />
                  </div>
                  
                  {/* Si es la segunda tarjeta (índice 1) y es una comunidad, agregar selector */}
                  {index === 1 && region.flagCode === 'community' ? (
                    <div className="relative">
                      <button 
                        className="font-medium text-gray-800 flex items-center border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <span className="mr-1 truncate max-w-[150px]">{region.name}</span>
                        <ChevronDown size={16} className="text-gray-500 ml-auto" />
                      </button>
                      
                      {dropdownOpen && (
                        <div 
                          className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto w-64"
                          style={{ maxHeight: '300px' }}
                        >
                          <div className="py-1">
                            {availableCommunities.map(community => (
                              <button
                                key={community.code}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${selectedCommunity?.code === community.code ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                  setSelectedCommunity(community);
                                  setDropdownOpen(false);
                                }}
                              >
                                <div className="mr-2">
                                  {community.flag ? (
                                    <img 
                                      src={community.flag} 
                                      alt={community.name} 
                                      width={20} 
                                      height={15} 
                                      className="rounded border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-5 h-4 bg-gray-200 rounded"></div>
                                  )}
                                </div>
                                {community.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <h3 className="font-medium text-gray-800">{region.name}</h3>
                  )}
                </div>
              </div>
              
              {/* Chart */}
              <div className="py-5 px-2 flex justify-center">
                <div className="relative w-48 h-48">
                  {region.data.length > 0 ? (
                    <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          // Ordenar los datos según el orden establecido por España
                          const sortedData = [...region.data];
                          if (sectorOrder.length > 0) {
                            sortedData.sort((a, b) => {
                              const indexA = sectorOrder.indexOf(a.id || '');
                              const indexB = sectorOrder.indexOf(b.id || '');
                              
                              if (indexA !== -1 && indexB !== -1) {
                                return indexA - indexB;
                              }
                              if (indexA !== -1) return -1;
                              if (indexB !== -1) return 1;
                              return b.value - a.value;
                            });
                          } else {
                            sortedData.sort((a, b) => b.value - a.value);
                          }
                          return sortedData;
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={true}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {(() => {
                          // Ordenar los datos según el orden establecido por España
                          const sortedData = [...region.data];
                          if (sectorOrder.length > 0) {
                            sortedData.sort((a, b) => {
                              const indexA = sectorOrder.indexOf(a.id || '');
                              const indexB = sectorOrder.indexOf(b.id || '');
                              
                              if (indexA !== -1 && indexB !== -1) {
                                return indexA - indexB;
                              }
                              if (indexA !== -1) return -1;
                              if (indexB !== -1) return 1;
                              return b.value - a.value;
                            });
                          } else {
                            sortedData.sort((a, b) => b.value - a.value);
                          }
                          return sortedData;
                        })().map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.color} 
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip region={region.name} />}
                        wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                        cursor={false}
                        position={{ x: 0, y: 0 }}
                        offset={20}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-800">{parseFloat(region.totalPercentage).toFixed(2)}%</span>
                    <span className="text-sm text-gray-500">{t.ofGDP}</span>
                  </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">{language === 'es' ? 'No hay datos disponibles' : 'No data available'}</p>
                      <p className="text-xs text-gray-400">{language === 'es' ? 'para el año seleccionado' : 'for the selected year'}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data table */}
              <div className="px-4 pb-4">
                <SectorList data={region} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityDistribution; 