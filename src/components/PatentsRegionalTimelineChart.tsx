import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Customized
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Interfaz para los datos de patentes regionales
interface RegionalPatentsData {
  'Nuts Prov': string;
  'Provincia': string;
  '2010': string;
  '2011': string;
  '2012': string;
  '2013': string;
  '2014': string;
  '2015': string;
  '2016': string;
  '2017': string;
  '2018': string;
  '2019': string;
  '2020': string;
  '2021': string;
  '2022': string;
  '2023': string;
  '2024': string;
  'SUMA': string;
  [key: string]: string | undefined;
}

// Interfaz para los datos de la línea de tiempo
interface TimeSeriesDataPoint {
  year: string;
  spainAverage: number | null;
  canarias: number | null;
  community: number | null;
}

// Interfaz para las opciones de comunidad
interface CommunityOption {
  name: string;
  code: string;
  flag?: string;
}

// Interfaz para los textos de localización
interface LocalizedTexts {
  noData: string;
  patentsCount: string;
  loading: string;
  spainAverage: string;
  canarias: string;
  selectCommunity: string;
  warningTitle: string;
  warningMessage: string;
}

// Interfaz para las escalas de Recharts
interface AxisScale {
  scale: (value: unknown) => number;
}

// Props del componente
interface PatentsRegionalTimelineChartProps {
  data: RegionalPatentsData[];
  language: 'es' | 'en';
}

// Interfaz para payload del tooltip
interface TooltipPayload {
  color: string;
  name: string;
  value: number | null;
}

// Colores para las líneas
const LINE_COLORS = {
  spainAverage: "#dc2626",  // Rojo para la media de España
  canarias: "#3b82f6",      // Azul para Canarias
  community: "#059669"      // Verde para la comunidad seleccionada
};

// Parámetros para las banderas
const FLAG_SIZE = 20;
const FLAG_MARGIN = 6;
const MIN_GAP = 24;

// Mapeo de provincias a comunidades autónomas
const PROVINCE_TO_COMMUNITY: { [key: string]: string } = {
  // Andalucía
  'Almería': 'Andalucía',
  'Cádiz': 'Andalucía',
  'Córdoba': 'Andalucía',
  'Granada': 'Andalucía',
  'Huelva': 'Andalucía',
  'Jaén': 'Andalucía',
  'Málaga': 'Andalucía',
  'Sevilla': 'Andalucía',
  
  // Aragón
  'Huesca': 'Aragón',
  'Teruel': 'Aragón',
  'Zaragoza': 'Aragón',
  
  // Asturias
  'Asturias': 'Asturias',
  
  // Canarias
  'Las Palmas': 'Canarias',
  'Santa Cruz de Tenerife': 'Canarias',
  
  // Cantabria
  'Cantabria': 'Cantabria',
  
  // Castilla-La Mancha
  'Albacete': 'Castilla-La Mancha',
  'Ciudad Real': 'Castilla-La Mancha',
  'Cuenca': 'Castilla-La Mancha',
  'Guadalajara': 'Castilla-La Mancha',
  'Toledo': 'Castilla-La Mancha',
  
  // Castilla y León
  'Ávila': 'Castilla y León',
  'Burgos': 'Castilla y León',
  'León': 'Castilla y León',
  'Palencia': 'Castilla y León',
  'Salamanca': 'Castilla y León',
  'Segovia': 'Castilla y León',
  'Soria': 'Castilla y León',
  'Valladolid': 'Castilla y León',
  'Zamora': 'Castilla y León',
  
  // Cataluña
  'Barcelona': 'Cataluña',
  'Girona': 'Cataluña',
  'Lleida': 'Cataluña',
  'Tarragona': 'Cataluña',
  
  // Comunidad Valenciana
  'Alicante': 'Comunidad Valenciana',
  'Castellón': 'Comunidad Valenciana',
  'Valencia': 'Comunidad Valenciana',
  
  // Extremadura
  'Badajoz': 'Extremadura',
  'Cáceres': 'Extremadura',
  
  // Galicia
  'A Coruña': 'Galicia',
  'Lugo': 'Galicia',
  'Ourense': 'Galicia',
  'Pontevedra': 'Galicia',
  
  // Islas Baleares
  'Illes Balears': 'Islas Baleares',
  
  // La Rioja
  'La Rioja': 'La Rioja',
  
  // Madrid
  'Madrid': 'Madrid',
  
  // Murcia
  'Murcia': 'Murcia',
  
  // Navarra
  'Navarra': 'Navarra',
  
  // País Vasco
  'Araba/Álava': 'País Vasco',
  'Bizkaia': 'País Vasco',
  'Gipuzkoa': 'País Vasco',
  
  // Ceuta y Melilla
  'Ceuta': 'Ceuta',
  'Melilla': 'Melilla'
};

// Componente para renderizar banderas
const FlagImage = ({ 
  community,
  strokeColor,
  size = FLAG_SIZE
}: { 
  community: string;
  strokeColor: string;
  size?: number;
}) => {
  let flagUrl = '';
  
  // Buscar bandera de comunidad
  if (community === 'Canarias') {
    const canaryFlag = autonomous_communities_flags.find(flag => flag.code === 'CAN');
    flagUrl = canaryFlag?.flag || '';
  } else {
    const communityFlag = autonomous_communities_flags.find(flag => 
      flag.community.toLowerCase().includes(community.toLowerCase()) ||
      community.toLowerCase().includes(flag.community.toLowerCase())
    );
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

// Componente para renderizar banderas dentro del SVG
const FlagsCustomComponent = (props: {
  yAxisMap?: AxisScale[];
  xAxisMap?: AxisScale[];
  data?: TimeSeriesDataPoint[];
  selectedCommunity?: CommunityOption;
  texts?: LocalizedTexts;
  [key: string]: unknown;
}) => {
  const { yAxisMap, xAxisMap, data, selectedCommunity, texts } = props;
  
  if (!data || !data.length || !yAxisMap || !xAxisMap || !selectedCommunity || !texts) return null;

  const xScale = xAxisMap[0]?.scale;
  const yScale = yAxisMap[0]?.scale;
  
  if (!xScale || !yScale) return null;

  // Obtener el último punto de datos
  const lastDataPoint = data[data.length - 1];
  const lastX = xScale(lastDataPoint.year);

  // Función para obtener URL de bandera
  const getFlagUrl = (community: string) => {
    if (community === 'Canarias') {
      const canaryFlag = autonomous_communities_flags.find(flag => flag.code === 'CAN');
      return canaryFlag?.flag || '';
    } else {
      const communityFlag = autonomous_communities_flags.find(flag => 
        flag.community.toLowerCase().includes(community.toLowerCase()) ||
        community.toLowerCase().includes(flag.community.toLowerCase())
      );
      return communityFlag?.flag || '';
    }
  };

  // Preparar puntos de banderas
  const flagPoints = [];

  // Canarias
  if (lastDataPoint.canarias !== null) {
    flagPoints.push({
      key: 'canarias',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.canarias),
      originalY: yScale(lastDataPoint.canarias),
      flagUrl: getFlagUrl('Canarias'),
      color: LINE_COLORS.canarias,
      label: texts.canarias
    });
  }

  // Comunidad seleccionada
  if (selectedCommunity && lastDataPoint.community !== null) {
    flagPoints.push({
      key: 'community',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.community),
      originalY: yScale(lastDataPoint.community),
      flagUrl: getFlagUrl(selectedCommunity.name),
      color: LINE_COLORS.community,
      label: selectedCommunity.name
    });
  }

  // Lógica de anti-solape: ordenar por Y y ajustar posiciones
  flagPoints.sort((a, b) => a.originalY - b.originalY);
  
  for (let i = 1; i < flagPoints.length; i++) {
    const currentFlag = flagPoints[i];
    const previousFlag = flagPoints[i - 1];
    
    if (currentFlag.y - previousFlag.y < MIN_GAP) {
      currentFlag.y = previousFlag.y + MIN_GAP;
    }
  }

  return (
    <g>
      {flagPoints.map(point => {
        if (!point.flagUrl) return null;
        
        return (
          <g key={point.key}>
            {/* Línea conectora si la bandera se movió de su posición original */}
            {Math.abs(point.y - point.originalY) > 2 && (
              <line
                x1={point.x - 2}
                y1={point.originalY}
                x2={point.x - 2}
                y2={point.y}
                stroke={point.color}
                strokeWidth={1}
                strokeDasharray="2,2"
                opacity={0.5}
              />
            )}
            
            {/* Bandera */}
            <image
              href={point.flagUrl}
              x={point.x}
              y={point.y - FLAG_SIZE / 2}
              width={FLAG_SIZE}
              height={FLAG_SIZE * 0.67}
              style={{ 
                cursor: 'pointer',
                filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.1))`
              }}
            />
            
            {/* Borde de la bandera */}
            <rect
              x={point.x}
              y={point.y - FLAG_SIZE / 2}
              width={FLAG_SIZE}
              height={FLAG_SIZE * 0.67}
              fill="none"
              stroke={point.color}
              strokeWidth={1}
              rx={2}
            />
          </g>
        );
      })}
    </g>
  );
};

const PatentsRegionalTimelineChart: React.FC<PatentsRegionalTimelineChartProps> = ({
  data,
  language,
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para la comunidad seleccionada internamente (Madrid por defecto)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Madrid',
    code: 'MAD'
  });
  // Lista de comunidades disponibles
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Referencia para el componente
  const chartRef = useRef<HTMLDivElement>(null);
  // Referencia para el contenedor de la gráfica
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Textos según el idioma
  const texts = {
    es: {
      noData: 'Sin datos',
      patentsCount: 'Número de patentes',
      loading: 'Cargando...',
      spainAverage: 'Media España',
      canarias: 'Canarias',
      selectCommunity: 'Seleccionar comunidad',
      warningTitle: 'Datos específicos de patentes en España',
      warningMessage: 'Todos los datos mostrados en esta gráfica provienen del dataset oficial de patentes registradas en España. Los valores de la media nacional se calculan basándose únicamente en este conjunto de datos.'
    },
    en: {
      noData: 'No data',
      patentsCount: 'Number of patents',
      loading: 'Loading...',
      spainAverage: 'Spain Average',
      canarias: 'Canary Islands',
      selectCommunity: 'Select community',
      warningTitle: 'Spain-specific patent data',
      warningMessage: 'All data shown in this chart comes from the official dataset of patents registered in Spain. National average values are calculated based solely on this dataset.'
    }
  };

  const t = texts[language];

  // Efecto para manejar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para cargar las comunidades disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Obtener las comunidades autónomas disponibles
    const communities = Array.from(new Set(
      data
        .filter(item => item.Provincia && PROVINCE_TO_COMMUNITY[item.Provincia])
        .map(item => PROVINCE_TO_COMMUNITY[item.Provincia])
    ))
    .filter(community => community !== 'Canarias') // Excluir Canarias
    .map(community => ({
      name: community,
      code: community.substring(0, 3).toUpperCase()
    }))
    .sort((a, b) => {
      // Madrid primero, luego ordenar alfabéticamente
      if (a.name === 'Madrid') return -1;
      if (b.name === 'Madrid') return 1;
      return a.name.localeCompare(b.name);
    });

    setAvailableCommunities(communities);

    // Establecer Madrid como comunidad por defecto si está disponible
    const madrid = communities.find(c => c.name === 'Madrid');
    if (madrid) {
      setSelectedCommunity(madrid);
    } else if (communities.length > 0) {
      setSelectedCommunity(communities[0]);
    }
  }, [data]);

  // Efecto para procesar los datos de la serie temporal
  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Años disponibles (2010-2024)
      const availableYears = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

      // Filtrar solo las filas con datos válidos (excluyendo filas sin provincia o con valores vacíos al principio)
      // También excluir filas duplicadas - solo tomar la primera aparición de cada provincia
      const seenProvinces = new Set<string>();
      const validData = data.filter(item => {
        if (!item.Provincia || 
            item.Provincia === '' || 
            item.Provincia.includes('No residentes') ||
            !item['2010'] || 
            item['2010'] === ''
        ) {
          return false;
        }
        
        // Si ya hemos visto esta provincia, excluir esta fila (evita duplicados)
        if (seenProvinces.has(item.Provincia)) {
          return false;
        }
        
        seenProvinces.add(item.Provincia);
        return true;
      });

      // Crear puntos de datos para cada año
      const seriesData: TimeSeriesDataPoint[] = availableYears.map(year => {
        const dataPoint: TimeSeriesDataPoint = {
          year,
          spainAverage: null,
          canarias: null,
          community: null
        };

        // 1. Buscar datos de Canarias
        const canariasProvinces = validData.filter(item => 
          item.Provincia && 
          (item.Provincia === 'Las Palmas' || item.Provincia === 'Santa Cruz de Tenerife') &&
          item[year] && item[year] !== ''
        );

        if (canariasProvinces.length > 0) {
          const canariasPatents = canariasProvinces.reduce((sum, province) => {
            const patents = parseInt(province[year] || '0');
            return sum + (isNaN(patents) ? 0 : patents);
          }, 0);
          dataPoint.canarias = canariasPatents;
        }

        // 2. Buscar datos de la comunidad seleccionada
        if (selectedCommunity) {
          const communityProvinces = validData.filter(item => 
            item.Provincia && 
            PROVINCE_TO_COMMUNITY[item.Provincia] === selectedCommunity.name &&
            item[year] && item[year] !== ''
          );

          if (communityProvinces.length > 0) {
            const communityPatents = communityProvinces.reduce((sum, province) => {
              const patents = parseInt(province[year] || '0');
              return sum + (isNaN(patents) ? 0 : patents);
            }, 0);
            dataPoint.community = communityPatents;
          }
        }

        return dataPoint;
      });

      setTimeSeriesData(seriesData);
      setLoading(false);
    } catch (error) {
      console.error("Error processing patents timeline data:", error);
      setLoading(false);
    }
  }, [data, selectedCommunity]);

  // Función para formatear el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  // Función para formatear números
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(value);
  };

  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousDataPoint = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousDataPoint[dataKey as keyof TimeSeriesDataPoint] as number | null;
    
    if (previousValue === null || previousValue === 0) return null;
    
    const yoyChange = ((currentValue - previousValue) / previousValue) * 100;
    return yoyChange.toFixed(2);
  };

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: TooltipPayload[]; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      // Encontrar el índice del año actual para calcular YoY
      const currentYearIndex = timeSeriesData.findIndex(d => d.year === label);
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          {payload.map((entry: TooltipPayload, index: number) => {
            if (entry.value === null) return null;
            
            // Calcular YoY para esta entrada
            const yoyChange = calculateYoY(entry.value, entry.name === t.canarias ? 'canarias' : 'community', currentYearIndex);
            
            const yoyText = yoyChange !== null ? 
              `(${parseFloat(yoyChange) >= 0 ? '+' : ''}${yoyChange}%)` : '';
            
            return (
              <div key={index} className="flex items-center mb-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600 mr-2">{entry.name}:</span>
                <span className="text-sm font-medium text-gray-800">
                  {formatNumber(entry.value)}
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
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="w-full h-full">
      {/* Warning sobre el dataset específico */}
      <div className="mb-4 text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-blue-600 mr-3 mt-0.5 flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <div className="text-blue-800">
            <p className="font-medium mb-2">{t.warningTitle}</p>
            <p className="text-xs leading-relaxed">
              {t.warningMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de comunidad alineado a la derecha */}
      <div className="mb-4 flex justify-end items-center">
        <div className="flex-shrink-0 relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-2 py-1">
              <FlagImage 
                community={selectedCommunity.name} 
                size={20} 
                strokeColor="rgba(229, 231, 235, 0.5)"
              />
              <span className="text-sm font-medium text-gray-800">
                {selectedCommunity ? selectedCommunity.name : t.selectCommunity}
              </span>
            </div>
            <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
              <ChevronDown size={16} />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
              {availableCommunities.map(community => (
                <button
                  key={community.code}
                  className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                    community.code === selectedCommunity?.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedCommunity(community);
                    setDropdownOpen(false);
                  }}
                >
                  <FlagImage 
                    community={community.name} 
                    size={18} 
                    strokeColor="rgba(229, 231, 235, 0.5)"
                  />
                  <span className="ml-2 text-sm">{community.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de líneas */}
      <div ref={chartContainerRef} className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeSeriesData}
            margin={{ top: 20, right: 60, left: 20, bottom: 10 }}
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
            
            {/* Línea para Canarias */}
            <Line 
              type="linear" 
              dataKey="canarias" 
              name={t.canarias}
              stroke={LINE_COLORS.canarias} 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, stroke: LINE_COLORS.canarias, strokeWidth: 1, fill: '#fff' }}
              isAnimationActive={false}
            />
            
            {/* Línea para la comunidad seleccionada */}
            {selectedCommunity && (
              <Line 
                type="linear" 
                dataKey="community" 
                name={selectedCommunity.name}
                stroke={LINE_COLORS.community} 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: LINE_COLORS.community, strokeWidth: 1, fill: '#fff' }}
                isAnimationActive={false}
              />
            )}
            
            {/* Banderas renderizadas dentro del SVG */}
            <Customized
              component={(rechartProps: Record<string, unknown>) => (
                <FlagsCustomComponent
                  {...rechartProps}
                  data={timeSeriesData}
                  selectedCommunity={selectedCommunity}
                  texts={t}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Leyenda en la parte inferior central */}
      <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
        {/* Canarias */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.canarias }}></div>
          <span className="text-sm font-medium text-gray-700">{t.canarias}</span>
        </div>
        
        {/* Comunidad seleccionada */}
        {selectedCommunity && (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.community }}></div>
            <span className="text-sm font-medium text-gray-700">{selectedCommunity.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatentsRegionalTimelineChart; 