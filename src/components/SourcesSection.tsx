import React from 'react';

interface SourcesSectionProps {
  language: 'es' | 'en';
}

const SourcesSection: React.FC<SourcesSectionProps> = ({ language }) => {
  // Textos en español e inglés
  const texts = {
    es: {
      title: "Fuentes de Datos",
      description: "El Observatorio de I+D en Canarias utiliza datos oficiales de diversas fuentes para garantizar la fiabilidad y verificabilidad de la información presentada.",
      europeanInvestment: "Inversión en I+D en Europa",
      europeanInvestmentDesc: "Datos sobre el porcentaje del PIB invertido en actividades de I+D en países europeos.",
      spanishGDP: "Producto Interior Bruto en España",
      spanishGDPDesc: "Datos sobre el PIB en comunidades y ciudades autónomas de España.",
      rdSpending: "Gasto en I+D en España y comunidades autónomas",
      rdSpendingDesc: "Datos sobre el gasto en actividades de I+D por sectores en España y las comunidades autónomas.",
      rdSpendingRecent: "Periodo 2021-2023",
      rdSpendingHistorical: "Datos históricos (2007-2020)",
      europeanResearchers: "Investigadores en Europa",
      europeanResearchersDesc: "Datos sobre el personal dedicado a la investigación en países europeos.",
      spanishResearchers: "Investigadores en España y Canarias",
      spanishResearchersDesc: "Datos sobre el personal dedicado a la investigación en España y sus comunidades autónomas.",
      europeanPatents: "Patentes en Europa",
      europeanPatentsDesc: "Datos sobre las patentes registradas en países europeos.",
      spanishPatents: "Patentes en España",
      spanishPatentsDesc: "Datos sobre la evolución de solicitudes de patentes nacionales en España."
    },
    en: {
      title: "Data Sources",
      description: "The R&D Observatory of the Canary Islands uses official data from various sources to ensure the reliability and verifiability of the information presented.",
      europeanInvestment: "R&D Investment in Europe",
      europeanInvestmentDesc: "Data on the percentage of GDP invested in R&D activities in European countries.",
      spanishGDP: "Gross Domestic Product in Spain",
      spanishGDPDesc: "Data on GDP in Spanish autonomous communities and cities.",
      rdSpending: "R&D Spending in Spain and autonomous communities",
      rdSpendingDesc: "Data on spending on R&D activities by sectors in Spain and the autonomous communities.",
      rdSpendingRecent: "Period 2021-2023",
      rdSpendingHistorical: "Historical data (2007-2020)",
      europeanResearchers: "Researchers in Europe",
      europeanResearchersDesc: "Data on research personnel in European countries.",
      spanishResearchers: "Researchers in Spain and Canary Islands",
      spanishResearchersDesc: "Data on research personnel in Spain and its autonomous communities.",
      europeanPatents: "Patents in Europe",
      europeanPatentsDesc: "Data on registered patents in European countries.",
      spanishPatents: "Patents in Spain",
      spanishPatentsDesc: "Data on the evolution of national patent applications in Spain."
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  // Fuentes de datos
  const sources = [
    {
      id: "eurostat",
      title: t('europeanInvestment'),
      description: t('europeanInvestmentDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/tsc00001/default/table?lang=en",
      organization: "Eurostat",
      logo: "/logos/eurostat.png"
    },
    {
      id: "ine",
      title: t('spanishGDP'),
      description: t('spanishGDPDesc'),
      url: "https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736167628&menu=resultados&idp=1254735576581",
      organization: "INE (Instituto Nacional de Estadística)",
      logo: "/logos/ine.png"
    },
    {
      id: "istac-recent",
      title: `${t('rdSpending')} - ${t('rdSpendingRecent')}`,
      description: t('rdSpendingDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000002&version=~latest#visualization/table",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png"
    },
    {
      id: "istac-historical",
      title: `${t('rdSpending')} - ${t('rdSpendingHistorical')}`,
      description: t('rdSpendingDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000005&version=~latest",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png"
    },
    {
      id: "eurostat-researchers",
      title: t('europeanResearchers'),
      description: t('europeanResearchersDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/tsc00004/default/table?lang=en&category=t_scitech.t_rd",
      organization: "Eurostat",
      logo: "/logos/eurostat.png"
    },
    {
      id: "istac-researchers",
      title: t('spanishResearchers'),
      description: t('spanishResearchersDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000001&version=~latest#visualization/table",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png"
    },
    {
      id: "eurostat-patents",
      title: t('europeanPatents'),
      description: t('europeanPatentsDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/sdg_09_40/default/table?lang=en",
      organization: "Eurostat",
      logo: "/logos/eurostat.png"
    },
    {
      id: "oepm-patents",
      title: t('spanishPatents'),
      description: t('spanishPatentsDesc'),
      url: "https://www.oepm.es/es/sobre-OEPM/estadisticas/graficos-evolucion-mensual-de-solicitudes-nacionales/graficos-de-evolucion-de-patentes/",
      organization: "OEPM (Oficina Española de Patentes y Marcas)",
      logo: "/logos/oepm.png"
    }
  ];

  return (
    <div className="space-y-6 w-full min-h-[700px]">
      {/* Introducción */}
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 w-full">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">{t('description')}</p>
        </div>
      </div>

      {/* Lista de fuentes */}
      <div className="space-y-4 w-full">
        {sources.map(source => (
          <div 
            key={source.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all hover:shadow-lg w-full"
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <h4 className="text-lg font-bold text-gray-800 mb-2">{source.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">{source.organization}</span>
                </p>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-dashboard-primary hover:underline inline-flex items-center"
                >
                  {language === 'es' ? 'Acceder a los datos' : 'Access data'}
                  <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nota de atribución */}
      <div className="text-right w-full">
        <p className="text-xs text-gray-500 italic">
          {language === 'es' 
            ? 'Todos los datos utilizados en este observatorio son de acceso público y han sido obtenidos de fuentes oficiales.'
            : 'All data used in this observatory are publicly accessible and have been obtained from official sources.'}
        </p>
      </div>
    </div>
  );
};

export default SourcesSection; 