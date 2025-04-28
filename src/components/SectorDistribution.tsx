import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import { rdSectors } from '../data/rdInvestment';
import country_flags from '../logos/country_flags.json';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Interfaces para los datos CSV
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
}

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

// Interfaces para los datos procesados
interface SectorDataItem {
  name: string;
  value: number;
  color: string;
  sharePercentage?: number;
}

type FlagCode = 'eu' | 'es' | 'canary_islands' | string;

interface RegionData {
  name: string;
  flagCode: FlagCode;
  iso3?: string;
  totalPercentage: string;
  total: number;
  data: SectorDataItem[];
}

interface CountryOption {
  name: string;
  localName: string;
  iso3: string;
}

// Componente selector de banderas usando country_flags.json y el ISO3 del país
const Flag = ({ code, width = 24, height = 18, className = "", iso3 = "" }: { code: FlagCode; width?: number; height?: number; className?: string; iso3?: string }) => {
  // Encontrar la bandera correcta basándose en el código
  let flagUrl = '';
  let extraStyles = '';
  
  // Búsqueda de banderas en los JSON
  const euFlag = country_flags.find(flag => flag.iso3 === 'EUU');
  const esFlag = country_flags.find(flag => flag.iso3 === 'ESP');
  const canaryFlag = autonomous_communities_flags.find(community => community.code === 'CAN');
  const countryFlag = iso3 ? country_flags.find(flag => flag.iso3 === iso3) : null;
  
  switch(code) {
    case 'eu':
      // Usar bandera de la UE
      flagUrl = euFlag?.flag || '';
      break;
    case 'es':
      // Usar bandera de España
      flagUrl = esFlag?.flag || '';
      break;
    case 'canary_islands':
      // Usar bandera de Canarias desde autonomous_communities_flags.json
      flagUrl = canaryFlag?.flag || '';
      // Agregar estilos especiales para la bandera de Canarias
      extraStyles = 'border border-gray-200 shadow-sm bg-gray-50';
      break;
    case 'country':
      // Usar bandera del país seleccionado
      flagUrl = countryFlag?.flag || '';
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

interface SectorDistributionProps {
  language: 'es' | 'en';
}

// Añadimos un tipo para el mapa de colores de sectores
type SectorColorMap = {
  [key in 'business' | 'government' | 'education' | 'nonprofit']: string;
};

const SectorDistribution: React.FC<SectorDistributionProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [years, setYears] = useState<string[]>([]);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    iso3: 'ESP'
  });
  
  // Textos localizados
  const texts = {
    es: {
      year: "Año",
      sector: "Sector",
      ofGDP: "del PIB",
      total: "Total",
      distributionTitle: "Distribución sectorial de la inversión en I+D",
      pibPercentage: "%PIB",
      country: "País",
      selectCountry: "Seleccionar país",
      changeCountry: "Cambiar país"
    },
    en: {
      year: "Year",
      sector: "Sector",
      ofGDP: "of GDP",
      total: "Total",
      distributionTitle: "R&D Investment Distribution by Sectors",
      pibPercentage: "%GDP",
      country: "Country",
      selectCountry: "Select country",
      changeCountry: "Change country"
    }
  };

  const t = texts[language];

  // Colores para cada sector
  const sectorColors: SectorColorMap = {
    'business': '#64748b',      // Sector empresarial
    'government': '#94a3b8',    // Administración Pública
    'education': '#78716c',     // Enseñanza Superior
    'nonprofit': '#84cc16'      // Instituciones Privadas sin Fines de Lucro
  };

  // Cargar datos desde archivos CSV
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Cargar datos de Europa y países desde gdp_consolidado.csv
        const gdpResponse = await fetch('/data/GDP_data/gdp_consolidado.csv');
        const gdpCsv = await gdpResponse.text();
        
        // Cargar datos de comunidades autónomas desde gasto_ID_comunidades_porcentaje_pib.csv
        const ccaaResponse = await fetch('/data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        const ccaaCsv = await ccaaResponse.text();
        
        // Parsear los datos
        const gdpData = Papa.parse<GDPConsolidadoData>(gdpCsv, {
          header: true,
          skipEmptyLines: true
        }).data;
        
        const ccaaData = Papa.parse<GastoIDComunidadesData>(ccaaCsv, {
          header: true,
          delimiter: ';', // Este CSV usa ; como separador
          skipEmptyLines: true
        }).data;
        
        // Extraer años disponibles
        const availableYears = [...new Set(gdpData.map(row => row.Year))].sort((a, b) => b.localeCompare(a));
        setYears(availableYears);
        
        // Si el año seleccionado no está disponible, seleccionar el más reciente
        const yearToUse = availableYears.includes(selectedYear) ? selectedYear : availableYears[0];
        if (yearToUse !== selectedYear) {
          setSelectedYear(yearToUse);
        }
        
        // Extraer países disponibles para el año seleccionado (excluyendo la UE y zona Euro)
        const availableCountries = gdpData
          .filter(row => 
            row.Year === yearToUse && 
            row.Sector === "All Sectors" && 
            !row.Country.includes("European Union") && 
            !row.Country.includes("Euro area")
          )
          .reduce((acc: CountryOption[], row) => {
            const existingCountry = acc.find(c => c.iso3 === row.ISO3);
            if (!existingCountry) {
              acc.push({
                name: row.Country,
                localName: row.País,
                iso3: row.ISO3
              });
            }
            return acc;
          }, [])
          .sort((a, b) => {
            // Poner España primero, luego ordenar alfabéticamente según el idioma
            if (a.iso3 === 'ESP') return -1;
            if (b.iso3 === 'ESP') return 1;
            return language === 'es' 
              ? a.localName.localeCompare(b.localName) 
              : a.name.localeCompare(b.name);
          });
        
        console.log(`Países disponibles para el año ${yearToUse}: ${availableCountries.length}`);
        setCountries(availableCountries);
        
        // Verificar si el país seleccionado actualmente está disponible para el año seleccionado
        const currentCountryAvailable = availableCountries.some(c => c.iso3 === selectedCountry?.iso3);
        
        // Si el país seleccionado no está disponible para el año, seleccionar España o el primer país disponible
        if (!currentCountryAvailable) {
          const defaultCountry = availableCountries.find(c => c.iso3 === 'ESP') || availableCountries[0];
          setSelectedCountry(defaultCountry);
          console.log(`Seleccionando país por defecto: ${defaultCountry?.name}`);
        }
        
        // Procesar datos con el nuevo país seleccionado
        if (selectedCountry) {
          processData(gdpData, ccaaData, selectedYear, selectedCountry.iso3);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [language, selectedYear]); // Recargar cuando cambia el idioma o el año

  // Efecto adicional para procesar datos cuando cambia el país seleccionado
  useEffect(() => {
    if (selectedCountry) {
      async function updateCountryData() {
        setLoading(true);
        try {
          // Cargar datos de Europa y países desde gdp_consolidado.csv
          const gdpResponse = await fetch('/data/GDP_data/gdp_consolidado.csv');
          const gdpCsv = await gdpResponse.text();
          
          // Cargar datos de comunidades autónomas
          const ccaaResponse = await fetch('/data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
          const ccaaCsv = await ccaaResponse.text();
          
          // Parsear los datos
          const gdpData = Papa.parse<GDPConsolidadoData>(gdpCsv, {
            header: true,
            skipEmptyLines: true
          }).data;
          
          const ccaaData = Papa.parse<GastoIDComunidadesData>(ccaaCsv, {
            header: true,
            delimiter: ';',
            skipEmptyLines: true
          }).data;
          
          // Procesar datos con el nuevo país seleccionado
          processData(gdpData, ccaaData, selectedYear, selectedCountry.iso3);
        } catch (error) {
          console.error("Error updating country data:", error);
        } finally {
          setLoading(false);
        }
      }
      
      updateCountryData();
    }
  }, [selectedCountry]);

  // Procesar datos CSV - Aseguramos que siempre cargamos datos desde los CSV correctos
  const processData = (gdpData: GDPConsolidadoData[], ccaaData: GastoIDComunidadesData[], year: string, selectedCountryISO3: string = 'ESP') => {
    console.log(`Procesando datos para año: ${year}, idioma: ${language}, país: ${selectedCountryISO3}`);
    
    // Verificamos el formato de los datos para determinar si los valores ya están en porcentaje o decimal
    const sampleEUData = gdpData.find(row => 
      row.Year === year && 
      row['%GDP'] !== undefined
    );
    
    const sampleCanaryData = ccaaData.find(row =>
      row['Año'] === year &&
      row['% PIB I+D'] !== undefined
    );
    
    // Determinamos si los valores ya están en porcentaje (> 1) o en decimal (< 1)
    const euValueIsPercentage = sampleEUData && parseFloat(sampleEUData['%GDP']) > 1;
    const canaryValueIsPercentage = sampleCanaryData && parseFloat(sampleCanaryData['% PIB I+D']) > 1;
    
    console.log(`Formato detectado - UE/Países: ${euValueIsPercentage ? 'Porcentaje' : 'Decimal'}, Canarias: ${canaryValueIsPercentage ? 'Porcentaje' : 'Decimal'}`);

    // Datos para la UE desde gdp_consolidado.csv
    const euTotalData = gdpData.find(row => 
      row.Year === year && 
      row.Country === "European Union - 27 countries (from 2020)" && 
      row.Sector === "All Sectors"
    );
    
    const euSectorData = gdpData.filter(row => 
      row.Year === year && 
      row.Country === "European Union - 27 countries (from 2020)" && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para el país seleccionado desde gdp_consolidado.csv
    const countryData = gdpData.filter(row => row.ISO3 === selectedCountryISO3);
    
    const countryTotalData = countryData.find(row => 
      row.Year === year && 
      row.Sector === "All Sectors"
    );
    
    const countrySectorData = countryData.filter(row => 
      row.Year === year && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para Canarias desde gasto_ID_comunidades_porcentaje_pib.csv
    const canaryTotalData = ccaaData.find(row => 
      row['Año'] === year && 
      row['Comunidad Limpio'] === "Canarias" && 
      row['Sector Id'] === "(_T)"
    );
    
    const canarySectorData = ccaaData.filter(row => 
      row['Año'] === year && 
      row['Comunidad Limpio'] === "Canarias" && 
      row['Sector Id'] !== "(_T)" &&
      row['Sector Id'] !== "_T"
    );

    // Procesar datos para cada región
    const regionsProcessed: RegionData[] = [];
    
    // Almacenaremos el orden de sectores de la UE para usarlo en otras regiones
    let euSectorOrder: {id: string, name: string}[] = [];
    
    // UE
    if (euTotalData && euSectorData.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawEuTotal = parseFloat(euTotalData['%GDP']);
      // Procesamos según formato detectado
      const euTotal = euValueIsPercentage ? rawEuTotal : rawEuTotal * 100;
      
      // Procesamos los datos de sectores
      const euSectorValues = euSectorData.map(row => {
        const sectorId = getSectorIdFromName(row.Sector);
        const rawValue = parseFloat(row['%GDP']);
        // Si ya está en porcentaje, lo usamos directamente, sino multiplicamos por 100
        const value = euValueIsPercentage ? rawValue : rawValue * 100;
        
        return {
          id: sectorId,
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row.Sector :
            row.Sector,
          value: value,
          color: getSectorColor(sectorId)
        };
      });
      
      // Ordenamos los sectores de mayor a menor valor
      euSectorValues.sort((a, b) => b.value - a.value);
      
      // Guardamos el orden de sectores para usarlo en otras regiones
      euSectorOrder = euSectorValues.map(s => ({ id: s.id, name: s.name }));
      
      // Calculamos la suma real de los sectores para verificar
      const euSectorSum = euSectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const euProcessed: RegionData = {
        name: language === 'es' ? 'Unión Europea' : 'European Union',
        flagCode: 'eu',
        iso3: 'EUU',
        totalPercentage: euTotal.toString(),
        total: euTotal,
        data: euSectorValues
      };
      
      // Registramos para depuración
      console.log(`UE - Total: ${euTotal.toFixed(2)}%, Suma sectores: ${euSectorSum.toFixed(2)}%`);
      
      regionsProcessed.push(euProcessed);
    }
    
    // País seleccionado
    if (countryTotalData && countrySectorData.length > 0 && euSectorOrder.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawCountryTotal = parseFloat(countryTotalData['%GDP']);
      // Procesamos según formato detectado
      const countryTotal = euValueIsPercentage ? rawCountryTotal : rawCountryTotal * 100;
      
      // Procesamos los datos de sectores
      const countrySectorMap = new Map<string, SectorDataItem>();
      
      // Primero creamos un mapa con todos los sectores disponibles
      countrySectorData.forEach(row => {
        const sectorId = getSectorIdFromName(row.Sector);
        const rawValue = parseFloat(row['%GDP']);
        // Si ya está en porcentaje, lo usamos directamente, sino multiplicamos por 100
        const value = euValueIsPercentage ? rawValue : rawValue * 100;
        
        countrySectorMap.set(sectorId, {
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row.Sector :
            row.Sector,
          value: value,
          color: getSectorColor(sectorId)
        });
      });
      
      // Luego ordenamos los sectores según el orden de la UE
      const countrySectorValues = euSectorOrder.map(sectorInfo => {
        // Si el sector existe en los datos del país, lo usamos
        if (countrySectorMap.has(sectorInfo.id)) {
          return countrySectorMap.get(sectorInfo.id)!;
        }
        // Si no existe, creamos un valor cero
        return {
          name: sectorInfo.name,
          value: 0,
          color: getSectorColor(sectorInfo.id)
        };
      });
      
      // Calculamos la suma real de los sectores para verificar
      const countrySectorSum = countrySectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const countryProcessed: RegionData = {
        name: language === 'es' ? countryTotalData.País : countryTotalData.Country,
        flagCode: 'country',
        iso3: countryTotalData.ISO3,
        totalPercentage: countryTotal.toString(),
        total: countryTotal,
        data: countrySectorValues
      };
      
      // Registramos para depuración
      console.log(`${countryTotalData.Country} - Total: ${countryTotal.toFixed(2)}%, Suma sectores: ${countrySectorSum.toFixed(2)}%`);
      
      regionsProcessed.push(countryProcessed);
    }
    
    // Canarias
    if (canaryTotalData && canarySectorData.length > 0 && euSectorOrder.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawCanaryTotal = parseFloat(canaryTotalData['% PIB I+D']);
      
      // No multiplicamos por 100 - mantenemos el valor original para Canarias
      const canaryTotal = rawCanaryTotal;
      
      console.log(`Canarias - Valor total: ${canaryTotal}`);
      
      // Creamos un mapa para los sectores de Canarias
      const canarySectorMap = new Map<string, SectorDataItem>();
      
      // Procesamos los datos de sectores
      canarySectorData.forEach(row => {
        const sectorIdRaw = row['Sector Id'].replace(/[()]/g, '');
        const sectorId = getSectorIdFromCode(sectorIdRaw);
        const rawValue = parseFloat(row['% PIB I+D']) || 0; // Aseguramos valor numérico
        
        // No convertimos - mantenemos el valor original
        const value = rawValue;
        
        canarySectorMap.set(sectorId, {
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row['Sector Nombre'] :
            rdSectors.find(s => s.id === sectorId)?.name.en || row['Sector'],
          value: value,
          color: getSectorColor(sectorId)
        });
      });
      
      // Ordenamos los sectores según el orden de la UE
      const canarySectorValues = euSectorOrder.map(sectorInfo => {
        // Si el sector existe en los datos de Canarias, lo usamos
        if (canarySectorMap.has(sectorInfo.id)) {
          return canarySectorMap.get(sectorInfo.id)!;
        }
        // Si no existe, creamos un valor cero
        return {
          name: sectorInfo.name,
          value: 0,
          color: getSectorColor(sectorInfo.id)
        };
      });
      
      // Calculamos la suma real de los sectores para verificar
      const canarySectorSum = canarySectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const canaryProcessed: RegionData = {
        name: language === 'es' ? 'Islas Canarias' : 'Canary Islands',
        flagCode: 'canary_islands',
        totalPercentage: canaryTotal.toString(),
        total: canaryTotal,
        data: canarySectorValues
      };
      
      // Registramos para depuración
      console.log(`Canarias - Total procesado: ${canaryTotal.toFixed(2)}%`);
      console.log(`Canarias - Suma sectores: ${canarySectorSum.toFixed(2)}%`);
      console.log(`Canarias - Sectores encontrados: ${canarySectorValues.length}`);
      
      regionsProcessed.push(canaryProcessed);
    } else {
      console.warn('No se encontraron datos completos para Canarias en el año seleccionado');
      if (!canaryTotalData) console.warn(`  - Falta dato total para Canarias en el año ${year}`);
      if (!canarySectorData || canarySectorData.length === 0) console.warn(`  - No hay datos de sectores para Canarias en el año ${year}`);
    }
    
    // Aseguramos que los nombres están en el idioma correcto
    regionsProcessed.forEach(region => {
      region.data.forEach(sector => {
        // Actualizar el nombre según el idioma seleccionado si es necesario
        const sectorId = getSectorIdFromName(sector.name);
        if (sectorId !== 'unknown') {
          const sectorInfo = rdSectors.find(s => s.id === sectorId);
          if (sectorInfo) {
            sector.name = language === 'es' ? sectorInfo.name.es : sectorInfo.name.en;
          }
        }
      });
    });
    
    // Calcular porcentajes para cada región
    const processedWithPercentages = regionsProcessed.map(region => {
      // Calculamos la suma real de todos los valores para asegurar que el %Total sume 100%
      const actualTotal = region.data.reduce((sum, item) => sum + item.value, 0);
      
      const dataWithPercentage = region.data.map(sector => {
        // Calculamos el porcentaje basado en la suma real
        const sharePercentage = (sector.value / actualTotal) * 100;
        return { 
          ...sector, 
          sharePercentage
        };
      });
      
      return {
        ...region,
        data: dataWithPercentage
      };
    });
    
    setRegionsData(processedWithPercentages);
  };

  // Función para obtener el color del sector
  const getSectorColor = (sectorId: string): string => {
    if (sectorId === 'business' || sectorId === 'government' || sectorId === 'education' || sectorId === 'nonprofit') {
      return sectorColors[sectorId];
    }
    return '#cbd5e1'; // Color por defecto si no hay coincidencia
  };
  
  // Función para obtener el ID del sector a partir del nombre en inglés
  const getSectorIdFromName = (sectorNameEn: string): string => {
    const sector = rdSectors.find(s => s.name.en === sectorNameEn);
    return sector?.id || 'unknown';
  };
  
  // Función para obtener el ID del sector a partir del código
  const getSectorIdFromCode = (sectorCode: string): string => {
    const sector = rdSectors.find(s => s.code === sectorCode);
    return sector?.id || 'unknown';
  };
  
  // Definimos el tipo para los datos del tooltip
  interface TooltipContentProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      payload: SectorDataItem;
    }>;
  }
  
  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload }: TooltipContentProps) => {
    if (active && payload && payload.length) {
      // Obtenemos el color del sector para usarlo en el tooltip
      const sectorColor = payload[0].payload.color;
      
      return (
        <div className="bg-white p-4 rounded-md shadow-lg border border-gray-200 min-w-[180px]">
          <div className="flex items-center mb-2">
            <div 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
              style={{ backgroundColor: sectorColor }}
            ></div>
            <p className="font-medium text-gray-800">{payload[0].name}</p>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <p className="text-sm text-gray-700 flex justify-between items-center">
              <span>{t.pibPercentage}:</span>
              <span className="font-semibold">{payload[0].value.toFixed(2)}%</span>
            </p>
            <p className="text-sm text-gray-700 flex justify-between items-center mt-1">
              <span>% {t.total}:</span>
              <span className="font-semibold">{payload[0].payload.sharePercentage?.toFixed(2)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Obtener el valor de color sin el prefijo bg-
  const getHeaderColorValue = (code: FlagCode): string => {
    switch(code) {
      case 'eu':
        return '#4338ca'; // indigo-700
      case 'es':
      case 'country':
        return '#dc2626'; // red-600
      case 'canary_islands':
        return '#3b82f6'; // blue-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  const SectorList: React.FC<{
    data: RegionData;
  }> = ({ data }) => {
    return (
      <div className="mt-1">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-1">
          <div>{t.sector}</div>
          <div className="text-right">{t.pibPercentage}</div>
          <div className="text-right">%{t.total}</div>
        </div>
        
        {/* Filas de datos */}
        {data.data.map((sector, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-gray-100">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                style={{ backgroundColor: sector.color }}
              ></div>
              <div className="leading-tight">{sector.name}</div>
            </div>
            <div className="font-medium text-right">{sector.value.toFixed(2)}%</div>
            <div className="text-right text-gray-600">{sector.sharePercentage?.toFixed(2)}%</div>
          </div>
        ))}
        
        {/* Fila de totales */}
        <div className="grid grid-cols-3 gap-2 text-xs py-1 border-t border-gray-200 font-medium mt-1">
          <div>{t.total}:</div>
          <div className="text-right">{parseFloat(data.totalPercentage).toFixed(2)}%</div>
          <div className="text-right">100%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Filter section - Solo con el selector de año */}
      <div className="bg-blue-50 px-4 py-3 flex flex-wrap items-center gap-4">
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
      
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Chart grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {regionsData.map((region, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Region header - Con selector para el país */}
              <div className="bg-white p-3 flex items-center justify-between border-t-4" style={{ borderColor: getHeaderColorValue(region.flagCode) }}>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Flag 
                      code={region.flagCode} 
                      width={24} 
                      height={18} 
                    />
                  </div>
                  
                  {region.flagCode === 'country' ? (
                    <div className="relative group">
                      <button 
                        className="font-medium text-gray-800 flex items-center border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                        onClick={() => {
                          const dropdown = document.getElementById('country-dropdown');
                          if (dropdown) {
                            dropdown.classList.toggle('hidden');
                          }
                        }}
                      >
                        <span className="mr-1 truncate max-w-[150px]">{region.name}</span>
                        <ChevronDown size={16} className="text-gray-500 ml-auto" />
                      </button>
                      
                      <div 
                        id="country-dropdown"
                        className="absolute z-10 mt-1 hidden bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto w-64"
                      >
                        <div className="py-1">
                          {countries.map(country => (
                            <button
                              key={country.iso3}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${selectedCountry?.iso3 === country.iso3 ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedCountry(country);
                                document.getElementById('country-dropdown')?.classList.add('hidden');
                              }}
                            >
                              <div className="mr-2">
                                <Flag 
                                  code="country" 
                                  width={20} 
                                  height={15} 
                                />
                              </div>
                              {language === 'es' ? country.localName : country.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <h3 className="font-medium text-gray-800">{region.name}</h3>
                  )}
                </div>
              </div>
              
              {/* Chart */}
              <div className="py-5 px-2 flex justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={region.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {region.data.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.color} 
                            stroke="white"
                            strokeWidth={1}
                            className="hover:opacity-80 cursor-pointer transition-opacity"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip />} 
                        wrapperStyle={{ zIndex: 100 }}
                        cursor={{ fill: 'transparent' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-gray-800">{parseFloat(region.totalPercentage).toFixed(2)}%</span>
                    <span className="text-sm text-gray-500">{t.ofGDP}</span>
                  </div>
                </div>
              </div>
              
              {/* Data table - Usando SectorList */}
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

export default SectorDistribution; 