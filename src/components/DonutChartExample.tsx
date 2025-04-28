import React, { useState, useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  ChartData,
  TooltipItem,
  Chart
} from 'chart.js';

// Registrar componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Colores para los sectores
const SECTOR_COLORS = [
  'rgba(54, 162, 235, 0.8)',   // Azul
  'rgba(255, 99, 132, 0.8)',   // Rojo
  'rgba(255, 206, 86, 0.8)',   // Amarillo
  'rgba(75, 192, 192, 0.8)',   // Verde
  'rgba(153, 102, 255, 0.8)',  // Morado
];

interface SectorData {
  sector: string;
  value: number;
}

interface DonutChartExampleProps {
  data: SectorData[]; // Estructura definida para los datos
  selectedYear: number;
  language: 'es' | 'en';
  title?: string; // Título opcional personalizado
}

const DonutChartExample: React.FC<DonutChartExampleProps> = ({
  data,
  selectedYear,
  language,
  title
}) => {
  const [chartData, setChartData] = useState<ChartData<'doughnut'> | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const chartRef = useRef<Chart<'doughnut'> | null>(null);

  // Textos localizados
  const texts = {
    es: {
      title: title || "Distribución por sectores",
      noData: "No hay datos disponibles",
      total: "Total",
      ofGDP: "del PIB"
    },
    en: {
      title: title || "Distribution by sectors",
      noData: "No data available",
      total: "Total",
      ofGDP: "of GDP"
    }
  };

  const t = texts[language];

  // Procesar los datos para el gráfico
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      setTotalValue(0);
      return;
    }

    const processedData = processDataForChart(data);
    
    if (processedData.values.length > 0) {
      // Calcular el total
      const total = processedData.values.reduce((sum, value) => sum + value, 0);
      setTotalValue(total);
      
      setChartData({
        labels: processedData.labels,
        datasets: [{
          data: processedData.values,
          backgroundColor: processedData.colors,
          borderColor: processedData.colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      });
    } else {
      setChartData(null);
      setTotalValue(0);
    }
  }, [data, selectedYear, language]);

  // Función para procesar los datos
  const processDataForChart = (sectorData: SectorData[]) => {
    // Procesar los datos reales
    const labels: string[] = [];
    const values: number[] = [];
    
    // Usar los datos proporcionados
    sectorData.forEach(item => {
      labels.push(item.sector);
      values.push(item.value);
    });
    
    // Asignar colores
    const colors = SECTOR_COLORS.slice(0, labels.length);
    
    return { labels, values, colors };
  };

  // Plugin para mostrar texto en el centro
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart: Chart<'doughnut'>) => {
      // Verificar que es un gráfico tipo donut
      if (chart.options.cutout === undefined) return;
      
      const width = chart.width;
      const height = chart.height;
      const ctx = chart.ctx;
      
      ctx.restore();
      
      // Texto del valor total
      const fontSize = (height / 180).toFixed(2);
      ctx.font = `bold ${Number(fontSize) * 3}em sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const text = totalValue.toFixed(1) + '%';
      const textX = width / 2;
      const textY = height / 2 - 10;
      
      ctx.fillStyle = '#333';
      ctx.fillText(text, textX, textY);
      
      // Texto "del PIB" debajo
      ctx.font = `${Number(fontSize) * 1.2}em sans-serif`;
      ctx.fillStyle = '#666';
      ctx.fillText(t.ofGDP, textX, textY + 30);
      
      ctx.save();
    }
  };

  // Opciones para el gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Esto controla el tamaño del agujero central
    plugins: {
      legend: {
        display: false, // Ocultar leyenda del gráfico ya que mostramos los items debajo
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: TooltipItem<'doughnut'>) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw as number;
            const percentage = Math.round(value * 10) / 10; // Redondear a 1 decimal
            return `${label}: ${percentage}%`;
          }
        }
      }
    }
  };

  // Registrar el plugin para el texto central
  useEffect(() => {
    if (ChartJS.registry.plugins.get('centerText') === undefined) {
      ChartJS.register(centerTextPlugin);
    }
  }, []);

  return (
    <div className="h-full">
      {/* Encabezado con título */}
      <div className="bg-blue-600 text-white py-2 px-3 text-center rounded-t-lg">
        <h3 className="text-base font-medium">{t.title}</h3>
      </div>
      
      <div className="bg-white p-3">
        {/* Gráfico donut */}
        <div className="h-[220px] flex items-center justify-center">
          {chartData ? (
            <Doughnut 
              ref={chartRef}
              data={chartData} 
              options={chartOptions} 
              plugins={[centerTextPlugin]}
            />
          ) : (
            <div className="text-gray-500">{t.noData}</div>
          )}
        </div>
        
        {/* Lista de sectores con valores */}
        {chartData && (
          <div className="mt-3 bg-gray-50 rounded-md p-2">
            <div className="grid grid-cols-1 gap-1.5">
              {data.map((item, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: SECTOR_COLORS[index] }}
                  ></div>
                  <span className="truncate mr-1">{item.sector}:</span>
                  <span className="font-semibold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
              <span className="font-medium">{t.total}:</span>
              <span className="font-bold">{totalValue.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChartExample; 