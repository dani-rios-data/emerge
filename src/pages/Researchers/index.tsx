import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ResearchersProps {
  language?: 'es' | 'en';
}

const Researchers: React.FC<ResearchersProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={language === 'es' ? "Métricas clave" : "Key Metrics"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Indicadores de investigación" : "Research Indicators"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-12">
        <SectionTitle title={language === 'es' ? "Comparación entre la UE y países" : "EU and Countries Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Investigadores por país" : "Researchers by Country"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6">
        <SectionTitle title={language === 'es' ? "Comparación por comunidades autónomas de España" : "Spanish Autonomous Communities Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución regional de investigadores" : "Regional Researchers Distribution"} />
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">{language === 'es' ? "En desarrollo" : "In development"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Researchers;