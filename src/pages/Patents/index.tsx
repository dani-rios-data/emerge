import React, { useState, useEffect } from 'react';
import PatentsEuropeanMap from '../../components/PatentsEuropeanMap';
import PatentsRankingChart from '../../components/PatentsRankingChart';
import PatentsTimelineChart from '../../components/PatentsTimelineChart';
import PatentsBySectorChart from '../../components/PatentsBySectorChart';
import Papa from 'papaparse';

// Definir la interfaz para los datos de patentes
interface PatentsData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de patentes
  OBS_FLAG?: string;   // Flag de observación
  [key: string]: string | undefined;
}

interface PatentsProps {
  language?: 'es' | 'en';
}

const Patents: React.FC<PatentsProps> = (props) => {
  const language = props.language || 'es';
  
  // Estados para los datos y filtros
  const [patentsData, setPatentsData] = useState<PatentsData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2022);
  
  // Estados separados para cada sección
  const [mapSector, setMapSector] = useState<string>('TOTAL');
  const [timelineSector, setTimelineSector] = useState<string>('TOTAL');
  const [sectorChartCountry, setSectorChartCountry] = useState<{name: string, localName: string, code: string} | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Patentes",
      subtitle: "Análisis de patentes por país y sector",
      year: "Año:",
      sector: "Sector:",
      loading: "Cargando datos...",
      error: "Error al cargar los datos",
      keyMetricsTitle: "Métricas clave",
      euComparisonTitle: "Comparación entre la UE y países",
      spanishRegionsTitle: "Comparación por comunidades autónomas de España",
      geographicalDistribution: "Distribución geográfica de patentes",
      timelineTitle: "Evolución temporal de patentes",
      regionalDistribution: "Distribución regional de patentes",
      // Sectores
      allSectors: "Todos los sectores",
      businessSector: "Sector empresarial",
      governmentSector: "Administración Pública",
      educationSector: "Enseñanza Superior",
      nonprofitSector: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Patents",
      subtitle: "Analysis of patents by country and sector",
      year: "Year:",
      sector: "Sector:",
      loading: "Loading data...",
      error: "Error loading data",
      keyMetricsTitle: "Key Metrics",
      euComparisonTitle: "EU and Countries Comparison",
      spanishRegionsTitle: "Spanish Autonomous Communities Comparison",
      geographicalDistribution: "Geographical Distribution of Patents",
      timelineTitle: "Patents Timeline Evolution",
      regionalDistribution: "Regional Distribution of Patents",
      // Sectores
      allSectors: "All sectors",
      businessSector: "Business enterprise sector",
      governmentSector: "Government sector",
      educationSector: "Higher education sector",
      nonprofitSector: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Cargar datos de patentes
  useEffect(() => {
    const loadPatentsData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('./data/researchers/europa_researchers.csv');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        // Convertir los datos parseados al formato que necesitamos
        const parsedData = result.data as PatentsData[];
        setPatentsData(parsedData);

        // Extraer años disponibles y ordenar de más reciente a más antiguo
        const years = Array.from(new Set(parsedData.map(item => 
          parseInt(item.TIME_PERIOD)
        )))
        .filter(year => !isNaN(year))
        .sort((a, b) => b - a);

        setAvailableYears(years);
        
        // Establecer el año más reciente como predeterminado
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading patents data:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatentsData();
  }, [t.error]);

  // Handlers para cambios en los filtros
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleMapSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMapSector(e.target.value);
  };

  const handleTimelineSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimelineSector(e.target.value);
  };

  const handleSectorChartCountryChange = (country: {name: string, localName: string, code: string}) => {
    setSectorChartCountry(country);
  };

  // Función para obtener el nombre localizado del sector
  const getSectorName = (sectorCode: string): string => {
    switch (sectorCode) {
      case 'TOTAL':
        return t.allSectors;
      case 'BES':
        return t.businessSector;
      case 'GOV':
        return t.governmentSector;
      case 'HES':
        return t.educationSector;
      case 'PNP':
        return t.nonprofitSector;
      default:
        return sectorCode;
    }
  };

  // Componente para títulos de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  // Componente para títulos de subsección
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  // Componente para título de subsección con país destacado (para Distribución por sectores)
  const SubsectionTitleWithCountry = ({ 
    baseTitle, 
    country, 
    language 
  }: { 
    baseTitle: string; 
    country: {name: string, localName: string, code: string} | null; 
    language: 'es' | 'en';
  }) => {
    if (!country) {
      return <SubsectionTitle title={baseTitle} />;
    }
    
    return (
      <div className="flex items-center mb-4 mt-8">
        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h3 className="text-md font-semibold text-blue-700 flex items-center">
          <span>{baseTitle}</span>
          <span className="mx-3 text-blue-400">•</span>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <span className="text-sm font-medium text-blue-800">
              {language === 'es' ? country.localName : country.name}
            </span>
          </div>
        </h3>
      </div>
    );
  };

  // Sectores disponibles con códigos
  const availableSectors = ['TOTAL', 'BES', 'GOV', 'HES', 'PNP'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={t.keyMetricsTitle} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Estadísticas de patentes" : "Patents Statistics"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-12">
        <SectionTitle title={t.euComparisonTitle} />
        
        {/* Subsección 2.1: Patentes por país */}
        <div className="mb-10">
          <SubsectionTitle title={t.geographicalDistribution} />
          
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p>
              {language === 'es' 
                ? "Número de patentes por sector de ejecución (empresas, gobierno, educación superior, instituciones privadas sin fines de lucro). Las patentes representan un indicador clave de la actividad innovadora y la capacidad de protección de la propiedad intelectual en cada territorio."
                : "Number of patents by sector of performance (business, government, higher education, private non profit). Patents represent a key indicator of innovative activity and intellectual property protection capacity in each territory."
              }
            </p>
            <p className="mt-2 text-xs italic">
              {language === 'es' 
                ? "Fuente: Eurostat"
                : "Source: Eurostat"
              }
            </p>
          </div>

          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full">
              {/* Filtros */}
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
                        onChange={handleYearChange}
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
                        value={mapSector}
                        onChange={handleMapSectorChange}
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[240px]"
                      >
                        {availableSectors.map(sectorCode => (
                          <option key={sectorCode} value={sectorCode}>
                            {getSectorName(sectorCode)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Primera fila: Mapa y Gráfica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Mapa de Europa */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "660px" }}>
                  <PatentsEuropeanMap
                    data={patentsData}
                    selectedYear={selectedYear}
                    selectedSector={mapSector}
                    language={language}
                  />
                </div>
                
                {/* Ranking de países */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "660px" }}>
                  {patentsData.length > 0 ? (
                    <div className="h-full overflow-hidden">
                      <PatentsRankingChart
                        data={patentsData}
                        selectedYear={selectedYear}
                        selectedSector={mapSector}
                        language={language}
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
                        <p className="text-gray-500">{language === 'es' ? 'Sin datos' : 'No data'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Subsección 2.2: Evolución temporal */}
        <div className="mb-10">
          <SubsectionTitle title={t.timelineTitle} />
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full">
              {/* Filtros para la timeline */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
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
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <label className="text-gray-700 font-medium mr-2">{t.sector}</label>
                  <select 
                    value={timelineSector}
                    onChange={handleTimelineSectorChange}
                    className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[240px]"
                  >
                    {availableSectors.map(sectorCode => (
                      <option key={sectorCode} value={sectorCode}>
                        {getSectorName(sectorCode)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Gráfico de evolución temporal */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <PatentsTimelineChart
                  data={patentsData}
                  language={language}
                  selectedSector={timelineSector}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Subsección 2.3: Análisis por sectores */}
        <div className="mb-8">
          <SubsectionTitleWithCountry
            baseTitle={language === 'es' ? "Distribución por sectores de investigación" : "Distribution by Research Sectors"}
            country={sectorChartCountry}
            language={language}
          />
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            /* Gráfico de distribución por sectores */
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <PatentsBySectorChart
                data={patentsData}
                language={language}
                countryCode="ES"
                onCountryChange={handleSectorChartCountryChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6">
        <SectionTitle title={t.spanishRegionsTitle} />
        
        {/* Subsección 3.1: Distribución regional */}
        <div className="mb-8">
          <SubsectionTitle title={t.regionalDistribution} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patents;