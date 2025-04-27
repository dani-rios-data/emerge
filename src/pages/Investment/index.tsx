import React, { useState, useEffect } from 'react';
import EuropeanRDMap from '../../components/EuropeanRDMap';
import CountryRankingChart from '../../components/CountryRankingChart';
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
  [key: string]: string | undefined;
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
    investmentDescription: "Datos sobre la inversión en I+D en las Islas Canarias, tanto pública como privada",
    year: "Año:",
    sector: "Sector:",
    loading: "Cargando datos...",
    errorPrefix: "Error al cargar datos:",
    noDataAvailable: "No hay datos disponibles para esta selección",
    supranational: "ENTIDADES SUPRANACIONALES",
    euroArea19: "Zona Euro (2015-2022)",
    euroArea20: "Zona Euro (desde 2023)",
    europeanUnion: "Unión Europea",
    euroArea19Full: "Zona Euro - 19 países (2015-2022)",
    euroArea20Full: "Zona Euro - 20 países (desde 2023)",
    euFull: "27 países (desde 2020)",
    observationFlags: "Observation flags",
    estimated: "Estimado",
    provisional: "Provisional",
    definitionDiffers: "Definición difiere",
    breakInTimeSeries: "Ruptura en series temporales",
    definitionDiffersEstimated: "Definición difiere, estimado",
    estimatedProvisional: "Estimado, provisional",
    definitionDiffersProvisional: "Definición difiere, provisional",
    breakInTimeSeriesDefinitionDiffers: "Ruptura en series temporales, definición difiere",
    breakInTimeSeriesProvisional: "Ruptura en series temporales, provisional",
    lowReliability: "Baja fiabilidad",
    // Nuevos textos para las secciones
    keyMetricsTitle: "Métricas clave",
    euComparisonTitle: "Comparación entre la UE y países",
    spanishRegionsTitle: "Comparación por comunidades autónomas de España"
  },
  en: {
    investmentTitle: "R&D Investment",
    investmentDescription: "Data on R&D investment in the Canary Islands, both public and private",
    year: "Year:",
    sector: "Sector:",
    loading: "Loading data...",
    errorPrefix: "Error loading data:",
    noDataAvailable: "No data available for this selection",
    supranational: "SUPRANATIONAL ENTITIES",
    euroArea19: "Euro area (2015-2022)",
    euroArea20: "Euro area (from 2023)",
    europeanUnion: "European Union",
    euroArea19Full: "Euro area - 19 countries (2015-2022)",
    euroArea20Full: "Euro area - 20 countries (from 2023)",
    euFull: "27 countries (from 2020)",
    observationFlags: "Observation flags",
    estimated: "Estimated",
    provisional: "Provisional",
    definitionDiffers: "Definition differs",
    breakInTimeSeries: "Break in time series",
    definitionDiffersEstimated: "Definition differs, estimated",
    estimatedProvisional: "Estimated, provisional",
    definitionDiffersProvisional: "Definition differs, provisional",
    breakInTimeSeriesDefinitionDiffers: "Break in time series, definition differs",
    breakInTimeSeriesProvisional: "Break in time series, provisional",
    lowReliability: "Low reliability",
    // Nuevos textos para las secciones
    keyMetricsTitle: "Key Metrics",
    euComparisonTitle: "EU and Countries Comparison",
    spanishRegionsTitle: "Spanish Autonomous Communities Comparison"
  }
};

interface InvestmentProps {
  language: 'es' | 'en';
}

const Investment: React.FC<InvestmentProps> = ({ language }) => {
  const [europeData, setEuropeData] = useState<ExtendedEuropeCSVData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2021); // Año inicial, se actualizará al más reciente
  const [selectedSector, setSelectedSector] = useState<string>("All Sectors"); // Usar el valor exacto del CSV
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [labelsData, setLabelsData] = useState<LabelData[]>([]);
  const [autonomousCommunitiesData, setAutonomousCommunitiesData] = useState<AutonomousCommunityData[]>([]);
  
  // Función auxiliar para acceder a los textos según el idioma actual
  const t = texts[language];

  // Efecto para cargar los datos desde los archivos CSV
  useEffect(() => {
    const loadCSVData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Intentando cargar datos desde:", DATA_PATHS.GDP_EUROPE);
        
        // Cargar datos de Europa
        const europeResponse = await fetch(DATA_PATHS.GDP_EUROPE);
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
        
        // Cargar datos de etiquetas (labels)
        const labelsResponse = await fetch('./data/GDP_data/labels_consolidado.csv');
        if (!labelsResponse.ok) {
          console.warn(`Advertencia: No se pudieron cargar las etiquetas: ${labelsResponse.status} - ${labelsResponse.statusText}`);
        } else {
          const labelsCSV = await labelsResponse.text();
          
          // Procesar CSV de etiquetas
          const labelsResult = Papa.parse<LabelData>(labelsCSV, {
            header: true,
            delimiter: ';', // El archivo usa punto y coma
            skipEmptyLines: true
          });
          
          if (labelsResult.errors && labelsResult.errors.length > 0) {
            console.warn("Advertencias al procesar CSV de etiquetas:", labelsResult.errors);
          }
          
          setLabelsData(labelsResult.data);
          console.log("Etiquetas cargadas:", labelsResult.data.length);
        }
        
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

  // Componente para mostrar entidades supranacionales como la UE y Zona Euro
  const SupranationalEntities = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 h-full">
      <div className="bg-blue-600 text-white text-xs font-semibold text-center py-2 rounded-t-md">
        Entidades supranacionales
      </div>
      <div className="border border-blue-200 rounded-b-md border-t-0 p-3">
        <div className="mb-3 flex">
          <h3 className="text-xs font-semibold text-gray-800 mr-1">{t.europeanUnion}</h3>
          <p className="text-xs text-gray-600">{t.euFull}</p>
        </div>
        <div className="mb-3 flex">
          <h3 className="text-xs font-semibold text-gray-800 mr-1">{t.euroArea20}</h3>
          <p className="text-xs text-gray-600">{t.euroArea20Full}</p>
        </div>
        <div className="flex">
          <h3 className="text-xs font-semibold text-gray-800 mr-1">{t.euroArea19}</h3>
          <p className="text-xs text-gray-600">{t.euroArea19Full}</p>
        </div>
      </div>
    </div>
  );

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
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center text-gray-500 italic">
              {/* Contenido de Key Metrics se añadirá posteriormente */}
            </div>
          </div>
          
          {/* Sección 2: Comparación entre la UE y países */}
          <div className="mb-10">
            <SectionTitle title={t.euComparisonTitle} />
            
            {/* Selectores de año y sector */}
            <div className="flex flex-wrap items-center mb-6 gap-4">
              <div className="flex items-center">
                <label className="font-semibold text-gray-700 mr-2">
                  {t.year}
                </label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="font-semibold text-gray-700 mr-2">
                  {t.sector}
                </label>
                <select 
                  value={getSectorId(selectedSector)}
                  onChange={(e) => handleSectorChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {rdSectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Primera fila: Mapa y Gráfica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Mapa de Europa */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "500px" }}>
                <EuropeanRDMap 
                  // @ts-expect-error - Los datos son compatibles en tiempo de ejecución aunque sus tipos no coincidan exactamente
                  data={europeData} 
                  selectedYear={selectedYear} 
                  language={language} 
                  selectedSector={selectedSector}
                  labels={labelsData}
                  autonomousCommunitiesData={autonomousCommunitiesData}
                />
              </div>
              
              {/* Gráfico de ranking de países */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100" style={{ height: "500px" }}>
                <CountryRankingChart 
                  // @ts-expect-error - Los datos son compatibles en tiempo de ejecución aunque sus tipos no coincidan exactamente
                  data={europeData} 
                  selectedYear={selectedYear} 
                  language={language}
                  selectedSector={getSectorId(selectedSector)}
                  labels={labelsData}
                  autonomousCommunitiesData={autonomousCommunitiesData}
                />
              </div>
            </div>

            {/* Segunda fila: Observation Flags y SUPRANATIONAL ENTITIES lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ObservationFlags />
              <SupranationalEntities />
            </div>
          </div>
          
          {/* Sección 3: Comparación por comunidades autónomas de España */}
          <div className="mb-6">
            <SectionTitle title={t.spanishRegionsTitle} />
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center text-gray-500 italic">
              {/* Contenido de comparación por comunidades autónomas se añadirá posteriormente */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Investment; 