import React, { useState, useEffect } from 'react';
import EuropeanRDMap from '../../components/EuropeanRDMap';
import CountryRankingChart from '../../components/CountryRankingChart';
import SectorDistribution from '../../components/SectorDistribution';
import RDComparisonChart from '../../components/RDComparisonChart';
import DataTypeSelector, { DataDisplayType } from '../../components/DataTypeSelector';
import SpanishRegionsMap from '../../components/SpanishRegionsMap';
import RegionRankingChart from '../../components/RegionRankingChart';
import Papa from 'papaparse';
import { DATA_PATHS, rdSectors } from '../../data/rdInvestment';
import CommunityDistribution from '../../components/CommunityDistribution';
import CommunityRDComparisonChart from '../../components/CommunityRDComparisonChart';
import SectorEvolutionChart from '../../components/SectorEvolutionChart';

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

// Interfaz para los datos CSV con tipado seguro para uso interno en este componente
interface ExtendedEuropeCSVData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Value: string;
  '%GDP': string;
  ISO3?: string;
  Approx_RD_Investment_million_euro?: string;
  [key: string]: string | undefined;
}

// Interfaz compatible con GDPConsolidadoData para el componente RDComparisonChart
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
  Value?: string;
  Approx_RD_Investment_million_euro?: string;
}

// Interfaz para los datos de etiquetas
export interface LabelData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Label: string;
  [key: string]: string | undefined;
}

// Textos localizados para la página de inversión
const texts = {
  es: {
    investmentTitle: "Inversión en I+D",
    investmentDescription: "Análisis comparativo de la inversión como porcentaje del PIB.",
    year: "Año:",
    sector: "Sector:",
    loading: "Cargando datos...",
    errorPrefix: "Error al cargar los datos:",
    noDataAvailable: "No hay datos disponibles para el año y sector seleccionados.",
    supranational: "Entidades supranacionales",
    euroArea19: "Zona Euro (19 países)",
    euroArea19Full: "(2015-2022)",
    euroArea20: "Zona Euro (20 países)",
    euroArea20Full: "(desde 2023)",
    europeanUnion: "Unión Europea (27 países)",
    euFull: "(desde 2020)",
    observationFlags: "Leyenda estadística",
    estimated: "Estimado",
    provisional: "Provisional",
    definitionDiffers: "Definición diferente",
    breakInTimeSeries: "Ruptura en serie temporal",
    breakInTimeSeriesDefinitionDiffers: "Ruptura en serie y definición diferente",
    definitionDiffersEstimated: "Definición diferente y estimado",
    definitionDiffersProvisional: "Definición diferente y provisional",
    estimatedProvisional: "Estimado y provisional",
    breakInTimeSeriesProvisional: "Ruptura en serie y provisional",
    lowReliability: "Baja fiabilidad",
    keyMetricsTitle: "Indicadores principales",
    euComparisonTitle: "Panorama europeo",
    spanishRegionsTitle: "Análisis por comunidades autónomas",
    countryRanking: "Ranking de países",
    noData: "No hay datos disponibles para este año"
  },
  en: {
    investmentTitle: "R&D Investment",
    investmentDescription: "Comparative analysis of investment as a percentage of GDP.",
    year: "Year:",
    sector: "Sector:",
    loading: "Loading data...",
    errorPrefix: "Error loading data:",
    noDataAvailable: "No data available for the selected year and sector.",
    supranational: "Supranational entities",
    euroArea19: "Euro Area (19)",
    euroArea19Full: "(2015-2022)",
    euroArea20: "Euro Area (20)",
    euroArea20Full: "(from 2023)",
    europeanUnion: "European Union (27)",
    euFull: "(from 2020)",
    observationFlags: "Statistical legend",
    estimated: "Estimated",
    provisional: "Provisional",
    definitionDiffers: "Different definition",
    breakInTimeSeries: "Break in time series",
    breakInTimeSeriesDefinitionDiffers: "Break in series and different definition",
    definitionDiffersEstimated: "Different definition and estimated",
    definitionDiffersProvisional: "Different definition and provisional",
    estimatedProvisional: "Estimated and provisional",
    breakInTimeSeriesProvisional: "Break in series and provisional",
    lowReliability: "Low reliability",
    keyMetricsTitle: "Key Indicators",
    euComparisonTitle: "European Landscape",
    spanishRegionsTitle: "Analysis by Autonomous Communities",
    countryRanking: "Country Ranking",
    noData: "No data available for this year"
  }
};

interface InvestmentProps {
  language: 'es' | 'en';
}

const Investment: React.FC<InvestmentProps> = ({ language }) => {
  const [europeData, setEuropeData] = useState<ExtendedEuropeCSVData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedSector, setSelectedSector] = useState<string>("All Sectors");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autonomousCommunitiesData, setAutonomousCommunitiesData] = useState<AutonomousCommunityData[]>([]);
  const [dataDisplayType, setDataDisplayType] = useState<DataDisplayType>('percent_gdp');
  
  // Nuevas variables de estado para los filtros de comunidades autónomas
  const [availableRegionYears, setAvailableRegionYears] = useState<number[]>([]);
  const [selectedRegionYear, setSelectedRegionYear] = useState<number>(2023);
  const [selectedRegionSector, setSelectedRegionSector] = useState<string>("All Sectors");
  
  // Función auxiliar para acceder a los textos según el idioma actual
  const t = texts[language];

  // Función para obtener el nombre del sector seleccionado
  /* Esta función se mantiene por compatibilidad con posibles usos futuros */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getSectorName = (sectorValue: string): string => {
    if (sectorValue === 'All Sectors') {
      return language === 'es' ? 'Todos los sectores' : 'All sectors';
    }
    
    // Mapeo de nombres completos a nombres localizados
    const sectorNames: Record<string, { es: string, en: string }> = {
      'Business enterprise sector': {
        es: 'Sector empresarial',
        en: 'Business enterprise sector'
      },
      'Government sector': {
        es: 'Administración Pública',
        en: 'Government sector'
      },
      'Higher education sector': {
        es: 'Enseñanza Superior',
        en: 'Higher education sector'
      },
      'Private non-profit sector': {
        es: 'Instituciones Privadas sin Fines de Lucro',
        en: 'Private non-profit sector'
      }
    };
    
    // Si está en el mapeo, usar el nombre localizado
    if (sectorValue in sectorNames) {
      return sectorNames[sectorValue][language];
    }
    
    // Buscar por ID en rdSectors si no coincide con el mapeo
    const sector = rdSectors.find(s => s.id === sectorValue);
    if (sector) {
      return sector.name[language];
    }
    
    // Fallback: retornar el valor original
    return sectorValue;
  };

  // Efecto para cargar los datos desde los archivos CSV
  useEffect(() => {
    const loadCSVData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Intentando cargar datos desde:", DATA_PATHS.GDP_EUROPE);
        
        // Cargar datos de Europa
        const europeResponse = await fetch('./data/GDP_data/gdp_consolidado.csv');
        if (!europeResponse.ok) {
          throw new Error(`${t.errorPrefix} ${europeResponse.status} - ${europeResponse.statusText}`);
        }
        
        const europeText = await europeResponse.text();
        const europeResult = Papa.parse(europeText, {
          header: true,
          skipEmptyLines: true,
        });
        
        const parsedEuropeData = europeResult.data as ExtendedEuropeCSVData[];
        setEuropeData(parsedEuropeData);
        
        // Extraer los años disponibles
        const uniqueYears = Array.from(new Set(parsedEuropeData.map(item => parseInt(item.Year))))
          .filter(year => !isNaN(year))
          .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        
        setAvailableYears(uniqueYears);
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]); // Establecer el año más reciente por defecto
        }
        
        // Cargar datos de comunidades autónomas de España
        const autonomousResponse = await fetch('./data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        if (!autonomousResponse.ok) {
          throw new Error(`${t.errorPrefix} ${autonomousResponse.status} - ${autonomousResponse.statusText}`);
        }
        
        const autonomousText = await autonomousResponse.text();
        const autonomousResult = Papa.parse(autonomousText, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
        });
        
        const parsedAutonomousData = autonomousResult.data as AutonomousCommunityData[];
        setAutonomousCommunitiesData(parsedAutonomousData);
        
        // Extraer los años disponibles para comunidades autónomas
        const regionYears = Array.from(new Set(parsedAutonomousData.map(item => parseInt(item.Año))))
          .filter(year => !isNaN(year))
          .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        
        setAvailableRegionYears(regionYears);
        if (regionYears.length > 0) {
          setSelectedRegionYear(regionYears[0]); // Establecer el año más reciente por defecto
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCSVData();
  }, [t]); // Solo se ejecuta cuando cambia el idioma
  
  const handleSectorChange = (sectorId: string) => {
    const sectorInEnglish = rdSectors.find(s => s.id === sectorId)?.name.en || "All Sectors";
    setSelectedSector(sectorInEnglish);
  };
  
  // Nuevo manejador para cambio de sector en comunidades autónomas
  const handleRegionSectorChange = (sectorId: string) => {
    const sectorInEnglish = rdSectors.find(s => s.id === sectorId)?.name.en || "All Sectors";
    setSelectedRegionSector(sectorInEnglish);
  };
  
  const getSectorId = (sectorNameEn: string): string => {
    const sector = rdSectors.find(s => s.name.en === sectorNameEn);
    return sector ? sector.id : "_T"; // "_T" es el ID para "Todos los sectores"
  };
  
  const handleDataTypeChange = (newType: DataDisplayType) => {
    setDataDisplayType(newType);
  };
  
  const mapToGDPConsolidadoData = (data: ExtendedEuropeCSVData[]): GDPConsolidadoData[] => {
    return data.map(item => {
      const mapped: GDPConsolidadoData = {
        Country: item.Country,
        País: item.País,
        Year: item.Year,
        Sector: item.Sector,
        '%GDP': item['%GDP'],
        ISO3: item.ISO3 || '',
        Value: item.Value,
        Approx_RD_Investment_million_euro: item.Approx_RD_Investment_million_euro,
      };
      return mapped;
    });
  };
  
  const SupranationalEntities = () => {
    // Componente para mostrar las entidades supranacionales
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t.supranational}</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
            <span className="text-sm text-gray-700">{t.euroArea19}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euroArea19Full}</span>
          </div>
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-700 mr-2"></div>
            <span className="text-sm text-gray-700">{t.euroArea20}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euroArea20Full}</span>
          </div>
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-800 mr-2"></div>
            <span className="text-sm text-gray-700">{t.europeanUnion}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euFull}</span>
          </div>
        </div>
      </div>
    );
  };
  
  const ObservationFlags = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">{t.observationFlags}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">e</span>
          <span className="text-xs text-gray-600">{t.estimated}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">p</span>
          <span className="text-xs text-gray-600">{t.provisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">d</span>
          <span className="text-xs text-gray-600">{t.definitionDiffers}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">b</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeries}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">bd</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeriesDefinitionDiffers}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">de</span>
          <span className="text-xs text-gray-600">{t.definitionDiffersEstimated}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">dp</span>
          <span className="text-xs text-gray-600">{t.definitionDiffersProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">ep</span>
          <span className="text-xs text-gray-600">{t.estimatedProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">bp</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeriesProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">u</span>
          <span className="text-xs text-gray-600">{t.lowReliability}</span>
        </div>
      </div>
    </div>
  );
  
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );
  
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  // Función para obtener datos fijos para los indicadores clave, siempre del año más reciente y sector 'All Sectors'
  const getFixedKeyMetricsData = () => {
    if (europeData.length === 0 || availableYears.length === 0) {
      return {
        mostRecentYear: 0,
        euData: null,
        spainData: null,
        topRegionData: null,
        canariasData: null
      };
    }

    const mostRecentYear = availableYears[0]; // El año más reciente
    const yearStr = mostRecentYear.toString();
    const allSectorData = europeData.filter(item => item.Year === yearStr && item.Sector === 'All Sectors');

    // Datos de la Unión Europea
    const euData = allSectorData.find(item => 
      item.Country === 'European Union - 27 countries (from 2020)' ||
      item.Country === 'European Union (27)'
    );

    // Datos de España
    const spainData = allSectorData.find(item => 
      item.Country === 'Spain'
    );

    // El año anterior para comparativas
    const previousYearStr = (mostRecentYear - 1).toString();
    const previousYearData = europeData.filter(item => 
      item.Year === previousYearStr && item.Sector === 'All Sectors'
    );

    // Datos del año anterior para la UE
    const previousEuData = previousYearData.find(item => 
      item.Country === 'European Union - 27 countries (from 2020)' ||
      item.Country === 'European Union (27)'
    );

    // Datos del año anterior para España
    const previousSpainData = previousYearData.find(item => 
      item.Country === 'Spain'
    );

    // Datos de comunidades autónomas del año más reciente
    const mostRecentRegionYear = availableRegionYears[0];
    const regionYearStr = mostRecentRegionYear.toString();
    
    const regionData = autonomousCommunitiesData.filter(item => 
      item["Año"] === regionYearStr && item["Sector Id"] === "(_T)"
    );

    // Encontrar la comunidad con el valor más alto de PIB I+D
    let topRegion = null;
    let topValue = 0;
    regionData.forEach(item => {
      const value = parseFloat(item["% PIB I+D"].replace(',', '.'));
      if (!isNaN(value) && value > topValue) {
        topValue = value;
        topRegion = item;
      }
    });

    // Datos de Canarias
    const canariasData = regionData.find(item => 
      item["Comunidad Limpio"].toLowerCase() === "canarias"
    );

    return {
      mostRecentYear,
      euData,
      spainData,
      previousEuData,
      previousSpainData,
      topRegionData: topRegion,
      canariasData
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Sección 1: Key Metrics */}
          <div className="mb-12 mt-[-15px]">
            <SectionTitle title={t.keyMetricsTitle} />
            <div className="mb-4 flex items-center">
              {
                (() => {
                  const { mostRecentYear } = getFixedKeyMetricsData();
                  return (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <h2 className="text-gray-700 font-medium text-sm">
                        {language === 'es' ? `Información para el año ${mostRecentYear}` : `Information for year ${mostRecentYear}`}
                      </h2>
                      <div className="ml-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full flex items-center">
                        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                {language === 'es' ? 'Datos más recientes' : 'Latest data'}
              </div>
                    </div>
                  );
                })()
              }
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' }}>
              {/* Métrica 1: Media UE */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="p-3 bg-blue-50 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">
                        {language === 'es' ? 'Unión Europea' : 'European Union'}
                      </h3>
                    </div>
                    <div className="flex items-baseline mt-1">
                      {
                          (() => {
                          const { euData } = getFixedKeyMetricsData();
                          return (
                            <>
                              <span className="text-2xl font-bold text-blue-700">
                                {euData ? `${parseFloat(euData['%GDP']).toFixed(2)}%` : '--'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {language === 'es' ? 'del PIB' : 'of GDP'}
                      </span>
                            </>
                          );
                        })()
                      }
                    </div>
                    {
                      (() => {
                        const { euData, previousEuData } = getFixedKeyMetricsData();
                        if (euData && previousEuData) {
                          const currentValue = parseFloat(euData['%GDP']);
                          const previousValue = parseFloat(previousEuData['%GDP']);
                          const yoyChange = ((currentValue - previousValue) / previousValue) * 100;

                          return (
                            <div className="flex items-center mt-1.5">
                              <span className={`text-xs font-medium ${yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(2)}% {language === 'es' ? 'vs año anterior' : 'vs previous year'}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center mt-1.5">
                            <span className="text-xs font-medium text-gray-400">
                              -- {language === 'es' ? 'vs año anterior' : 'vs previous year'}
                            </span>
                          </div>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
              
              {/* Métrica 2: España y ranking */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                                      <div className="flex flex-col items-center mr-4">
                    <div className="p-3 bg-red-50 rounded-lg mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">
                        {language === 'es' ? 'España' : 'Spain'}
                      </h3>
                    </div>
                    <div className="flex items-baseline mt-1">
                      {
                          (() => {
                          const { spainData } = getFixedKeyMetricsData();
                          return (
                            <>
                              <span className="text-2xl font-bold text-red-700">
                                {spainData ? `${parseFloat(spainData['%GDP']).toFixed(2)}%` : '--'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {language === 'es' ? 'del PIB' : 'of GDP'}
                      </span>
                            </>
                          );
                        })()
                      }
                    </div>
                    <div className="flex items-center mt-1.5">
                      {
                           (() => {
                          const { euData, spainData } = getFixedKeyMetricsData();
                          const { mostRecentYear } = getFixedKeyMetricsData();
                          const yearStr = mostRecentYear.toString();
                          
                          // Cálculo de comparativa con la UE
                          if (euData && spainData) {
                            const euValue = parseFloat(euData['%GDP']);
                            const spainValue = parseFloat(spainData['%GDP']);
                            const diffPercent = ((spainValue - euValue) / euValue) * 100;
                            
                            // Cálculo del ranking
                            let ranking = 0;
                            if (europeData.length > 0) {
                              const yearData = europeData.filter(item => 
                                item.Year === yearStr && item.Sector === 'All Sectors'
                              );
                              
                               // Función para normalizar texto (remover acentos)
                               const normalizeText = (text: string | undefined): string => {
                                 if (!text) return '';
                                 return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                               };
                              
                               // Función para verificar si una entidad es UE, zona euro u otra entidad no país
                               const isSupranationalEntity = (name: string): boolean => {
                                 const normalizedName = normalizeText(name);
                                 return normalizedName.includes('european union') || 
                                        normalizedName.includes('euro area') ||
                                        normalizedName.includes('oecd') ||
                                        normalizedName.includes('average');
                               };
                               
                               // Filtrar solo países (no promedios ni grupos)
                               const countriesData = yearData.filter(item => 
                                 !isSupranationalEntity(item.Country)
                               );
                               
                               // Ordenar por valor de %GDP (descendente) con criterio estable
                               const sortedCountries = [...countriesData].sort((a, b) => {
                                 // Comparar primero por valor
                                 const valueDiff = parseFloat(b['%GDP']) - parseFloat(a['%GDP']);
                                 if (valueDiff !== 0) return valueDiff;
                                 
                                 // Si los valores son iguales, ordenar alfabéticamente para mantener un orden estable
                                 return a.Country.localeCompare(b.Country);
                               });
                               
                               // Encontrar la posición de España usando exactamente el mismo nombre que en el CSV
                               const spainIndex = sortedCountries.findIndex(item => 
                                 item.Country === 'Spain'
                               );
                               
                               ranking = spainIndex !== -1 ? spainIndex + 1 : 0;
                             }
                               
                                                                return (
                                  <div>
                                    <div className={`text-xs font-medium ${diffPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}% {language === 'es' ? 'vs UE' : 'vs EU'}
                                    </div>
                                    <div className="mt-1.5 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                      {language === 'es' ? `Ranking UE #${ranking}` : `EU Ranking #${ranking}`}
                                    </div>
                                  </div>
                                );
                             }
                             
                                                           return (
                                <div>
                                  <div className="text-xs font-medium text-gray-400">
                                    -- {language === 'es' ? 'vs UE' : 'vs EU'}
                                  </div>
                                  <div className="mt-1.5 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                {language === 'es' ? `Ranking UE --` : `EU Ranking --`}
                                  </div>
                                </div>
                              );
                        })()
                         }
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Métrica 3: Top comunidad autónoma */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div className="p-3 bg-green-50 rounded-lg mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium text-center w-16">
                      {language === 'es' ? 'TOP' : 'TOP'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500">
                        {language === 'es' ? 'Comunidad Autónoma' : 'Region'}
                      </h3>
                    </div>
                    {
                      (() => {
                        const { topRegionData } = getFixedKeyMetricsData();
                        
                        if (topRegionData) {
                          const regionName = language === 'es' ? 
                            topRegionData["Comunidad Limpio"] : 
                            topRegionData["Comunidad en Inglés"];
                          
                          // Obtener el valor de manera segura para TypeScript
                          let value = 0;
                          try {
                            if (topRegionData && typeof topRegionData === 'object') {
                              const val = Object.entries(topRegionData)
                                .find(([key]) => key === "% PIB I+D")?.[1] || '0';
                              value = parseFloat(String(val).replace(',', '.'));
                            }
                          } catch {
                            // En caso de error, usar valor por defecto
                        }
                        
                        return (
                          <>
                            <div className="mt-1">
                              <span className="text-lg font-bold text-gray-800 truncate" style={{ maxWidth: '150px' }}>
                                  {regionName}
                              </span>
                            </div>
                            <div className="flex items-baseline mt-1">
                              <span className="text-2xl font-bold text-green-700">
                                  {value.toFixed(2)}%
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                {language === 'es' ? 'del PIB' : 'of GDP'}
                              </span>
                            </div>
                          </>
                        );
                        }
                        
                        return (
                      <>
                        <div className="mt-1">
                          <span className="text-lg font-bold text-gray-600 truncate" style={{ maxWidth: '150px' }}>
                            {language === 'es' ? 'Sin datos' : 'No data'}
                          </span>
                        </div>
                        <div className="flex items-baseline mt-1">
                          <span className="text-2xl font-bold text-gray-400">--</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {language === 'es' ? 'del PIB' : 'of GDP'}
                          </span>
                        </div>
                      </>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
              
              {/* Métrica 4: Canarias */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                                      <div className="flex flex-col items-center mr-4">
                    <div className="p-3 bg-yellow-50 rounded-lg mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">
                        {language === 'es' ? 'Canarias' : 'Canary Islands'}
                      </h3>
                    </div>
                    {
                      (() => {
                        const { canariasData, spainData } = getFixedKeyMetricsData();
                        
                        if (canariasData && spainData) {
                          const canariasValue = parseFloat(canariasData["% PIB I+D"].replace(',', '.'));
                          const spainValue = parseFloat(spainData['%GDP']);
                          
                          // Calcular diferencia porcentual contra España
                          const diff = ((canariasValue - spainValue) / spainValue) * 100;
                          
                          // Calcular ranking de Canarias entre comunidades autónomas
                          const { mostRecentYear } = getFixedKeyMetricsData();
                          const regionYearStr = mostRecentYear.toString();
                          const allRegionData = autonomousCommunitiesData.filter(item => 
                            item["Año"] === regionYearStr && item["Sector Id"] === "(_T)"
                          );
                          
                          // Extraer valores únicos por comunidad
                              const communityMap = new Map();
                          allRegionData.forEach(item => {
                                const name = item["Comunidad Limpio"];
                                const value = parseFloat(item["% PIB I+D"].replace(',', '.'));
                                if (!isNaN(value)) {
                                  communityMap.set(name, value);
                                }
                              });
                              
                          // Ordenar comunidades por valor
                              const sortedCommunities = Array.from(communityMap.entries())
                                .sort((a, b) => b[1] - a[1]);
                              
                              // Encontrar la posición de Canarias
                              const canariasIndex = sortedCommunities.findIndex(([name]) => 
                                name.toLowerCase() === "canarias"
                              );
                              
                          const canariasRank = canariasIndex !== -1 ? canariasIndex + 1 : 'N/A';
                              
                              return (
                            <>
                              <div className="flex items-baseline mt-1">
                                <span className="text-2xl font-bold text-yellow-700">
                                  {canariasValue.toFixed(2)}%
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {language === 'es' ? 'del PIB' : 'of GDP'}
                                </span>
                              </div>
                              <div className="flex items-center mt-1.5">
                                <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% {language === 'es' ? 'vs España' : 'vs Spain'}
                                </span>
                              </div>
                                <div className="mt-1.5 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium text-center">
                                  {language === 'es' ? `Ranking nacional #${canariasRank}` : `National Ranking #${canariasRank}`}
                                </div>
                          </>
                        );
                        }
                        
                        return (
                      <>
                        <div className="flex items-baseline mt-1">
                          <span className="text-2xl font-bold text-gray-400">--</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {language === 'es' ? 'del PIB' : 'of GDP'}
                          </span>
                        </div>
                        <div className="flex items-center mt-1.5">
                          <span className="text-xs font-medium text-gray-400">
                            -- {language === 'es' ? 'vs España' : 'vs Spain'}
                          </span>
                        </div>
                        <div className="mt-1.5 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium text-center">
                          {language === 'es' ? 'Ranking nacional: Sin datos' : 'National Ranking: No data'}
                        </div>
                      </>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección 2: Comparación entre la UE y países */}
          <div className="mb-12">
            <SectionTitle title={t.euComparisonTitle} />
            
            {/* Subsección 2.1: Mapa y ranking de inversión en I+D */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? 
                `Distribución geográfica` : 
                `Geographical Distribution`} 
              />
              
              {/* Filtros - DEJAR SOLO UN CONJUNTO DE FILTROS */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="text-blue-500 mr-2"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <label className="text-gray-700 font-medium mr-2">{t.year}</label>
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-gray-700 font-medium mr-2">{t.sector}</label>
                      <select 
                        value={getSectorId(selectedSector)}
                        onChange={(e) => handleSectorChange(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[240px]"
                      >
                        {rdSectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Selector de tipo de datos visible */}
                  <div>
                    <DataTypeSelector 
                      dataType={dataDisplayType} 
                      onChange={handleDataTypeChange} 
                      language={language} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Primera fila: Mapa y Gráfica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Mapa de Europa */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "500px" }}>
                  <EuropeanRDMap 
                    data={europeData} 
                    selectedYear={selectedYear} 
                    language={language} 
                    selectedSector={selectedSector}
                    autonomousCommunitiesData={autonomousCommunitiesData}
                    dataDisplayType={dataDisplayType}
                  />
                </div>
                
                {/* Ranking de países - Eliminar título duplicado y usar directamente el componente */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-[500px]">
                  {europeData.length > 0 ? (
                    <div className="h-full overflow-hidden" data-testid="country-ranking-chart">
                      <CountryRankingChart 
                        data={europeData}
                        selectedYear={selectedYear}
                        language={language}
                        selectedSector={getSectorId(selectedSector)}
                        autonomousCommunitiesData={autonomousCommunitiesData}
                        dataDisplayType={dataDisplayType}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      {isLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                          <p className="mt-4 text-gray-500">{t.loading}</p>
                        </div>
                      ) : error ? (
                        <div className="text-red-500">
                          <p>{error}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">{t.noData}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Segunda fila: Observation Flags y SUPRANATIONAL ENTITIES lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ObservationFlags />
                <SupranationalEntities />
              </div>
            </div>
            
            {/* Subsección 2.2: Distribución sectorial de la inversión en I+D */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Distribución por sectores" : "Distribution by Sectors"} />
              
              {/* Componente SectorDistribution */}
              <SectorDistribution language={language} />
              
              {/* Nuevo componente RDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitle title={language === 'es' ? "Tendencia histórica" : "Historical Trend"} />
                  <RDComparisonChart 
                    language={language}
                    gdpData={mapToGDPConsolidadoData(europeData)}
                    autonomousCommunitiesData={autonomousCommunitiesData}
                    years={availableYears.map(year => year.toString())}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Sección 3: Comparación por comunidades autónomas de España */}
          <div className="mb-12">
            <SectionTitle title={t.spanishRegionsTitle} />
            
            {/* Subsección 3.1: Mapa y ranking de inversión en I+D por comunidades */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? 
                `Distribución regional` : 
                `Regional Distribution`} 
              />
              
              {/* Filtros para la sección de comunidades autónomas */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="text-blue-500 mr-2"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <label className="text-gray-700 font-medium mr-2">{t.year}</label>
                      <select 
                        value={selectedRegionYear}
                        onChange={(e) => setSelectedRegionYear(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {availableRegionYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-gray-700 font-medium mr-2">{t.sector}</label>
                      <select 
                        value={getSectorId(selectedRegionSector)}
                        onChange={(e) => handleRegionSectorChange(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[240px]"
                      >
                        {rdSectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Selector de tipo de datos */}
                  <div>
                    <DataTypeSelector 
                      dataType={dataDisplayType} 
                      onChange={handleDataTypeChange} 
                      language={language} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Mapa y Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Mapa de España */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "500px" }}>
                  {autonomousCommunitiesData.length > 0 ? (
                    <SpanishRegionsMap 
                      data={autonomousCommunitiesData} 
                      selectedYear={selectedRegionYear} 
                      language={language} 
                      selectedSector={selectedRegionSector === 'All Sectors' ? 'total' : getSectorId(selectedRegionSector)}
                      dataDisplayType={dataDisplayType}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">{t.noData}</p>
                    </div>
                  )}
                </div>
                
                {/* Ranking de comunidades */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-[500px]">
                  {autonomousCommunitiesData.length > 0 ? (
                    <div className="h-full overflow-hidden" data-testid="region-ranking-chart">
                      <RegionRankingChart 
                        data={autonomousCommunitiesData}
                        selectedYear={selectedRegionYear}
                        language={language}
                        selectedSector={selectedRegionSector === 'All Sectors' ? 'total' : getSectorId(selectedRegionSector)}
                        dataDisplayType={dataDisplayType}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">{t.noData}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Nueva Subsección 3.2: Distribución sectorial de la inversión en I+D */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Análisis sectorial" : "Sectoral Analysis"} />
              
              {/* Componente CommunityDistribution */}
              <CommunityDistribution language={language} />
              
              {/* Nuevo componente CommunityRDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitle title={language === 'es' ? "Evolución histórica" : "Historical Evolution"} />
                  <CommunityRDComparisonChart 
                    language={language}
                    gdpData={mapToGDPConsolidadoData(europeData)}
                    autonomousCommunitiesData={autonomousCommunitiesData}
                    years={availableYears.map(year => year.toString())}
                  />
                </>
              )}
              
              {/* Nuevo componente SectorEvolutionChart para mostrar evolución por sectores */}
              {autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitle title={language === 'es' ? "Evolución sectorial" : "Sector Evolution"} />
                  <SectorEvolutionChart 
                    language={language}
                    autonomousCommunitiesData={autonomousCommunitiesData}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Investment; 