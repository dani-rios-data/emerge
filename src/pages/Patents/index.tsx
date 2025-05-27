import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Papa from 'papaparse';
import {
  PATENTS_DATA_CONFIG,
  PatentsData,
  ProcessedPatentsData,
  processPatentsData,
  getAvailableYears,
  getAvailableCountries,
  getCountryRanking,
  patentsTexts
} from '../../data/patentsData';

interface PatentsProps {
  language?: 'es' | 'en';
}

const Patents: React.FC<PatentsProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Estado para los datos de patentes
  const [patentsData, setPatentsData] = useState<ProcessedPatentsData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableCountries, setAvailableCountries] = useState<Array<{code: string, name: string}>>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedCooperationType, setSelectedCooperationType] = useState<'applicant' | 'inventor'>('applicant');
  const [selectedUnit, setSelectedUnit] = useState<'number' | 'per_million_inhabitants'>('number');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Textos localizados
  const t = patentsTexts[language];

  // Cargar datos desde el archivo CSV
  useEffect(() => {
    const loadPatentsData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(PATENTS_DATA_CONFIG.EUROPE_PATENTS_CSV);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        // Convertir los datos parseados al formato que necesitamos
        const rawData = result.data as PatentsData[];
        const processedData = processPatentsData(rawData);
        
        setPatentsData(processedData);

        // Extraer años disponibles
        const years = getAvailableYears(processedData);
        setAvailableYears(years);
        
        // Establecer el año más reciente como predeterminado
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }

        // Extraer países disponibles (para futuras funcionalidades)
        const countries = getAvailableCountries(processedData);
        setAvailableCountries(countries);

        setError(null);
      } catch (err) {
        console.error('Error loading patents data:', err);
        setError(t.errorLoadingData);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatentsData();
  }, [language, t.errorLoadingData]);

  // Handlers para los filtros
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleCooperationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCooperationType(e.target.value as 'applicant' | 'inventor');
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value as 'number' | 'per_million_inhabitants');
  };

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Anuncio de limitación de datos */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="mr-3 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-amber-800">
            {language === 'es' 
              ? 'Con la información disponible no es posible una comparación directa entre Europa y Canarias como en las pestañas anteriores. Por este motivo, se realizará la comparación entre la UE y los países de Europa por un lado, y entre las comunidades autónomas de España por otro.'
              : 'With the available information, a direct comparison between Europe and the Canary Islands is not possible as in the previous tabs. For this reason, comparisons will be made between the EU and European countries on one hand, and between the autonomous communities of Spain on the other.'}
          </p>
        </div>
      </div>
      
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={language === 'es' ? "Métricas clave" : "Key Metrics"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Estadísticas de patentes" : "Patent Statistics"} />
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
        <SectionTitle title={language === 'es' ? "Comparación entre la UE y países" : "EU and Countries Comparison"} />
        
        {/* Subsección 2.1: Patentes por país */}
        <div className="mb-10">
          <SubsectionTitle title={language === 'es' ? "Distribución geográfica de patentes" : "Geographical Distribution of Patents"} />
          
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p>
              {language === 'es' 
                ? "Este indicador mide las solicitudes de protección de una invención presentadas ante la Oficina Europea de Patentes (EPO), independientemente de si son concedidas o no. Las solicitudes se asignan según el país de residencia del primer solicitante listado en el formulario de solicitud (principio del primer solicitante nombrado), así como según el país de residencia del inventor."
                : "This indicator measures requests for the protection of an invention filed with the European Patent Office (EPO) regardless of whether they are granted or not. Applications are allocated according to the country of residence of the first applicant listed on the application form (first-named applicant principle) as well as according to the country of residence of the inventor."
              }
            </p>
            <p className="mt-2 text-xs italic">
              {language === 'es' 
                ? "Fuente: Oficina Europea de Patentes (EPO) / Eurostat"
                : "Source: European Patent Office (EPO) / Eurostat"
              }
            </p>
          </div>
          
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
                  <label className="text-gray-700 font-medium mr-2">
                    {t.yearLabel}
                  </label>
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
                  <label className="text-gray-700 font-medium mr-2">
                    {t.typeLabel}
                  </label>
                  <select 
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px]"
                  >
                    <option value="number">
                      {t.totalPatents}
                    </option>
                    <option value="per_million_inhabitants">
                      {t.patentsPerCapita}
                    </option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="text-gray-700 font-medium mr-2">
                    {language === 'es' ? 'Datos:' : 'Data:'}
                  </label>
                  <select 
                    value={selectedCooperationType}
                    onChange={handleCooperationTypeChange}
                    className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px]"
                  >
                    <option value="applicant">
                      {t.applicantData}
                    </option>
                    <option value="inventor">
                      {t.inventorData}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
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
              {/* Contenedor flexible para el mapa y el gráfico */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Mapa de Europa */}
                <div className="w-full lg:w-1/2 min-h-[500px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {language === 'es' ? `Solicitudes de patentes por país · ${selectedYear}` : `Patent applications by country · ${selectedYear}`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedCooperationType === 'applicant' 
                      ? (language === 'es' ? 'Por país del solicitante' : 'By applicant country')
                      : (language === 'es' ? 'Por país del inventor' : 'By inventor country')
                    }
                  </p>
                  <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
                    <div className="text-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">{language === 'es' ? "Mapa de solicitudes europeas" : "European applications map"}</p>
                      <p className="text-sm mt-2">{language === 'es' ? "En desarrollo" : "In development"}</p>
                      <p className="text-xs mt-1 text-gray-500">
                        {language === 'es' ? `Datos cargados: ${patentsData.length} registros` : `Data loaded: ${patentsData.length} records`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Ranking de países */}
                <div className="w-full lg:w-1/2 min-h-[500px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {language === 'es' 
                      ? `Ranking de países por solicitudes: ${selectedCooperationType === 'applicant' ? 'Por país del solicitante' : 'Por país del inventor'} (${selectedYear})`
                      : `Country ranking by applications: ${selectedCooperationType === 'applicant' ? 'By applicant country' : 'By inventor country'} (${selectedYear})`
                    }
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedCooperationType === 'applicant' 
                      ? (language === 'es' ? 'Por país del solicitante' : 'By applicant country')
                      : (language === 'es' ? 'Por país del inventor' : 'By inventor country')
                    }
                  </p>
                  <div className="h-[400px] overflow-y-auto">
                    {(() => {
                      const rankingData = getCountryRanking(
                        patentsData, 
                        selectedYear, 
                        selectedCooperationType, 
                        selectedUnit, 
                        15
                      );
                      
                      if (rankingData.length === 0) {
                        return (
                          <div className="text-center text-gray-500 mt-8">
                            <p>{t.noDataAvailable}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {rankingData.map((item, index) => (
                            <div key={`${item.country}-${item.year}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center">
                                <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-800">{item.countryName}</p>
                                  <p className="text-xs text-gray-500">{item.country}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-800">
                                  {selectedUnit === 'number' 
                                    ? item.value.toLocaleString() 
                                    : item.value.toFixed(1)
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {selectedUnit === 'number' 
                                    ? (language === 'es' ? 'solicitudes' : 'applications')
                                    : (language === 'es' ? 'por millón hab.' : 'per million inhab.')
                                  }
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4 text-right text-sm text-gray-500">
                    {selectedUnit === 'number' 
                      ? (language === 'es' ? 'Solicitudes (ETC)' : 'Applications (FTE)')
                      : (language === 'es' ? 'Solicitudes por millón de habitantes' : 'Applications per million inhabitants')
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Subsección 2.2: Evolución temporal de patentes */}
        <div className="mb-10">
          <SubsectionTitle title={language === 'es' ? "Evolución temporal de patentes" : "Historical Patent Evolution"} />
          
          {/* Filtros para la evolución temporal */}
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
            <div className="flex items-center gap-4">
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
                <label className="text-gray-700 font-medium mr-2">
                  {t.typeLabel}
                </label>
                <select 
                  value={selectedUnit}
                  onChange={handleUnitChange}
                  className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px]"
                >
                  <option value="number">
                    {t.totalPatents}
                  </option>
                  <option value="per_million_inhabitants">
                    {t.patentsPerCapita}
                  </option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="text-gray-700 font-medium mr-2">
                  {language === 'es' ? 'Datos:' : 'Data:'}
                </label>
                <select 
                  value={selectedCooperationType}
                  onChange={handleCooperationTypeChange}
                  className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px]"
                >
                  <option value="applicant">
                    {t.applicantData}
                  </option>
                  <option value="inventor">
                    {t.inventorData}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Gráfico de evolución temporal */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="text-lg">{language === 'es' ? "Evolución histórica de patentes" : "Historical patent evolution"}</p>
                <p className="text-sm mt-2">{language === 'es' ? "En desarrollo" : "In development"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subsección 2.3: Análisis por sectores tecnológicos */}
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución por sectores tecnológicos" : "Distribution by Technology Sectors"} />
          
          {/* Descripción de sectores tecnológicos */}
          <div className="mb-4 text-sm text-gray-600 bg-amber-50 p-4 rounded-lg border border-amber-100">
            <p>
              {language === 'es' 
                ? "Clasificación de patentes según la Clasificación Internacional de Patentes (IPC) agrupadas en sectores tecnológicos principales: Tecnologías de la Información y Comunicación (TIC), Biotecnología, Nanotecnología, Energías Renovables, entre otros."
                : "Patent classification according to the International Patent Classification (IPC) grouped into main technology sectors: Information and Communication Technologies (ICT), Biotechnology, Nanotechnology, Renewable Energy, among others."
              }
            </p>
          </div>
          
          {/* Gráfico de sectores tecnológicos */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[350px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-lg">{language === 'es' ? "Distribución sectorial" : "Sectoral distribution"}</p>
                <p className="text-sm mt-2">{language === 'es' ? "En desarrollo" : "In development"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6">
        <SectionTitle title={language === 'es' ? "Comparación por comunidades autónomas de España" : "Spanish Autonomous Communities Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución regional de patentes" : "Regional Patents Distribution"} />
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