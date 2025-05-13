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
    investmentDescription: "Análisis comparativo de la inversión en I+D como porcentaje del PIB.",
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
    observationFlags: "Banderas de observación",
    estimated: "Estimado",
    provisional: "Provisional",
    definitionDiffers: "Definición difiere",
    breakInTimeSeries: "Ruptura en la serie temporal",
    breakInTimeSeriesDefinitionDiffers: "Ruptura en la serie y definición difiere",
    definitionDiffersEstimated: "Definición difiere y estimado",
    definitionDiffersProvisional: "Definición difiere y provisional",
    estimatedProvisional: "Estimado y provisional",
    breakInTimeSeriesProvisional: "Ruptura en la serie y provisional",
    lowReliability: "Baja fiabilidad",
    keyMetricsTitle: "Métricas clave",
    euComparisonTitle: "Comparación entre la UE y países",
    spanishRegionsTitle: "Comparación por comunidades autónomas de España",
    countryRanking: "Ranking de países",
    noData: "No hay datos disponibles para este año"
  },
  en: {
    investmentTitle: "R&D Investment",
    investmentDescription: "Comparative analysis of R&D investment as a percentage of GDP.",
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
    observationFlags: "Observation flags",
    estimated: "Estimated",
    provisional: "Provisional",
    definitionDiffers: "Definition differs",
    breakInTimeSeries: "Break in time series",
    breakInTimeSeriesDefinitionDiffers: "Break in time series and definition differs",
    definitionDiffersEstimated: "Definition differs and estimated",
    definitionDiffersProvisional: "Definition differs and provisional",
    estimatedProvisional: "Estimated and provisional",
    breakInTimeSeriesProvisional: "Break in time series and provisional",
    lowReliability: "Low reliability",
    keyMetricsTitle: "Key Metrics",
    euComparisonTitle: "EU and Countries Comparison",
    spanishRegionsTitle: "Spanish Autonomous Communities Comparison",
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
    <h2 className="text-xl font-bold mb-4 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );
  
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-3 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
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
          <div className="mb-10">
            <SectionTitle title={t.keyMetricsTitle} />
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center text-gray-500 italic mb-6">
              {/* Contenido de subsecciones de Key Metrics se añadirá posteriormente */}
              <p>Las subsecciones de métricas clave se añadirán próximamente</p>
            </div>
          </div>
          
          {/* Sección 2: Comparación entre la UE y países */}
          <div className="mb-10">
            <SectionTitle title={t.euComparisonTitle} />
            
            {/* Subsección 2.1: Mapa y ranking de inversión en I+D */}
            <div className="mb-8">
              <SubsectionTitle title={language === 'es' ? 
                `Inversión en I+D por país - ${getSectorName(selectedSector)} (${selectedYear})` : 
                `R&D Investment by Country - ${getSectorName(selectedSector)} (${selectedYear})`} 
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ObservationFlags />
                <SupranationalEntities />
              </div>
            </div>
            
            {/* Subsección 2.2: Distribución sectorial de la inversión en I+D */}
            <div className="mb-8">
              <SubsectionTitle title={language === 'es' ? "Distribución sectorial de la inversión en I+D" : "R&D Investment Distribution by Sectors"} />
              
              {/* Componente SectorDistribution */}
              <SectorDistribution language={language} />
              
              {/* Nuevo componente RDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <RDComparisonChart 
                  language={language}
                  gdpData={mapToGDPConsolidadoData(europeData)}
                  autonomousCommunitiesData={autonomousCommunitiesData}
                  years={availableYears.map(year => year.toString())}
                />
              )}
            </div>
          </div>
          
          {/* Sección 3: Comparación por comunidades autónomas de España */}
          <div className="mb-6">
            <SectionTitle title={t.spanishRegionsTitle} />
            
            {/* Subsección 3.1: Mapa y ranking de inversión en I+D por comunidades */}
            <div className="mb-8">
              <SubsectionTitle title={language === 'es' ? 
                `Inversión en I+D por Comunidad Autónoma - ${getSectorName(selectedRegionSector)} (${selectedRegionYear})` : 
                `R&D Investment by Autonomous Community - ${getSectorName(selectedRegionSector)} (${selectedRegionYear})`} 
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
            <div className="mb-8">
              <SubsectionTitle title={language === 'es' ? "Distribución sectorial de la inversión en I+D" : "R&D Investment Distribution by Sectors"} />
              
              {/* Componente CommunityDistribution */}
              <CommunityDistribution language={language} />
              
              {/* Nuevo componente CommunityRDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <CommunityRDComparisonChart 
                  language={language}
                  gdpData={mapToGDPConsolidadoData(europeData)}
                  autonomousCommunitiesData={autonomousCommunitiesData}
                  years={availableYears.map(year => year.toString())}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Investment; 