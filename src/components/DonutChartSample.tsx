import React, { useState } from 'react';
import DonutChartExample from './DonutChartExample';

interface SectorData {
  sector: string;
  value: number;
}

interface DonutChartSampleProps {
  language: 'es' | 'en';
}

const DonutChartSample: React.FC<DonutChartSampleProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2022);
  
  // Datos de ejemplo para diferentes sectores
  const sampleData: SectorData[] = [
    { sector: language === 'es' ? 'Sector empresarial' : 'Business enterprise sector', value: 58.6 },
    { sector: language === 'es' ? 'Sector gubernamental' : 'Government sector', value: 17.9 },
    { sector: language === 'es' ? 'Educación superior' : 'Higher education sector', value: 22.1 },
    { sector: language === 'es' ? 'Sector no lucrativo' : 'Private non-profit sector', value: 1.4 }
  ];

  // Textos traducidos
  const texts = {
    es: {
      title: "Ejemplo de gráfico donut",
      yearSelector: "Seleccionar año",
      description: "Distribución de la inversión en I+D por sectores en %"
    },
    en: {
      title: "Donut chart example",
      yearSelector: "Select year",
      description: "R&D investment distribution by sectors in %"
    }
  };

  const t = texts[language];

  // Función para manejar el cambio de año
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">{t.title}</h2>
      
      {/* Selector de año */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.yearSelector}
        </label>
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2022, 2021, 2020, 2019, 2018].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      
      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-4">{t.description}</p>
      
      {/* El componente del gráfico */}
      <div className="mb-4">
        <DonutChartExample 
          data={sampleData}
          selectedYear={selectedYear}
          language={language}
        />
      </div>
    </div>
  );
};

export default DonutChartSample; 