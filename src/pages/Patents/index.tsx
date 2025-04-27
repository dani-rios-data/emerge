import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Patents: React.FC = () => {
  const { language } = useLanguage();

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-lg font-bold mb-4 text-teal-800 border-b border-teal-200 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-3 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Sección 1: Key Metrics */}
      <div className="mb-10">
        <SectionTitle title={language === 'es' ? "Métricas clave" : "Key Metrics"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Estadísticas de patentes" : "Patent Statistics"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
            {/* Espacio vacío para contenido futuro */}
          </div>
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-10">
        <SectionTitle title={language === 'es' ? "Comparación entre la UE y países" : "EU and Countries Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Patentes por país" : "Patents by Country"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
            {/* Espacio vacío para contenido futuro */}
          </div>
        </div>
      </div>
      
      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6">
        <SectionTitle title={language === 'es' ? "Comparación por comunidades autónomas de España" : "Spanish Autonomous Communities Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución regional de patentes" : "Regional Patents Distribution"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
            {/* Espacio vacío para contenido futuro */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patents;