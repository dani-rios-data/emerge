import React, { useState } from 'react';
import './index.css'; // Asegúrate de que este archivo importa correctamente los estilos de Tailwind
import OverviewPage from './pages/Overview'; // Importar el componente de la página Overview
import Investment from './pages/Investment';
import Researchers from './pages/Researchers'; // Importar el componente de la página Researchers
import Patents from './pages/Patents'; // Importar el componente de la página Patents
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
      title: "Islas Canarias Observatorio de I+D",
      subtitle: "Análisis comparativo e histórico de indicadores de innovación",
      overview: "Visión General",
      investment: "Inversión en I+D",
      researchers: "Investigadores",
      patents: "Patentes",
      patentsDescription: "Número de patentes registradas en Canarias por año, con desglose por sector.",
      overviewDescription: "Resumen general de la actividad de I+D en Canarias, principales indicadores y tendencias.",
      investmentDescription: "Inversión total en I+D en Canarias, desglosada por sectores público y privado.",
      researchersDescription: "Profesionales dedicados a la I+D en diferentes sectores (empresas, gobierno, educación superior, instituciones privadas sin fines de lucro). Datos comparativos entre Europa, España y Canarias. ETC (Equivalente Tiempo Completo).",
      sources: "Fuentes de Datos",
      footerText: "Desarrollado por EMERGE - Asociación Canaria de Startups"
    },
    en: {
      title: "Canary Islands R&D Observatory",
      subtitle: "Comparative and historical analysis of innovation indicators",
      overview: "Overview",
      investment: "R&D Investment",
      researchers: "Researchers",
      patents: "Patents",
      patentsDescription: "Number of patents registered in the Canary Islands per year, with sector breakdown.",
      overviewDescription: "General summary of R&D activity in the Canary Islands, main indicators and trends.",
      investmentDescription: "Total R&D investment in the Canary Islands, broken down by public and private sectors.",
      researchersDescription: "Professionals engaged in R&D across different sectors (business, government, higher education, private non-profit). Comparative data between Europe, Spain, and the Canary Islands. FTE (Full-Time Equivalent).",
      sources: "Data Sources",
      footerText: "Developed by EMERGE - Canary Islands Startup Association"
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  // Referencia para el contenido principal
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Usar useEffect para detectar cambios de idioma y mantener la experiencia fluida
  React.useEffect(() => {
    // No hacer nada en el primer renderizado
    // Este efecto solo restaurará la posición cuando cambie el idioma
  }, [language]);
  
  const toggleLanguage = () => {
    // Capturar dimensiones y posición exacta antes del cambio
    const contentElement = contentRef.current;
    let scrollInfo = null;
    
    if (contentElement) {
      // Guardar información de scroll y dimensiones relativas
      const rect = contentElement.getBoundingClientRect();
      const visibleRatio = Math.abs(rect.top) / contentElement.scrollHeight;
      scrollInfo = {
        element: contentElement,
        visibleRatio,
        visibleTop: rect.top,
        // Capturar posición exacta de elementos visibles para referencia
        elementAtViewport: document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      };
    }
    
    // Preparar la transición visual suave
    document.body.style.opacity = '0.98';
    document.body.style.transition = 'opacity 0.15s ease';
    
    // Cambiar el idioma
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
    setShowLangDropdown(false);
    
    // Restaurar la posición después del renderizado
    setTimeout(() => {
      // Primero hacer visible el contenido nuevamente
      document.body.style.opacity = '1';
      
      // Intentar restaurar posición exacta
      if (scrollInfo && scrollInfo.element) {
        // Calcular la nueva posición basándose en la relación de visibilidad anterior
        const targetScrollTop = scrollInfo.element.scrollHeight * scrollInfo.visibleRatio;
        window.scrollTo({
          top: targetScrollTop,
          behavior: 'auto' // Usar 'auto' para evitar animación adicional
        });
      }
    }, 50); // Un pequeño retraso para permitir que React complete el renderizado
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col w-full">
      {/* Contenedor para elementos fijos */}
      <div className="fixed top-0 left-0 right-0 z-30 w-full">
        {/* Header con logo integrado */}
        <header className="bg-white py-4 px-6 shadow-md border-b border-gray-200 relative flex items-center justify-between w-full">
          {/* Logo en el lado izquierdo, perfectamente centrado verticalmente */}
          <div className="flex-shrink-0">
            <img src="/emerge_logo.svg" alt="EMERGE Logo" className="h-12" />
          </div>
          
          <div className="flex-grow text-center">
            <h1 className="text-xl font-bold mb-1" style={{ color: '#006480' }}>{t('title')}</h1>
            <p className="text-xs text-gray-600 font-normal">{t('subtitle')}</p>
          </div>
          
          {/* Selector de idioma alineado verticalmente al centro */}
          <div className="flex-shrink-0 flex items-center">
            <div className="relative">
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="px-3 py-1.5 border border-gray-300 rounded-full bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm transition-all"
              >
                <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                {language === 'es' ? 'ES' : 'EN'}
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-20 bg-white border border-gray-200 rounded shadow-md ring-1 ring-black ring-opacity-5 z-50">
                  <button 
                    onClick={toggleLanguage}
                    className="block w-full text-center px-2 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors duration-150"
                  >
                    {language === 'es' ? 'EN' : 'ES'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation - ancho completo, justo debajo del header */}
        <nav style={{ backgroundColor: '#006480' }} className="shadow-sm w-full border-b py-0.5" >
          <div className="max-w-7xl mx-auto" style={{ minWidth: "100%" }}>
            <ul className="flex pt-2 px-2 justify-center" style={{ minWidth: "100%" }}>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] ${activeTab === 'overview' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'overview' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('overview')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'overview' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('overview')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'investment' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'investment' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('investment')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'investment' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('investment')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'researchers' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'researchers' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('researchers')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'researchers' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('researchers')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'patents' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'patents' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('patents')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'patents' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('patents')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] ${activeTab === 'sources' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'sources' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('sources')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'sources' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('sources')}</span>
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Content - con margen superior para evitar que quede debajo de los elementos fijos */}
      <div ref={contentRef} className="pt-32 max-w-7xl mx-auto px-6 pb-6 flex-grow w-full">
        {activeTab === 'overview' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100 min-h-[700px] w-full flex-grow flex flex-col" style={{ width: "100%", minWidth: "100%" }}>
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('overview')}</h2>
            
            {/* Componente de la página Overview */}
            <OverviewPage language={language} />
          </div>
        )}
        
        {activeTab === 'investment' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100 min-h-[700px] w-full flex-grow flex flex-col" style={{ width: "100%", minWidth: "100%" }}>
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('investment')}</h2>
            
            {/* Componente modular para la sección de Inversión */}
            <Investment language={language} />
          </div>
        )}
        
        {activeTab === 'researchers' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100 min-h-[700px] w-full flex-grow flex flex-col" style={{ width: "100%", minWidth: "100%" }}>
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('researchers')}</h2>
            
            {/* Componente de la página Researchers */}
            <Researchers language={language} />
          </div>
        )}
        
        {activeTab === 'patents' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100 min-h-[700px] w-full flex-grow flex flex-col" style={{ width: "100%", minWidth: "100%" }}>
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('patents')}</h2>
            
            {/* Componente de la página Patents */}
            <Patents language={language} />
          </div>
        )}
        
        {activeTab === 'sources' && (
          <div className="bg-white rounded shadow-md p-6 border border-gray-100 min-h-[700px] w-full flex-grow flex flex-col" style={{ width: "100%", minWidth: "100%" }}>
            <h2 className="text-base font-bold mb-4 text-gray-800 border-b pb-2">{t('sources')}</h2>
            
            {/* Componente modular para la sección de Fuentes de Datos */}
            <SourcesSection language={language} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-3 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          {language === 'es' ? 'Desarrollado por EMERGE - Asociación Canaria de Startups' : 'Developed by EMERGE - Canary Islands Startup Association'}
        </div>
      </footer>
    </div>
  );
};

export default App;