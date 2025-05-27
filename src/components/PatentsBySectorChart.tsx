import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import country_flags from '../logos/country_flags.json';

// Interfaz para los datos de patentes
interface PatentsData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de patentes
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
}

// Interfaz para un punto de datos en la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  total: number | null;
  business: number | null;
  government: number | null;
  education: number | null;
  nonprofit: number | null;
  [key: string]: string | number | null;
}

// Interfaz para un país seleccionable
interface CountryOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

// Interfaz para las propiedades del componente
interface PatentsBySectorChartProps {
  data: PatentsData[];
  language: 'es' | 'en';
  countryCode?: string; // Código del país para mostrar los datos (default: 'ES' para España)
  onCountryChange?: (country: CountryOption) => void;
}

// Colores para las líneas de cada sector
const SECTOR_COLORS = {
  total: "#000000",     // Negro para el total
  business: "#3b82f6",  // Azul para empresas
  government: "#dc2626", // Rojo para gobierno
  education: "#10b981", // Verde para educación
  nonprofit: "#f59e0b"  // Ámbar para sin fines de lucro
};

// Lista de países europeos para filtrar
const EUROPEAN_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB', 'CH', 'NO', 
  'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 'XK'
];

const PatentsBySectorChart: React.FC<PatentsBySectorChartProps> = ({
  data,
  language,
  countryCode = 'ES', // Por defecto, España
  onCountryChange
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para la comunidad seleccionada (por defecto España)
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    code: countryCode
  });
  // Lista de países disponibles
  const [availableCountries, setAvailableCountries] = useState<CountryOption[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Distribución por sectores de investigación",
      patentsCount: "Número de patentes",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      selectCountry: "Seleccionar país",
      // Sectores
      total: "Todos los sectores",
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Distribution by Research Sectors",
      patentsCount: "Number of patents",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      selectCountry: "Select country",
      // Sectores
      total: "All sectors",
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Efecto para cargar los países disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Obtener los países europeos disponibles
    const countries = data
      .filter(item => 
        // Excluir EU27_2020 y comprobar que es un país europeo
        item.geo !== 'EU27_2020' && 
        (EUROPEAN_COUNTRY_CODES.includes(item.geo) || item.geo === 'EL') && // Incluir explícitamente EL (Grecia)
        item.sectperf === 'TOTAL'
      )
      .reduce((acc: CountryOption[], item) => {
        // Evitar duplicados
        if (!acc.some(c => c.code === item.geo)) {
          // Para Grecia (EL), usar nombres específicos
          if (item.geo === 'EL') {
            acc.push({
              name: 'Greece',
              localName: 'Grecia',
              code: 'EL',
              flag: country_flags.find(f => f.code === 'GR' || f.iso3 === 'GRC')?.flag || 'https://flagcdn.com/gr.svg'
            });
          } else {
            const countryName = getCountryNameFromCode(item.geo);
            const flagUrl = country_flags.find(f => f.code === item.geo || f.iso3 === item.geo)?.flag;
            
            acc.push({
              name: language === 'en' ? countryName : getCountryNameFromCode(item.geo, 'es'),
              localName: getCountryNameFromCode(item.geo, 'es'),
              code: item.geo,
              flag: flagUrl
            });
          }
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // España primero, luego ordenar alfabéticamente
        if (a.code === 'ES') return -1;
        if (b.code === 'ES') return 1;
        return language === 'es' 
          ? a.localName.localeCompare(b.localName) 
          : a.name.localeCompare(b.name);
      });
    
    setAvailableCountries(countries);
    
    // Establecer el país seleccionado basado en el countryCode
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      // Notificar el cambio de país al componente padre
      if (onCountryChange) {
        onCountryChange(country);
      }
    }
  }, [data, language, countryCode]);

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
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Filtrar datos para el país seleccionado
    const countryData = data.filter(item => item.geo === selectedCountry.code);
    
    if (countryData.length === 0) {
      setTimeSeriesData([]);
      setLoading(false);
      return;
    }

    // Obtener todos los años únicos y ordenarlos
    const years = Array.from(new Set(countryData.map(item => item.TIME_PERIOD)))
      .filter(year => year && !isNaN(parseInt(year)))
      .sort();

    // Crear la serie temporal
    const timeSeries: TimeSeriesDataPoint[] = years.map(year => {
      const yearData: TimeSeriesDataPoint = {
        year,
        total: null,
        business: null,
        government: null,
        education: null,
        nonprofit: null
      };

      // Mapear los sectores
      const sectorMapping = {
        'TOTAL': 'total',
        'BES': 'business',
        'GOV': 'government', 
        'HES': 'education',
        'PNP': 'nonprofit'
      };

      // Llenar los datos para cada sector
      Object.entries(sectorMapping).forEach(([sectorCode, sectorKey]) => {
        const sectorData = countryData.find(item => 
          item.TIME_PERIOD === year && item.sectperf === sectorCode
        );
        
        if (sectorData && sectorData.OBS_VALUE) {
          const value = parseFloat(sectorData.OBS_VALUE);
          if (!isNaN(value)) {
            yearData[sectorKey] = value;
          }
        }
      });

      return yearData;
    });

    setTimeSeriesData(timeSeries);
    setLoading(false);
  }, [data, selectedCountry]);

  // Formatear números en el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Función para obtener nombre del país desde código
  function getCountryNameFromCode(code: string, lang: 'es' | 'en' = language): string {
    const countryNames: Record<string, {es: string, en: string}> = {
      'AT': {es: 'Austria', en: 'Austria'},
      'BE': {es: 'Bélgica', en: 'Belgium'},
      'BG': {es: 'Bulgaria', en: 'Bulgaria'},
      'CY': {es: 'Chipre', en: 'Cyprus'},
      'CZ': {es: 'República Checa', en: 'Czech Republic'},
      'DE': {es: 'Alemania', en: 'Germany'},
      'DK': {es: 'Dinamarca', en: 'Denmark'},
      'EE': {es: 'Estonia', en: 'Estonia'},
      'EL': {es: 'Grecia', en: 'Greece'},
      'ES': {es: 'España', en: 'Spain'},
      'FI': {es: 'Finlandia', en: 'Finland'},
      'FR': {es: 'Francia', en: 'France'},
      'HR': {es: 'Croacia', en: 'Croatia'},
      'HU': {es: 'Hungría', en: 'Hungary'},
      'IE': {es: 'Irlanda', en: 'Ireland'},
      'IT': {es: 'Italia', en: 'Italy'},
      'LT': {es: 'Lituania', en: 'Lithuania'},
      'LU': {es: 'Luxemburgo', en: 'Luxembourg'},
      'LV': {es: 'Letonia', en: 'Latvia'},
      'MT': {es: 'Malta', en: 'Malta'},
      'NL': {es: 'Países Bajos', en: 'Netherlands'},
      'PL': {es: 'Polonia', en: 'Poland'},
      'PT': {es: 'Portugal', en: 'Portugal'},
      'RO': {es: 'Rumanía', en: 'Romania'},
      'SE': {es: 'Suecia', en: 'Sweden'},
      'SI': {es: 'Eslovenia', en: 'Slovenia'},
      'SK': {es: 'Eslovaquia', en: 'Slovakia'},
      'GB': {es: 'Reino Unido', en: 'United Kingdom'},
      'CH': {es: 'Suiza', en: 'Switzerland'},
      'NO': {es: 'Noruega', en: 'Norway'},
      'IS': {es: 'Islandia', en: 'Iceland'},
      'TR': {es: 'Turquía', en: 'Turkey'}
    };
    
    return countryNames[code]?.[lang] || code;
  }

  // Calcular variación interanual
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousValue = timeSeriesData[currentYearIndex - 1]?.[dataKey] as number | null;
    if (previousValue === null || previousValue === 0) return null;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Componente para mostrar banderas
  const FlagImage = ({ 
    code, 
    size = 22
  }: { 
    code?: string; 
    size?: number;
  }) => {
    if (!code) return null;
    
    // Manejar el caso especial de Grecia (EL)
    let flagUrl = '';
    if (code === 'EL') {
      // Buscar la bandera de Grecia usando el código estándar ISO (GR)
      const greeceFlag = country_flags.find(flag => flag.code === 'GR' || flag.iso3 === 'GRC');
      flagUrl = greeceFlag?.flag || 'https://flagcdn.com/gr.svg';
    } else {
      // Para otros países, buscar en el JSON de banderas
      const countryFlag = country_flags.find(flag => flag.code === code || flag.iso3 === code);
      flagUrl = countryFlag?.flag || '';
      
      // Si no se encuentra, usar API de banderas
      if (!flagUrl && code.length === 2) {
        flagUrl = `https://flagcdn.com/${code.toLowerCase()}.svg`;
      }
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
          border: '1px solid rgba(229, 231, 235, 0.5)',
          borderRadius: 4,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.02)'
        }}
      />
    );
  };

  // Tooltip personalizado
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      name: string;
      dataKey: string;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const currentYearIndex = timeSeriesData.findIndex(d => d.year === label);
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`${t.year}: ${label}`}</p>
          {payload.map((entry, index) => {
            const yoyChange = calculateYoY(entry.value, entry.dataKey, currentYearIndex);
            
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                </div>
                <div className="text-right ml-4">
                  <span className="font-medium text-gray-800">
                    {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(entry.value)}
                  </span>
                  {yoyChange !== null && (
                    <div className={`text-xs ${yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Verificar si hay datos disponibles
  const hasData = timeSeriesData.some(d => 
    d.total !== null || d.business !== null || d.government !== null || 
    d.education !== null || d.nonprofit !== null
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-50 rounded-lg border border-gray-200" style={{ height: '400px' }}>
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex justify-center items-center bg-gray-50 rounded-lg border border-gray-200" style={{ height: '400px' }}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Selector de país (sin título) */}
      <div className="px-4 pt-4 pb-2 flex justify-end items-center">
        {/* Selector de país */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-3 py-2">
              <FlagImage code={selectedCountry.code} size={20} />
              <span className="text-sm font-medium text-gray-800 ml-2">
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
                  key={country.code}
                  className={`flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    country.code === selectedCountry.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedCountry(country);
                    setDropdownOpen(false);
                    if (onCountryChange) {
                      onCountryChange(country);
                    }
                  }}
                >
                  <FlagImage code={country.code} size={18} />
                  <span className="ml-2 text-sm">
                    {language === 'es' ? country.localName : country.name}
                  </span>
                </button>
              ))}
            </div>
          )}
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
            <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    tickLine={{ stroke: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    label={{ 
                      value: t.patentsCount, 
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
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  
                  {/* Línea para el sector total */}
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name={t.total}
                    stroke={SECTOR_COLORS.total} 
                    strokeWidth={2}
                    strokeDasharray="3 3" // Línea punteada
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.total, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector empresarial */}
                  <Line 
                    type="monotone" 
                    dataKey="business" 
                    name={t.business}
                    stroke={SECTOR_COLORS.business} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.business, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector gobierno */}
                  <Line 
                    type="monotone" 
                    dataKey="government" 
                    name={t.government}
                    stroke={SECTOR_COLORS.government} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.government, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector educación */}
                  <Line 
                    type="monotone" 
                    dataKey="education" 
                    name={t.education}
                    stroke={SECTOR_COLORS.education} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.education, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector sin fines de lucro */}
                  <Line 
                    type="monotone" 
                    dataKey="nonprofit" 
                    name={t.nonprofit}
                    stroke={SECTOR_COLORS.nonprofit} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.nonprofit, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatentsBySectorChart; 