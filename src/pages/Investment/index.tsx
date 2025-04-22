import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import EuropeanRDMap from '../../components/EuropeanRDMap';
import CountryRankingChart from '../../components/CountryRankingChart';
import Papa from 'papaparse';
import { DATA_PATHS, rdSectors, EuropeCSVData as RdInvestmentEuropeCSVData } from '../../data/rdInvestment';

// Interfaz compatible con la de EuropeanRDMap
interface EuropeCSVData {
  Country: string;
  Year: string;
  Sector: string;
  Value: string;
  '%GDP'?: string;
  ISO3?: string;
  [key: string]: string | undefined;
}

const Investment: React.FC = () => {
  const { language, t } = useLanguage();
  const [europeData, setEuropeData] = useState<EuropeCSVData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2021); // Año inicial, se actualizará al más reciente
  const [highlightedCountry, setHighlightedCountry] = useState<string>("españa");
  const [selectedSector, setSelectedSector] = useState<string>("All Sectors"); // Usar el valor exacto del CSV
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
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
          throw new Error(`Error al cargar datos de Europa: ${europeResponse.status} - ${europeResponse.statusText}`);
        }
        
        console.log("Respuesta recibida:", europeResponse.status, europeResponse.statusText);
        
        const europeCSV = await europeResponse.text();
        console.log("Tamaño de datos CSV recibidos:", europeCSV.length, "caracteres");
        
        // Procesar los CSV con PapaParse - Usamos coma como delimitador
        const europeResult = Papa.parse<EuropeCSVData>(europeCSV, {
          header: true,
          delimiter: ',', // El archivo usa coma, no punto y coma
          skipEmptyLines: true
        });
        
        if (europeResult.errors && europeResult.errors.length > 0) {
          console.warn("Advertencias al procesar CSV:", europeResult.errors);
        }
        
        console.log("Muestra de datos procesados:", europeResult.data.slice(0, 3));
        
        // Procesamiento posterior: asegurar que Value tenga el valor de %GDP
        const processedData = europeResult.data.map(item => ({
          ...item,
          Value: item['%GDP'] || item.Value || '0' // Asegurar que Value siempre tiene un valor
        }));
        
        // Extraer los años disponibles
        const years = new Set<number>();
        processedData.forEach(row => {
          const year = parseInt(row['Year']);
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
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
        setIsLoading(false);
      }
    };
    
    loadCSVData();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Filtrar datos cuando cambia el año o sector
  useEffect(() => {
    if (europeData.length === 0) return;
    
    console.log(`Filtrando datos para año ${selectedYear} y sector "${selectedSector}"`);
    
    // Verificar si hay datos para el año y sector seleccionados
    const dataForSelection = europeData.filter(row => 
      parseInt(row['Year']) === selectedYear && 
      row['Sector'] === selectedSector
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

  // Función para manejar el clic en un país del mapa
  const handleCountryClick = (countryId: string) => {
    console.log("País seleccionado:", countryId);
    setHighlightedCountry(countryId);
  };
  
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{t('investment')}</h2>
      <p className="mb-6">
        {t('investmentDescription')}
      </p>
      
      {/* Selectores de año y sector en la misma fila */}
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="flex items-center">
          <label className="font-semibold text-gray-700 mr-2">
            {t('year')}:
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
            {t('sector')}:
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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa de Europa */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <EuropeanRDMap 
              data={europeData} 
              selectedYear={selectedYear} 
              language={language} 
              selectedSector={selectedSector}
              onClick={handleCountryClick}
            />
          </div>
          
          {/* Gráfico de ranking de países - Usar cast seguro pues la interfaz es compatible */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <CountryRankingChart 
              data={europeData as unknown as RdInvestmentEuropeCSVData[]}
              selectedYear={selectedYear} 
              language={language}
              highlightCountry={highlightedCountry}
              selectedSector={getSectorId(selectedSector)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Investment; 