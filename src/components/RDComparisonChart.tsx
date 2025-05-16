import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import country_flags from '../logos/country_flags.json';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Interfaz para los datos de PIB y gasto en I+D
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
  Value?: string; // Valor monetario opcional
  Approx_RD_Investment_million_euro?: string; // Inversión aproximada en millones de euros
}

// Interfaz para los datos de comunidades autónomas
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

// Interfaz para los datos del selector de países
interface CountryOption {
  name: string;
  localName: string;
  iso3: string;
}

// Interfaz para las propiedades del componente
interface RDComparisonChartProps {
  language: 'es' | 'en';
  gdpData: GDPConsolidadoData[];
  autonomousCommunitiesData: GastoIDComunidadesData[];
  years: string[];
}

// Interfaz para un punto de datos en la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  eu: number | null;
  canary: number | null;
  country: number | null;
  [key: string]: string | number | null; // Para poder agregar dinámicamente el país seleccionado
}

// Interfaz para representar un sector
interface SectorOption {
  id: string;
  name: {
    es: string;
    en: string;
  };
}

// Componente principal de la gráfica de comparación
const RDComparisonChart: React.FC<RDComparisonChartProps> = ({ 
  language, 
  gdpData,
  autonomousCommunitiesData,
  years 
}) => {
  // Estado para el sector seleccionado (por defecto "total" - todos los sectores)
  const [selectedSector, setSelectedSector] = useState<string>("total");
  
  // Estado para el país seleccionado (por defecto España)
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    iso3: 'ESP'
  });
  
  // Estado para la lista de países disponibles
  const [availableCountries, setAvailableCountries] = useState<CountryOption[]>([]);
  
  // Estado para los datos de la serie temporal
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Textos localizados
  const texts = {
    es: {
      title: "Comparativa de Inversión en I+D",
      canary: "Islas Canarias",
      euAverage: "Unión Europea",
      selectSector: "Sector",
      selectCountry: "Seleccionar país",
      allSectors: "Todos los sectores",
      percentGDP: "% del PIB",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      // Sectores
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "R&D Investment Comparison",
      canary: "Canary Islands",
      euAverage: "European Union",
      selectSector: "Sector",
      selectCountry: "Select country",
      allSectors: "All sectors",
      percentGDP: "% of GDP",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      // Sectors
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };
  
  const t = texts[language];
  
  // Colores para las líneas
  const lineColors = {
    eu: "#4338ca", // Índigo para UE
    canary: "#3b82f6", // Azul para Canarias
    country: "#dc2626", // Rojo para el país seleccionado
  };
  
  // Efecto para cargar los países disponibles
  useEffect(() => {
    if (!gdpData || gdpData.length === 0) return;
    
    // Filtrar los países únicos (excluyendo UE y Zona Euro)
    const countries = gdpData
      .filter(row => 
        row.Sector === "All Sectors" && 
        !row.Country.includes("European Union") && 
        !row.Country.includes("Euro area") &&
        row.ISO3 // Solo países con ISO3 válido
      )
      .reduce((acc: CountryOption[], row) => {
        // Evitar duplicados
        if (!acc.some(c => c.iso3 === row.ISO3)) {
          acc.push({
            name: row.Country,
            localName: row.País || row.Country,
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
    
    setAvailableCountries(countries);
  }, [gdpData, language]);
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!gdpData || !autonomousCommunitiesData || years.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Función para normalizar texto (para comparaciones)
    const normalizeText = (text: string | undefined): string => {
      if (!text) return '';
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    };
    
    // Mapeo del sector seleccionado al nombre en el CSV
    const getSectorName = (sectorId: string): string => {
      switch(sectorId) {
        case 'total': return 'All Sectors';
        case 'business': return 'Business enterprise sector';
        case 'government': return 'Government sector';
        case 'education': return 'Higher education sector';
        case 'nonprofit': return 'Private non-profit sector';
        default: return 'All Sectors';
      }
    };
    
    // Obtener el nombre del sector para la búsqueda
    const sectorName = getSectorName(selectedSector);
    
    // Crear puntos de datos para cada año
    const seriesData: TimeSeriesDataPoint[] = years.map(year => {
      // Punto de datos inicial
      const dataPoint: TimeSeriesDataPoint = {
        year,
        eu: null,
        canary: null,
        country: null
      };
      
      // 1. Buscar datos de la UE
      const euData = gdpData.find(row => 
        row.Year === year && 
        row.Country === "European Union - 27 countries (from 2020)" && 
        row.Sector === sectorName
      );
      
      if (euData) {
        dataPoint.eu = parseFloat(euData['%GDP'].replace(',', '.'));
      }
      
      // 2. Buscar datos de Canarias
      // Convertir sectorId a formato de Canarias
      let canarySectorId = "";
      if (selectedSector === 'total') {
        canarySectorId = "(_T)";
      } else if (selectedSector === 'business') {
        canarySectorId = "(BES)";
      } else if (selectedSector === 'government') {
        canarySectorId = "(GOV)";
      } else if (selectedSector === 'education') {
        canarySectorId = "(HES)";
      } else if (selectedSector === 'nonprofit') {
        canarySectorId = "(PNP)";
      }
      
      const canaryData = autonomousCommunitiesData.find(row => 
        row["Año"] === year && 
        normalizeText(row["Comunidad Limpio"]) === "canarias" && 
        row["Sector Id"] === canarySectorId
      );
      
      if (canaryData) {
        dataPoint.canary = parseFloat(canaryData["% PIB I+D"].replace(',', '.'));
      }
      
      // 3. Buscar datos del país seleccionado
      const countryData = gdpData.find(row => 
        row.Year === year && 
        row.ISO3 === selectedCountry.iso3 && 
        row.Sector === sectorName
      );
      
      if (countryData) {
        dataPoint.country = parseFloat(countryData['%GDP'].replace(',', '.'));
      }
      
      return dataPoint;
    });
    
    // Ordenar por año ascendente para la gráfica
    seriesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    setTimeSeriesData(seriesData);
    setLoading(false);
  }, [gdpData, autonomousCommunitiesData, selectedCountry, selectedSector, years, language]);
  
  // Efecto para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    // Agregar el event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Limpiar el event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Función para generar las opciones del selector de sectores
  const getSectorOptions = (): SectorOption[] => {
    return [
      { id: 'total', name: { es: 'Todos los sectores', en: 'All sectors' } },
      { id: 'business', name: { es: 'Sector empresarial', en: 'Business enterprise' } },
      { id: 'government', name: { es: 'Administración Pública', en: 'Government' } },
      { id: 'education', name: { es: 'Enseñanza Superior', en: 'Higher education' } },
      { id: 'nonprofit', name: { es: 'Instituciones Privadas sin Fines de Lucro', en: 'Private non-profit' } }
    ];
  };
  
  // Función para obtener el nombre localizado del sector seleccionado
  const getSelectedSectorName = (): string => {
    const sectorOption = getSectorOptions().find(option => option.id === selectedSector);
    return sectorOption ? sectorOption.name[language] : t.allSectors;
  };
  
  // Formateador para el eje Y para agregar símbolo de porcentaje
  const formatYAxis = (value: number) => {
    return `${value}%`;
  };
  
  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex <= 0) return null;
    
    const previousYearData = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousYearData?.[dataKey] as number | null;
    
    if (previousValue === null || previousValue === 0) return null;
    
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    return percentChange.toFixed(2);
  };
  
  // Componente de tooltip personalizado para la gráfica
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      name: string;
      color: string;
      dataKey: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      // Encontrar el índice del año actual en los datos
      const yearIndex = timeSeriesData.findIndex(data => data.year === label);
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
          <p className="font-medium text-gray-700">{`${t.year}: ${label}`}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => {
              if (entry.value === null) return null;
              
              // Calcular el cambio YoY
              const yoyChange = calculateYoY(entry.value, entry.dataKey, yearIndex);
              const yoyText = yoyChange !== null ? 
                `(${yoyChange.startsWith('-') ? '' : '+'}${yoyChange}%)` : '';
              
              return (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">
                    <span className="font-medium">{entry.name}: </span>
                    <span>{entry.value} {t.percentGDP}</span>
                    {yoyChange !== null && (
                      <span className={`ml-1.5 text-xs ${parseFloat(yoyChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {yoyText}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Parámetros reutilizables
  const FLAG_SIZE = 22;   // La bandera grande
  const GAP = 4;         // +4 px → empuja la bandera a la IZQUIERDA
  
  // Componente mejorado para renderizar banderas (UE, Canarias, y países)
  const FlagImage = ({ 
    type, 
    iso3, 
    strokeColor,
    size = FLAG_SIZE
  }: { 
    type: 'eu' | 'canary' | 'country'; 
    iso3?: string; 
    strokeColor: string;
    size?: number;
  }) => {
    let flagUrl = '';
    
    // Buscar la bandera adecuada según el tipo
    if (type === 'eu') {
      const euFlag = country_flags.find(flag => flag.iso3 === 'EUU');
      flagUrl = euFlag?.flag || '';
    } else if (type === 'canary') {
      const canaryFlag = autonomous_communities_flags.find(flag => flag.code === 'CAN');
      flagUrl = canaryFlag?.flag || '';
    } else if (type === 'country' && iso3) {
      const countryFlag = country_flags.find(flag => flag.iso3 === iso3);
      flagUrl = countryFlag?.flag || '';
    }
    
    if (!flagUrl) return null;
    
    return (
      <img 
        src={flagUrl} 
        alt=""
        width={size} 
        height={Math.round(size * 0.67)} 
        style={{ 
          objectFit: 'cover',
          border: `1px solid ${strokeColor}`,
          borderRadius: 4,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.02)'
        }}
      />
    );
  };
  
  // Componente para renderizar las banderas al final de las líneas
  const renderFlags = () => {
    if (!timeSeriesData.length) return null;
    
    // Obtener el último punto de datos
    const lastDataPoint = timeSeriesData[timeSeriesData.length - 1];
    
    // Calcular dinámicamente el rango visible del eje Y
    const yValues = timeSeriesData.flatMap(d =>
      [d.eu, d.canary, d.country].filter(v => v !== null)
    ) as number[];
    
    const yMin = 0;
    const yMax = Math.max(...yValues) * 1.05; // +5% para margen visual
    
    // Cálculo del porcentaje vertical
    const yToPct = (v: number) => {
      return ((yMax - v) / (yMax - yMin)) * 100;
    };
    
    // Componente que coloca la bandera
    const FlagStub = ({
      yValue,
      children
    }: {
      yValue: number | null;
      children: React.ReactNode;
    }) => {
      if (yValue === null) return null;
      
      return (
        <div
          style={{
            position: 'absolute',
            top: `calc(${yToPct(yValue)}% - ${FLAG_SIZE / 2}px)`,
            right: GAP,          // +4 px → más a la izquierda
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      );
    };
    
    return (
      <>
        <FlagStub yValue={lastDataPoint.eu}>
          <FlagImage type="eu" strokeColor={lineColors.eu} />
        </FlagStub>

        <FlagStub yValue={lastDataPoint.country}>
          <FlagImage
            type="country"
            iso3={selectedCountry.iso3}
            strokeColor={lineColors.country}
          />
        </FlagStub>

        <FlagStub yValue={lastDataPoint.canary}>
          <FlagImage type="canary" strokeColor={lineColors.canary} />
        </FlagStub>
      </>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Filtros - Solo mantener el selector de sector */}
      <div className="mb-6 px-4">
        <div className="flex justify-between items-center">
          {/* Selector de sector - Ahora más angosto */}
          <div className="flex items-center bg-blue-50 rounded-md border border-blue-100 shadow-sm p-1 pr-3">
            <div className="flex items-center pl-2 pr-1">
              <TrendingUp size={18} className="text-blue-600 mr-2 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700 mr-2 whitespace-nowrap">
                {t.selectSector}:
              </span>
            </div>
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm rounded-md"
            >
              {getSectorOptions().map(option => (
                <option key={option.id} value={option.id}>
                  {option.name[language]}
                </option>
              ))}
            </select>
          </div>
          
          {/* Selector de país - Ahora fuera de la gráfica */}
          <div className="flex-shrink-0 relative" ref={dropdownRef}>
            <div 
              className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="flex items-center gap-1 px-2 py-1">
                <FlagImage 
                  type="country" 
                  iso3={selectedCountry.iso3} 
                  size={20} 
                  strokeColor="rgba(229, 231, 235, 0.5)"
                />
                <span className="text-sm font-medium text-gray-800">
                  {language === 'es' ? selectedCountry.localName : selectedCountry.name}
                </span>
              </div>
              <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
            
            {/* Menú desplegable */}
            {dropdownOpen && (
              <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
                {availableCountries.map(country => (
                  <button
                    key={country.iso3}
                    className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                      country.iso3 === selectedCountry.iso3 ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedCountry(country);
                      setDropdownOpen(false);
                    }}
                  >
                    <FlagImage 
                      type="country" 
                      iso3={country.iso3} 
                      size={18} 
                      strokeColor="rgba(229, 231, 235, 0.5)"
                    />
                    <span className="ml-2 text-sm">
                      {language === 'es' ? country.localName : country.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido de la gráfica */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">{t.loading}</span>
          </div>
        ) : timeSeriesData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500">{t.noData}</span>
          </div>
        ) : (
          <div>
            {/* Gráfica de líneas */}
            <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 10 }}
                >
                  {/* Eliminada la cuadrícula (CartesianGrid) */}
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    tickLine={{ stroke: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    label={{ 
                      value: t.percentGDP, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 }
                    }}
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    tickLine={{ stroke: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Línea para la UE */}
                  <Line 
                    type="linear" 
                    dataKey="eu" 
                    name={t.euAverage}
                    stroke={lineColors.eu} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.eu, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para Canarias */}
                  <Line 
                    type="linear" 
                    dataKey="canary" 
                    name={t.canary}
                    stroke={lineColors.canary} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.canary, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el país seleccionado */}
                  <Line 
                    type="linear" 
                    dataKey="country" 
                    name={language === 'es' ? selectedCountry.localName : selectedCountry.name}
                    stroke={lineColors.country} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.country, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Renderizar las banderas */}
              {renderFlags()}
            </div>
            
            {/* Nueva leyenda en la parte inferior central */}
            <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
              {/* UE */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.eu }}></div>
                <span className="text-sm font-medium text-gray-700">{t.euAverage}</span>
              </div>
              
              {/* Canarias */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.canary }}></div>
                <span className="text-sm font-medium text-gray-700">{t.canary}</span>
              </div>
              
              {/* País seleccionado */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.country }}></div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'es' ? selectedCountry.localName : selectedCountry.name}
                </span>
              </div>
            </div>
            
            {/* Nota inferior */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>
                {language === 'es' 
                  ? `Sector visualizado: ${getSelectedSectorName()}`
                  : `Visualized sector: ${getSelectedSectorName()}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RDComparisonChart; 