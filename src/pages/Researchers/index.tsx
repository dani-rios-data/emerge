import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import ResearchersEuropeanMap from '../../components/ResearchersEuropeanMap';
import ResearcherRankingChart from '../../components/ResearcherRankingChart';
import Papa from 'papaparse';

interface ResearchersProps {
  language?: 'es' | 'en';
}

// Interfaz para los datos de investigadores
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
}

const Researchers: React.FC<ResearchersProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Estado para los datos de investigadores
  const [researchersData, setResearchersData] = useState<ResearchersData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedSector, setSelectedSector] = useState<string>('total');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos desde el archivo CSV
  useEffect(() => {
    const loadResearchersData = async () => {
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
        const parsedData = result.data as ResearchersData[];
        setResearchersData(parsedData);

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
        console.error('Error loading researchers data:', err);
        setError(language === 'es' ? 
          'Error al cargar los datos de investigadores' : 
          'Error loading researchers data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadResearchersData();
  }, [language]);

  // Manejador de cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Manejador de cambio de sector
  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSector(e.target.value);
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

  // Textos según el idioma
  const texts = {
    es: {
      yearLabel: "Año:",
      sectorLabel: "Sector:",
      loadingData: "Cargando datos...",
      errorLoading: "Error al cargar los datos",
      totalSector: "Todos los sectores",
      businessSector: "Sector empresarial",
      governmentSector: "Administración Pública",
      educationSector: "Enseñanza Superior",
      nonprofitSector: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      yearLabel: "Year:",
      sectorLabel: "Sector:",
      loadingData: "Loading data...",
      errorLoading: "Error loading data",
      totalSector: "All sectors",
      businessSector: "Business enterprise sector",
      governmentSector: "Government sector",
      educationSector: "Higher education sector",
      nonprofitSector: "Private non-profit sector"
    }
  };

  const t = texts[language];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={language === 'es' ? "Métricas clave" : "Key Metrics"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Indicadores de investigación" : "Research Indicators"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-12">
        <SectionTitle title={language === 'es' ? "Comparación entre la UE y países" : "EU and Countries Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Investigadores por país" : "Researchers by Country"} />
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
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
              <div className="mb-4 flex flex-wrap gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.yearLabel}</label>
                  <select 
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.sectorLabel}</label>
                  <select 
                    value={selectedSector}
                    onChange={handleSectorChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="total">{t.totalSector}</option>
                    <option value="business">{t.businessSector}</option>
                    <option value="government">{t.governmentSector}</option>
                    <option value="education">{t.educationSector}</option>
                    <option value="nonprofit">{t.nonprofitSector}</option>
                  </select>
                </div>
              </div>
              
              {/* Contenedor flexible para el mapa y el gráfico */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Mapa de Europa */}
                <div className="w-full lg:w-1/2 min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <ResearchersEuropeanMap
                    data={researchersData}
                    selectedYear={selectedYear}
                    selectedSector={selectedSector}
                    language={language}
                  />
                </div>
                
                {/* Gráfico de ranking */}
                <div className="w-full lg:w-1/2 min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <ResearcherRankingChart
                    data={researchersData}
                    selectedYear={selectedYear}
                    language={language}
                    selectedSector={selectedSector}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6">
        <SectionTitle title={language === 'es' ? "Comparación por comunidades autónomas de España" : "Spanish Autonomous Communities Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución regional de investigadores" : "Regional Researchers Distribution"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Researchers;