import React, { useState } from 'react';
import './index.css'; // Asegúrate de que este archivo importa correctamente los estilos de Tailwind
import OverviewSection from './components/OverviewSection';
import Investment from './pages/Investment';
import SourcesSection from './components/SourcesSection';

// Definir tipos
type TabType = 'overview' | 'investment' | 'researchers' | 'patents' | 'sources';
type Language = 'es' | 'en';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Cambiando a 'overview' para mostrar primero la visión general
  const [language, setLanguage] = useState<Language>('es');
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const texts = {
    es: {
      title: "Observatorio de I+D en Canarias",
      subtitle: "Análisis comparativo e histórico de indicadores de innovación",
      overview: "Visión General",
      investment: "Inversión en I+D",
      researchers: "Investigadores",
      patents: "Patentes",
      patentsDescription: "Número de patentes registradas en Canarias por año, con desglose por sector.",
      overviewDescription: "Resumen general de la actividad de I+D en Canarias, principales indicadores y tendencias.",
      investmentDescription: "Inversión total en I+D en Canarias, desglosada por sectores público y privado.",
      researchersDescription: "Número de investigadores activos en Canarias, distribución por áreas y centros de investigación.",
      sources: "Fuentes de Datos"
    },
    en: {
      title: "R&D Observatory of the Canary Islands",
      subtitle: "Comparative and historical analysis of innovation indicators",
      overview: "Overview",
      investment: "R&D Investment",
      researchers: "Researchers",
      patents: "Patents",
      patentsDescription: "Number of patents registered in the Canary Islands per year, with sector breakdown.",
      overviewDescription: "General summary of R&D activity in the Canary Islands, main indicators and trends.",
      investmentDescription: "Total R&D investment in the Canary Islands, broken down by public and private sectors.",
      researchersDescription: "Number of active researchers in the Canary Islands, distribution by areas and research centers.",
      sources: "Data Sources"
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
    setShowLangDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Contenedor para elementos fijos */}
      <div className="fixed top-0 left-0 right-0 z-30">
        {/* Header con logo integrado */}
        <header className="bg-white py-4 px-2 shadow-md border-b border-gray-200 relative">
          {/* Logo en el lado izquierdo, perfectamente centrado verticalmente */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <img src="/emerge_logo.svg" alt="EMERGE Logo" className="h-12" />
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-1">{t('title')}</h1>
            <p className="text-xs text-gray-600 font-normal">{t('subtitle')}</p>
          </div>
          
          {/* Selector de idioma en la esquina superior derecha */}
          <div className="absolute top-2 right-2 z-50">
            <div className="relative">
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="px-2 py-1 border border-blue-500 rounded bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 flex items-center shadow-sm transition-all hover:shadow"
              >
                {language === 'es' ? 'ES' : 'EN'}
                <svg className="ml-1 w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-0.5 w-12 bg-white border border-gray-200 rounded shadow-md ring-1 ring-black ring-opacity-5">
                  <button 
                    onClick={toggleLanguage}
                    className="block w-full text-center px-1.5 py-1 text-xs font-medium hover:bg-blue-50 transition-colors duration-150"
                  >
                    {language === 'es' ? 'EN' : 'ES'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation - ancho completo, justo debajo del header */}
        <nav className="bg-white shadow-sm w-full border-b border-gray-200 py-0.5">
          <div className="max-w-7xl mx-auto">
            <ul className="flex">
              <li 
                className={`cursor-pointer px-2 py-2.5 text-center flex-1 border-b transition-all duration-200 ${activeTab === 'overview' ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setActiveTab('overview')}
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 mr-1 ${activeTab === 'overview' ? 'text-blue-700' : 'text-gray-800'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  <span className="text-xs font-semibold">{t('overview')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer px-2 py-2.5 text-center flex-1 border-b transition-all duration-200 ${activeTab === 'investment' ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setActiveTab('investment')}
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 mr-1 ${activeTab === 'investment' ? 'text-blue-700' : 'text-gray-800'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
                  </svg>
                  <span className="text-xs font-semibold">{t('investment')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer px-2 py-2.5 text-center flex-1 border-b transition-all duration-200 ${activeTab === 'researchers' ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setActiveTab('researchers')}
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 mr-1 ${activeTab === 'researchers' ? 'text-blue-700' : 'text-gray-800'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span className="text-xs font-semibold">{t('researchers')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer px-2 py-2.5 text-center flex-1 border-b transition-all duration-200 ${activeTab === 'patents' ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setActiveTab('patents')}
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 mr-1 ${activeTab === 'patents' ? 'text-blue-700' : 'text-gray-800'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span className="text-xs font-semibold">{t('patents')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer px-2 py-2.5 text-center flex-1 border-b transition-all duration-200 ${activeTab === 'sources' ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setActiveTab('sources')}
              >
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 mr-1 ${activeTab === 'sources' ? 'text-blue-700' : 'text-gray-800'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span className="text-xs font-semibold">{t('sources')}</span>
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Content - con margen superior para evitar que quede debajo de los elementos fijos */}
      <div className="pt-32 max-w-7xl mx-auto px-6 pb-6">
        {activeTab === 'overview' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100">
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('overview')}</h2>
            
            {/* Componente modular para la sección Overview */}
            <OverviewSection language={language} />
          </div>
        )}
        
        {activeTab === 'investment' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100">
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('investment')}</h2>
            
            {/* Componente modular para la sección de Inversión */}
            <Investment />
          </div>
        )}
        
        {activeTab === 'researchers' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100">
            <h2 className="text-base font-bold mb-2 text-gray-800 border-b pb-1">{t('researchers')}</h2>
            <p className="text-xs leading-relaxed text-gray-700">
              {t('researchersDescription')}
            </p>
            
            <div className="h-64 bg-gray-50 rounded mt-4 flex items-center justify-center border border-gray-200 shadow-inner">
              <p className="text-gray-500 flex items-center text-xs">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Aquí se mostrará el gráfico de investigadores
        </p>
      </div>
          </div>
        )}
        
        {activeTab === 'patents' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100">
            <h2 className="text-base font-bold mb-2 text-gray-800 border-b pb-1">{t('patents')}</h2>
            <p className="text-xs leading-relaxed text-gray-700">
              {t('patentsDescription')}
            </p>
            
            <div className="h-64 bg-gray-50 rounded mt-4 flex items-center justify-center border border-gray-200 shadow-inner">
              <p className="text-gray-500 flex items-center text-xs">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Aquí se mostrará el gráfico de patentes
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'sources' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100">
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('sources')}</h2>
            
            {/* Componente modular para la sección de Fuentes de Datos */}
            <SourcesSection language={language} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;