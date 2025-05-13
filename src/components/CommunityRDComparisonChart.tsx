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

// Interfaz para los datos del selector de comunidades
interface CommunityOption {
  name: string;
  localName: string;
  code: string;
}

// Interfaz para las propiedades del componente
interface CommunityRDComparisonChartProps {
  language: 'es' | 'en';
  gdpData: GDPConsolidadoData[];
  autonomousCommunitiesData: GastoIDComunidadesData[];
  years: string[];
}

// Interfaz para un punto de datos en la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  spain: number | null;
  canary: number | null;
  community: number | null;
  [key: string]: string | number | null; // Para poder agregar dinámicamente la comunidad seleccionada
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
const CommunityRDComparisonChart: React.FC<CommunityRDComparisonChartProps> = ({ 
  language, 
  gdpData,
  autonomousCommunitiesData,
  years 
}) => {
  // Estado para el sector seleccionado (por defecto "total" - todos los sectores)
  const [selectedSector, setSelectedSector] = useState<string>("total");
  
  // Estado para la comunidad seleccionada (por defecto Madrid)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Madrid',
    localName: 'Comunidad de Madrid',
    code: 'MAD'
  });
  
  // Estado para la lista de comunidades disponibles
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  
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
      spain: "España",
      selectSector: "Sector",
      selectCommunity: "Seleccionar comunidad",
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
      spain: "Spain",
      selectSector: "Sector",
      selectCommunity: "Select community",
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
    spain: "#dc2626", // Rojo para España
    canary: "#3b82f6", // Azul para Canarias
    community: "#4338ca", // Índigo para la comunidad seleccionada
  };
  
  // Efecto para cargar las comunidades autónomas disponibles
  useEffect(() => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) return;
    
    // Filtrar las comunidades autónomas únicas (excluyendo Canarias que será línea fija)
    const communities = autonomousCommunitiesData
      .filter(row => 
        row["Sector Id"] === "(_T)" && 
        normalizeText(row["Comunidad Limpio"]) !== "canarias"
      )
      .reduce((acc: CommunityOption[], row) => {
        const communityName = row["Comunidad Limpio"];
        const englishName = row["Comunidad en Inglés"];
        const originalName = row["Comunidad (Original)"];
        
        // Buscar la comunidad en el objeto de banderas
        const flag = autonomous_communities_flags.find(f => 
          normalizeText(f.community) === normalizeText(communityName) || 
          f.community.includes(originalName.replace(/\(ES\d+\)\s/, ''))
        );
        
        // Extraer código de comunidad
        const code = flag?.code || getCommunityCodeFromName(communityName);
        
        // Evitar duplicados
        if (!acc.some(c => c.name === englishName)) {
          acc.push({
            name: englishName,
            localName: originalName.replace(/\(ES\d+\)\s/, ''),
            code: code
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // Poner Madrid primero, luego ordenar alfabéticamente según el idioma
        if (a.code === 'MAD') return -1;
        if (b.code === 'MAD') return 1;
        return language === 'es' 
          ? a.localName.localeCompare(b.localName) 
          : a.name.localeCompare(b.name);
      });
    
    setAvailableCommunities(communities);
  }, [autonomousCommunitiesData, language]);
  
  // Función para normalizar texto (para comparaciones)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };
  
  // Función para obtener un código de comunidad a partir del nombre
  const getCommunityCodeFromName = (name: string): string => {
    const nameMap: {[key: string]: string} = {
      'madrid': 'MAD',
      'cataluña': 'CAT',
      'andalucía': 'AND',
      'comunidad valenciana': 'VAL',
      'castilla y león': 'CYL',
      'país vasco': 'PVA',
      'galicia': 'GAL',
      'castilla - la mancha': 'CLM',
      'aragón': 'ARA',
      'extremadura': 'EXT',
      'principado de asturias': 'AST',
      'región de murcia': 'MUR',
      'islas baleares': 'BAL',
      'cantabria': 'CAN',
      'la rioja': 'RIO',
      'comunidad foral de navarra': 'NAV'
    };
    
    const normalized = normalizeText(name);
    return nameMap[normalized] || 'COM'; // COM como código genérico
  };
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!gdpData || !autonomousCommunitiesData || years.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Mapeo del sector seleccionado al código en el CSV
    const getSectorCode = (sectorId: string): string => {
      switch(sectorId) {
        case 'total': return "(_T)";
        case 'business': return "(EMPRESAS)";
        case 'government': return "(ADMINISTRACION_PUBLICA)";
        case 'education': return "(ENSENIANZA_SUPERIOR)";
        case 'nonprofit': return "(IPSFL)";
        default: return "(_T)";
      }
    };
    
    // Mapeo del sector seleccionado al nombre en el CSV para datos nacionales
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
    
    // Obtener el código del sector para la búsqueda
    const sectorCode = getSectorCode(selectedSector);
    const sectorName = getSectorName(selectedSector);
    
    // Crear puntos de datos para cada año
    const seriesData: TimeSeriesDataPoint[] = years.map(year => {
      // Punto de datos inicial
      const dataPoint: TimeSeriesDataPoint = {
        year,
        spain: null,
        canary: null,
        community: null
      };
      
      // 1. Buscar datos de España
      const spainData = gdpData.find(row => 
        row.Year === year && 
        row.Country === "Spain" && 
        row.Sector === sectorName
      );
      
      if (spainData) {
        dataPoint.spain = parseFloat(spainData['%GDP'].replace(',', '.'));
      }
      
      // 2. Buscar datos de Canarias
      const canaryData = autonomousCommunitiesData.find(row => 
        row["Año"] === year && 
        normalizeText(row["Comunidad Limpio"]) === "canarias" && 
        row["Sector Id"] === sectorCode
      );
      
      if (canaryData) {
        dataPoint.canary = parseFloat(canaryData["% PIB I+D"].replace(',', '.'));
      }
      
      // 3. Buscar datos de la comunidad seleccionada
      const communityData = autonomousCommunitiesData.find(row => {
        const isCorrectYear = row["Año"] === year;
        const isSelectedCommunity = 
          normalizeText(row["Comunidad Limpio"]) === normalizeText(selectedCommunity.name) ||
          normalizeText(row["Comunidad en Inglés"]) === normalizeText(selectedCommunity.name) ||
          row["Comunidad (Original)"].includes(selectedCommunity.localName);
        const isCorrectSector = row["Sector Id"] === sectorCode;
        
        return isCorrectYear && isSelectedCommunity && isCorrectSector;
      });
      
      if (communityData) {
        dataPoint.community = parseFloat(communityData["% PIB I+D"].replace(',', '.'));
      }
      
      return dataPoint;
    });
    
    // Ordenar por año ascendente para la gráfica
    seriesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    setTimeSeriesData(seriesData);
    setLoading(false);
  }, [gdpData, autonomousCommunitiesData, selectedCommunity, selectedSector, years, language]);
  
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
  
  // Componente mejorado para renderizar banderas (España, Canarias, y comunidades)
  const FlagImage = ({ 
    type, 
    code, 
    strokeColor,
    size = FLAG_SIZE
  }: { 
    type: 'spain' | 'canary' | 'community'; 
    code?: string; 
    strokeColor: string;
    size?: number;
  }) => {
    let flagUrl = '';
    
    // Buscar la bandera adecuada según el tipo
    if (type === 'spain') {
      const spainFlag = country_flags.find(flag => flag.iso3 === 'ESP');
      flagUrl = spainFlag?.flag || '';
    } else if (type === 'canary') {
      const canaryFlag = autonomous_communities_flags.find(flag => flag.code === 'CAN');
      flagUrl = canaryFlag?.flag || '';
    } else if (type === 'community' && code) {
      const communityFlag = autonomous_communities_flags.find(flag => flag.code === code);
      flagUrl = communityFlag?.flag || '';
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
      [d.spain, d.canary, d.community].filter(v => v !== null)
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
        <FlagStub yValue={lastDataPoint.spain}>
          <FlagImage type="spain" strokeColor={lineColors.spain} />
        </FlagStub>

        <FlagStub yValue={lastDataPoint.community}>
          <FlagImage
            type="community"
            code={selectedCommunity.code}
            strokeColor={lineColors.community}
          />
        </FlagStub>

        <FlagStub yValue={lastDataPoint.canary}>
          <FlagImage type="canary" strokeColor={lineColors.canary} />
        </FlagStub>
      </>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Título de subsección - Estilo similar a otras subsecciones */}
      <div className="mb-4 mt-2">
        <h3 className="text-md font-semibold text-blue-700 pl-2 border-l-4 border-blue-200 mx-4">
          {language === 'es' ? "Evolución temporal del % PIB invertido en I+D por comunidades autónomas" : "R&D Investment as % of GDP over time by autonomous communities"}
        </h3>
      </div>
      
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
          
          {/* Selector de comunidad autónoma */}
          <div className="flex-shrink-0 relative" ref={dropdownRef}>
            <div 
              className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="flex items-center gap-1 px-2 py-1">
                <FlagImage 
                  type="community" 
                  code={selectedCommunity.code} 
                  size={20} 
                  strokeColor="rgba(229, 231, 235, 0.5)"
                />
                <span className="text-sm font-medium text-gray-800">
                  {language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
                </span>
              </div>
              <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
            
            {/* Menú desplegable */}
            {dropdownOpen && (
              <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
                {availableCommunities.map(community => (
                  <button
                    key={community.code}
                    className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                      community.code === selectedCommunity.code ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedCommunity(community);
                      setDropdownOpen(false);
                    }}
                  >
                    <FlagImage 
                      type="community" 
                      code={community.code} 
                      size={18} 
                      strokeColor="rgba(229, 231, 235, 0.5)"
                    />
                    <span className="ml-2 text-sm">
                      {language === 'es' ? community.localName : community.name}
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
                  
                  {/* Línea para España */}
                  <Line 
                    type="linear" 
                    dataKey="spain" 
                    name={t.spain}
                    stroke={lineColors.spain} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.spain, strokeWidth: 1, fill: '#fff' }}
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
                  
                  {/* Línea para la comunidad seleccionada */}
                  <Line 
                    type="linear" 
                    dataKey="community" 
                    name={language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
                    stroke={lineColors.community} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.community, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Renderizar las banderas */}
              {renderFlags()}
            </div>
            
            {/* Nueva leyenda en la parte inferior central */}
            <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
              {/* España */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.spain }}></div>
                <span className="text-sm font-medium text-gray-700">{t.spain}</span>
              </div>
              
              {/* Canarias */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.canary }}></div>
                <span className="text-sm font-medium text-gray-700">{t.canary}</span>
              </div>
              
              {/* Comunidad seleccionada */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.community }}></div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
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

export default CommunityRDComparisonChart; 