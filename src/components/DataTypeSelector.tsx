import React from 'react';

export type DataDisplayType = 'percent_gdp' | 'million_euro';

interface DataTypeSelectorProps {
  dataType: DataDisplayType;
  onChange: (dataType: DataDisplayType) => void;
  language: 'es' | 'en';
}

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({ dataType, onChange, language }) => {
  // Textos traducidos
  const texts = {
    es: {
      percentGDP: "% del PIB",
      millionEuro: "€"
    },
    en: {
      percentGDP: "% of GDP",
      millionEuro: "€"
    }
  };

  const t = texts[language];

  return (
    <div className="flex justify-end mb-2">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-l-lg ${
            dataType === 'percent_gdp' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('percent_gdp')}
        >
          {t.percentGDP}
        </button>
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-r-lg ${
            dataType === 'million_euro' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('million_euro')}
        >
          {t.millionEuro}
        </button>
      </div>
    </div>
  );
};

export default DataTypeSelector; 