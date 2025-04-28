import React, { useState, useEffect } from 'react';
import DonutChartExample from './DonutChartExample';
import Papa from 'papaparse';
import { rdSectors } from '../data/rdInvestment';

// Interfaz para los datos de ejemplo
interface SectorData {
  sector: string;
  value: number;
}

interface DonutChartImplementationProps {
  language: 'es' | 'en';
}

// Interfaz para los datos del CSV gdp_consolidado
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
}

// Interfaz para los datos del CSV gasto_ID_comunidades_porcentaje_pib
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

const DonutChartImplementation: React.FC<DonutChartImplementationProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [spainData, setSpainData] = useState<SectorData[]>([]);
  const [euData, setEuData] = useState<SectorData[]>([]);
  const [canaryData, setCanaryData] = useState<SectorData[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Textos localizados
  const texts = {
    es: {
      yearSelector: "Año",
      spainTitle: "España",
      euTitle: "Unión Europea",
      canaryTitle: "Islas Canarias",
      dataSource: "Fuente: Eurostat, INE",
      loading: "Cargando datos..."
    },
    en: {
      yearSelector: "Year",
      spainTitle: "Spain",
      euTitle: "European Union",
      canaryTitle: "Canary Islands",
      dataSource: "Source: Eurostat, INE",
      loading: "Loading data..."
    }
  };

  const t = texts[language];

  // Función para cargar datos desde los archivos CSV
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Cargar datos de Europa y España desde gdp_consolidado.csv
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
        const availableYears = [...new Set(gdpData.map(row => parseInt(row.Year)))].sort((a, b) => b - a);
        setYears(availableYears);
        
        // Si el año seleccionado no está disponible, seleccionar el más reciente
        if (!availableYears.includes(selectedYear)) {
          setSelectedYear(availableYears[0]);
        }
        
        // Procesar los datos para el año seleccionado
        processDataForYear(selectedYear, gdpData, ccaaData);
      } catch (error) {
        console.error("Error loading data:", error);
        setSpainData([]);
        setEuData([]);
        setCanaryData([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [language]); // Recargar solo cuando cambia el idioma

  // Cuando cambia el año, procesar nuevamente los datos
  useEffect(() => {
    async function refreshData() {
      setLoading(true);
      try {
        // Cargar datos de Europa y España desde gdp_consolidado.csv
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
        
        // Procesar los datos para el año seleccionado
        processDataForYear(selectedYear, gdpData, ccaaData);
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    refreshData();
  }, [selectedYear]);

  // Procesar los datos según el año seleccionado
  const processDataForYear = (year: number, gdpData: GDPConsolidadoData[], ccaaData: GastoIDComunidadesData[]) => {
    // Datos para la UE (filtrar y agrupar por sector)
    const euYearData = gdpData.filter(row => 
      parseInt(row.Year) === year && 
      row.Country === "European Union - 27 countries (from 2020)" && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para España (filtrar y agrupar por sector)
    const spainYearData = gdpData.filter(row => 
      parseInt(row.Year) === year && 
      row.Country === "Spain" && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para Canarias (filtrar y agrupar por sector)
    const canaryYearData = ccaaData.filter(row => 
      parseInt(row.Año) === year && 
      row['Comunidad Limpio'] === "Canarias" && 
      row.Sector !== "All Sectors" &&
      row['Sector Id'] !== "(_T)" // Excluir el total
    );
    
    // Procesar datos para la UE
    const euProcessed: SectorData[] = euYearData.map(row => ({
      sector: language === 'es' ? getSectorNameInSpanish(row.Sector) : row.Sector,
      value: parseFloat(row['%GDP']) * 100 // Convertir a porcentaje
    }));
    
    // Procesar datos para España
    const spainProcessed: SectorData[] = spainYearData.map(row => ({
      sector: language === 'es' ? getSectorNameInSpanish(row.Sector) : row.Sector,
      value: parseFloat(row['%GDP']) * 100 // Convertir a porcentaje
    }));
    
    // Procesar datos para Canarias
    const canaryProcessed: SectorData[] = canaryYearData.map(row => ({
      sector: language === 'es' ? getSectorFromId(row['Sector Id']).es : getSectorFromId(row['Sector Id']).en,
      value: parseFloat(row['% PIB I+D']) * 100 // Convertir a porcentaje
    }));
    
    // Actualizar el estado con los datos procesados
    setEuData(euProcessed);
    setSpainData(spainProcessed);
    setCanaryData(canaryProcessed);
  };
  
  // Función para obtener nombres de sector desde el id utilizando rdSectors
  const getSectorFromId = (sectorId: string): { es: string, en: string } => {
    // Eliminar paréntesis si existen
    const cleanId = sectorId.replace(/[()]/g, '');
    
    // Buscar el sector correspondiente
    const sector = rdSectors.find(s => s.code === cleanId);
    
    if (sector) {
      return sector.name;
    }
    
    // Valores por defecto si no se encuentra
    return {
      es: "Sector desconocido",
      en: "Unknown sector"
    };
  };
  
  // Función auxiliar para obtener el nombre del sector en español usando rdSectors
  const getSectorNameInSpanish = (englishName: string): string => {
    const sector = rdSectors.find(s => s.name.en === englishName);
    if (sector) {
      return sector.name.es;
    }
    
    // Mapeo manual en caso de que no coincida exactamente
    switch (englishName) {
      case "All Sectors":
        return rdSectors.find(s => s.id === 'total')?.name.es || "Todos los sectores";
      case "Business enterprise sector":
        return rdSectors.find(s => s.id === 'business')?.name.es || "Sector empresarial";
      case "Government sector":
        return rdSectors.find(s => s.id === 'government')?.name.es || "Administración Pública";
      case "Higher education sector":
        return rdSectors.find(s => s.id === 'education')?.name.es || "Enseñanza Superior";
      case "Private non-profit sector":
        return rdSectors.find(s => s.id === 'nonprofit')?.name.es || "Instituciones Privadas sin Fines de Lucro";
      default:
        return englishName;
    }
  };

  // Función para manejar el cambio de año
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Selector de año - estilo similar a los filtros de Distribución del I+D por País o territorio */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <label className="text-gray-700 font-medium mr-2">{t.yearSelector}</label>
          <select 
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="p-10 text-center text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
          <p>{t.loading}</p>
        </div>
      ) : (
        <>
          {/* Gráficos donut - Reordenados como: UE, España, Canarias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
            {/* Unión Europea */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <DonutChartExample 
                data={euData}
                selectedYear={selectedYear}
                language={language}
                title={t.euTitle}
              />
            </div>
            
            {/* España */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <DonutChartExample 
                data={spainData} 
                selectedYear={selectedYear} 
                language={language}
                title={t.spainTitle}
              />
            </div>
            
            {/* Islas Canarias */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <DonutChartExample 
                data={canaryData}
                selectedYear={selectedYear}
                language={language}
                title={t.canaryTitle}
              />
            </div>
          </div>
        </>
      )}
      
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <p className="text-xs text-gray-500 italic text-right">{t.dataSource}</p>
      </div>
    </div>
  );
};

export default DonutChartImplementation; 