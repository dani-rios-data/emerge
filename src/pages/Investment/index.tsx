import React, { useState, useEffect } from 'react';
import EuropeanRDMap from '../../components/EuropeanRDMap';
import CountryRankingChart from '../../components/CountryRankingChart';
import SectorDistribution from '../../components/SectorDistribution';
import RDComparisonChart from '../../components/RDComparisonChart';
import DataTypeSelector, { DataDisplayType } from '../../components/DataTypeSelector';
import Papa from 'papaparse';
import { DATA_PATHS, rdSectors } from '../../data/rdInvestment';

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
    euroArea19: "Zona Euro (19)",
    euroArea19Full: "(2015-2022)",
    euroArea20: "Zona Euro (20)",
    euroArea20Full: "(desde 2023)",
    europeanUnion: "Unión Europea (27)",
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
        
        console.log("Respuesta recibida:", europeResponse.status, europeResponse.statusText);
        
        const europeCSV = await europeResponse.text();
        console.log("Tamaño de datos CSV recibidos:", europeCSV.length, "caracteres");
        
        // Procesar los CSV con PapaParse - Usamos coma como delimitador
        const europeResult = Papa.parse<ExtendedEuropeCSVData>(europeCSV, {
          header: true,
          delimiter: ',', // El archivo usa coma, no punto y coma
          skipEmptyLines: true
        });
        
        if (europeResult.errors && europeResult.errors.length > 0) {
          console.warn("Advertencias al procesar CSV:", europeResult.errors);
        }
        
        console.log("Muestra de datos procesados:", europeResult.data.slice(0, 3));
        
        // Cargar datos de comunidades autónomas
        const communityResponse = await fetch('./data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        if (!communityResponse.ok) {
          console.warn(`Advertencia: No se pudieron cargar los datos de comunidades autónomas: ${communityResponse.status} - ${communityResponse.statusText}`);
        } else {
          const communityCSV = await communityResponse.text();
          
          // Procesar CSV de comunidades autónomas
          const communityResult = Papa.parse<AutonomousCommunityData>(communityCSV, {
            header: true,
            delimiter: ';', // El archivo usa punto y coma
            skipEmptyLines: true
          });
          
          if (communityResult.errors && communityResult.errors.length > 0) {
            console.warn("Advertencias al procesar CSV de comunidades autónomas:", communityResult.errors);
          }
          
          setAutonomousCommunitiesData(communityResult.data);
          console.log("Datos de comunidades autónomas cargados:", communityResult.data.length);
        }
        
        // Procesamiento posterior: asegurar que Value tenga el valor de %GDP
        const processedData = europeResult.data.map(item => ({
          ...item,
          Value: item['%GDP'] || item.Value || '0' // Asegurar que Value siempre tiene un valor
        }));
        
        // Extraer los años disponibles
        const years = new Set<number>();
        processedData.forEach(row => {
          const year = parseInt(row.Year);
          if (!isNaN(year)) {
            years.add(year);
          }
        });
        const sortedYears = Array.from(years).sort((a, b) => b - a); // Ordenados descendentemente
        
        // Establecer los años disponibles y actualizar el año seleccionado al más reciente
        setAvailableYears(sortedYears);
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]); // El primer año (el más reciente)
        }
        
        console.log("Años disponibles:", sortedYears);
        
        // Extraer los sectores disponibles para verificación
        const availableSectors = [...new Set(processedData.map(item => item.Sector))];
        console.log("Sectores disponibles en el CSV:", availableSectors);
        
        // Establecer el sector por defecto como "All Sectors" si está disponible
        if (availableSectors.includes("All Sectors")) {
          setSelectedSector("All Sectors");
        }
        
        setEuropeData(processedData); 
        setIsLoading(false);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err.message : `${t.errorPrefix} Error desconocido`);
        setIsLoading(false);
      }
    };
    
    loadCSVData();
  }, [t]); // Se ejecuta solo una vez al montar el componente

  // Filtrar datos cuando cambia el año o sector
  useEffect(() => {
    if (europeData.length === 0) return;
    
    console.log(`Filtrando datos para año ${selectedYear} y sector "${selectedSector}"`);
    
    // Verificar si hay datos para el año y sector seleccionados
    const dataForSelection = europeData.filter(row => 
      parseInt(row.Year) === selectedYear && 
      row.Sector === selectedSector
    );
    
    if (dataForSelection.length === 0) {
      console.warn(`No se encontraron datos para el año ${selectedYear} y sector "${selectedSector}"`);
    } else {
      console.log(`Se encontraron ${dataForSelection.length} registros para el año ${selectedYear} y sector "${selectedSector}"`);
      
      // Mostrar algunos ejemplos para depuración
      console.log("Ejemplos de países con datos:", dataForSelection.slice(0, 5).map(item => 
        `${item.Country} (${item.ISO3}): ${item['%GDP']}%`
      ));
    }
  }, [selectedYear, selectedSector, europeData]);

  // Función para manejar el cambio de sector
  const handleSectorChange = (sectorId: string) => {
    // Transformar el ID del sector al valor esperado en el CSV
    const sectorMapping: Record<string, string> = {
      'total': 'All Sectors',
      'business': 'Business enterprise sector',
      'government': 'Government sector',
      'education': 'Higher education sector',
      'nonprofit': 'Private non-profit sector'
    };
    
    const csvSectorValue = sectorMapping[sectorId] || 'All Sectors';
    console.log("Sector seleccionado:", sectorId, "-> Valor en CSV:", csvSectorValue);
    setSelectedSector(csvSectorValue);
  };

  // Función para obtener el ID de sector basado en el nombre en inglés
  const getSectorId = (sectorNameEn: string): string => {
    const sector = rdSectors.find(s => s.name.en === sectorNameEn);
    return sector?.id || 'total';
  };

  // Agregar nuevo handler para cambio de tipo de visualización
  const handleDataTypeChange = (newType: DataDisplayType) => {
    setDataDisplayType(newType);
  };

  // Función para mapear los datos al formato necesario para RDComparisonChart
  const mapToGDPConsolidadoData = (data: ExtendedEuropeCSVData[]): GDPConsolidadoData[] => {
    return data
      .filter(item => item.ISO3) // Filtrar solo los elementos que tienen ISO3
      .map(item => ({
        Country: item.Country,
        País: item.País || item.Country, // Asegurarse de que siempre hay un valor
        Year: item.Year,
        Sector: item.Sector,
        '%GDP': item['%GDP'],
        ISO3: item.ISO3!, // El signo ! indica que sabemos que existe por el filtro anterior
        Value: item.Value,
        Approx_RD_Investment_million_euro: item.Approx_RD_Investment_million_euro
      }));
  };

  // Componente para mostrar entidades supranacionales como la UE y Zona Euro
  const SupranationalEntities = () => {
    // Texto dinámico para países/countries
    const countriesText = language === 'es' ? 'países' : 'countries';
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-full">
        <div className="bg-blue-600 text-white text-xs font-semibold text-center py-2 rounded-t-md">
          {t.supranational}
        </div>
        <div className="border border-blue-200 rounded-b-md border-t-0 p-3">
          <div className="mb-3 flex">
            <h3 className="text-xs font-semibold text-gray-800 mr-1">
              {language === 'es' ? `Unión Europea (27 ${countriesText})` : `European Union (27 ${countriesText})`}
            </h3>
            <p className="text-xs text-gray-600">{t.euFull}</p>
          </div>
          <div className="mb-3 flex">
            <h3 className="text-xs font-semibold text-gray-800 mr-1">
              {language === 'es' ? `Zona Euro (20 ${countriesText})` : `Euro Area (20 ${countriesText})`}
            </h3>
            <p className="text-xs text-gray-600">{t.euroArea20Full}</p>
          </div>
          <div className="flex">
            <h3 className="text-xs font-semibold text-gray-800 mr-1">
              {language === 'es' ? `Zona Euro (19 ${countriesText})` : `Euro Area (19 ${countriesText})`}
            </h3>
            <p className="text-xs text-gray-600">{t.euroArea19Full}</p>
          </div>
        </div>
      </div>
    );
  };

  // Componente para mostrar la leyenda de banderas de observación
  const ObservationFlags = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-full">
      <div className="bg-blue-600 text-white text-xs font-semibold text-center py-2 rounded-t-md">
        {t.observationFlags}
      </div>
      <div className="border border-blue-200 rounded-b-md border-t-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(e)</div>
            <span>{t.estimated}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(p)</div>
            <span>{t.provisional}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(d)</div>
            <span>{t.definitionDiffers}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(bd)</div>
            <span>{t.breakInTimeSeriesDefinitionDiffers}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(b)</div>
            <span>{t.breakInTimeSeries}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(de)</div>
            <span>{t.definitionDiffersEstimated}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(dp)</div>
            <span>{t.definitionDiffersProvisional}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(ep)</div>
            <span>{t.estimatedProvisional}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(bp)</div>
            <span>{t.breakInTimeSeriesProvisional}</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 pl-4 mr-2 font-medium text-black">(u)</div>
            <span>{t.lowReliability}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-lg font-bold mb-4 text-teal-800 border-b border-teal-200 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección
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
            
            {/* Espacio para futuras subsecciones */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-gray-500 italic">
              <p>{language === 'es' ? "Más subsecciones se añadirán próximamente" : "More subsections coming soon"}</p>
            </div>
          </div>
          
          {/* Sección 3: Comparación por comunidades autónomas de España */}
          <div className="mb-6">
            <SectionTitle title={t.spanishRegionsTitle} />
            
            {/* Espacio para futuras subsecciones de comunidades autónomas */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-gray-500 italic">
              <p>{language === 'es' ? "Más subsecciones de comunidades autónomas se añadirán próximamente" : "More autonomous communities subsections coming soon"}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Investment; 