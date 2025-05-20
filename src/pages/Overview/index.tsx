import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface OverviewProps {
  language?: 'es' | 'en';
}

const Overview: React.FC<OverviewProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-5 mt-2 text-blue-800 pb-3 border-b border-blue-100 flex items-center">
      <span className="inline-block w-2 h-8 bg-blue-600 rounded-sm mr-3"></span>
      {title}
    </h2>
  );

  // Objeto de textos para manejar la traducción
  const texts = {
    es: {
      pageTitle: "Reporte de Métricas de I+D para EMERGE",
      aboutEmerge: "Sobre EMERGE",
      emergeDescription1: "La Asociación Canaria de Startups, Empresas de Base Tecnológica e Inversores Ángeles (EMERGE) es una organización sin ánimo de lucro constituida en marzo de 2015 por iniciativa de emprendedores tecnológicos canarios. EMERGE tiene como objetivo primordial la creación de empresas innovadoras de base tecnológica de rápido crecimiento o startups.",
      emergeDescription2: "EMERGE es un agente facilitador del ecosistema de emprendimiento e innovación de Canarias que trabaja hacia un modelo de desarrollo económico sostenible e inclusivo basado en el talento, en la diversificación de recursos y en las oportunidades que ofrece la economía del conocimiento.",
      emergeTeam: "La organización está compuesta por una Junta Directiva formada por empresas o emprendedores de base tecnológica e inversores ángeles, y un equipo técnico encargado de la gestión diaria de la Asociación y de los proyectos que desarrolla, compuesto por un Director-Gerente, Responsable de Innovación y Responsable de Administración. EMERGE dispone además de un equipo de voluntarios especializado en distintas áreas (Digital Economy, Talent & International Networks; Innovation, Technology and Environment; Global Business, Entrepreneurship, Programming) y una extensa red internacional de mentores y expertos que colaboran de forma activa en los proyectos.",
      emergeSpaces: "EMERGE gestiona dos espacios de innovación de referencia en Las Palmas de Gran Canaria:",
      marineTitle: "Marine Park:",
      marineDesc: "Orientado a tecnologías marinas y marítimas, ubicado en la Playa de las Alcaravaneras tras la cesión de un local por parte del Ayuntamiento de Las Palmas GC.",
      paletexpressTitle: "Paletexpress-Cajasiete:",
      paletexpressDesc: "Marca refundada tras la reapertura de Paletexpress en las instalaciones de la Sociedad para el Desarrollo Económico de Canarias (SODECAN) del Gobierno de Canarias con el patrocinio de la institución financiera Cajasiete.",
      emergeObjectives: "Los objetivos de la Asociación están ligados a la creación de un tejido productivo competitivo y a la atracción de inversión y talento a las islas, en colaboración con instituciones públicas y privadas, pero siempre con el emprendedor en el centro de la acción. EMERGE está fuertemente comprometida con el desarrollo económico e inclusivo de la región y con los Objetivos de Desarrollo Sostenible de Naciones Unidas.",
      reportPurpose: "Propósito de este Reporte",
      purposeDescription1: "Este reporte presenta una visión detallada del panorama de Investigación y Desarrollo (I+D) en las Islas Canarias, en comparación con otras regiones españolas y países de la Unión Europea.",
      purposeDescription2: "A través de datos actualizados y visualizaciones comparativas, este documento pretende:",
      purposeList1: "Mostrar la posición actual de Canarias en el contexto nacional y europeo en materia de I+D",
      purposeList2: "Proporcionar información objetiva para la toma de decisiones estratégicas",
      purposeList3: "Identificar tendencias y patrones en los indicadores de innovación relevantes",
      purposeList4: "Facilitar el seguimiento de la evolución de estos indicadores a lo largo del tiempo",
      reportContent: "Contenido del Reporte",
      contentDescription: "La información que se puede encontrar en este reporte se estructura en torno a tres ejes fundamentales de la actividad de I+D:",
      investmentTitle: "Inversión en I+D como porcentaje del PIB",
      investmentDescription: "Aquí se analiza qué porcentaje del Producto Interior Bruto se dedica a actividades de investigación y desarrollo, tanto en el sector público como en el privado. Es posible observar la evolución de este indicador a lo largo del tiempo y comparar la situación de Canarias con otras regiones españolas y países europeos, identificando brechas y oportunidades.",
      researchersTitle: "Actividad investigadora",
      researchersDescription: "Esta sección examina el capital humano dedicado a la investigación, mostrando datos sobre el número de investigadores activos en diferentes años, su distribución entre el sector público y privado, y comparativas con otras regiones y países. Los indicadores incluyen tanto valores absolutos como relativos a la población, ofreciendo una visión completa de la capacidad investigadora del territorio.",
      patentsTitle: "Producción de patentes",
      patentsDescription: "Como indicador de resultados de la actividad innovadora, se presenta la evolución del registro de patentes, con análisis por sectores y comparativas territoriales. Estos datos permiten evaluar la capacidad de transformar la inversión en I+D en propiedad intelectual e industrial con potencial comercial.",
      additionalFeatures: "Para facilitar la exploración de estos datos, el reporte ofrece opciones para personalizar la visualización mediante filtros de selección de territorios, rangos temporales y cambio de idioma entre español e inglés. Todas las visualizaciones son interactivas, permitiendo profundizar en los aspectos de mayor interés.",
      updateInfo: "La información presentada se actualiza periódicamente para mantener la relevancia y precisión de los análisis ofrecidos."
    },
    en: {
      pageTitle: "R&D Metrics Report for EMERGE",
      aboutEmerge: "About EMERGE",
      emergeDescription1: "The Canary Islands Association of Startups, Technology-Based Companies and Angel Investors (EMERGE) is a non-profit organization established in March 2015 by Canarian technology entrepreneurs. EMERGE's primary objective is the creation of fast-growing innovative technology-based companies or startups.",
      emergeDescription2: "EMERGE is a facilitating agent of the Canary Islands' entrepreneurship and innovation ecosystem that works towards a sustainable and inclusive economic development model based on talent, resource diversification, and the opportunities offered by the knowledge economy.",
      emergeTeam: "The organization consists of a Board of Directors formed by technology-based companies or entrepreneurs and angel investors, and a technical team responsible for the daily management of the Association and the projects it develops, composed of a Director-Manager, Head of Innovation, and Head of Administration. EMERGE also has a team of volunteers specialized in different areas (Digital Economy, Talent & International Networks; Innovation, Technology and Environment; Global Business, Entrepreneurship, Programming) and an extensive international network of mentors and experts who actively collaborate on projects.",
      emergeSpaces: "EMERGE manages two leading innovation spaces in Las Palmas de Gran Canaria:",
      marineTitle: "Marine Park:",
      marineDesc: "Focused on marine and maritime technologies, located at Las Alcaravaneras Beach after the assignment of premises by the Las Palmas GC City Council.",
      paletexpressTitle: "Paletexpress-Cajasiete:",
      paletexpressDesc: "Brand refounded after the reopening of Paletexpress in the facilities of the Society for the Economic Development of the Canary Islands (SODECAN) of the Canary Islands Government with the sponsorship of the financial institution Cajasiete.",
      emergeObjectives: "The Association's objectives are linked to creating a competitive productive fabric and attracting investment and talent to the islands, in collaboration with public and private institutions, but always with the entrepreneur at the center of the action. EMERGE is strongly committed to the economic and inclusive development of the region and to the United Nations Sustainable Development Goals.",
      reportPurpose: "Purpose of this Report",
      purposeDescription1: "This report presents a detailed view of the Research and Development (R&D) landscape in the Canary Islands, compared to other Spanish regions and European Union countries.",
      purposeDescription2: "Through updated data and comparative visualizations, this document aims to:",
      purposeList1: "Show the current position of the Canary Islands in the national and European context regarding R&D",
      purposeList2: "Provide objective information for strategic decision-making",
      purposeList3: "Identify trends and patterns in relevant innovation indicators",
      purposeList4: "Facilitate the monitoring of these indicators' evolution over time",
      reportContent: "Report Contents",
      contentDescription: "The information found in this report is structured around three fundamental axes of R&D activity:",
      investmentTitle: "R&D Investment as a percentage of GDP",
      investmentDescription: "This section analyzes what percentage of the Gross Domestic Product is dedicated to research and development activities, both in the public and private sectors. It is possible to observe the evolution of this indicator over time and compare the situation of the Canary Islands with other Spanish regions and European countries, identifying gaps and opportunities.",
      researchersTitle: "Research Activity",
      researchersDescription: "This section examines the human capital dedicated to research, showing data on the number of active researchers in different years, their distribution between the public and private sectors, and comparisons with other regions and countries. The indicators include both absolute and relative values to the population, offering a complete view of the territory's research capacity.",
      patentsTitle: "Patent Production",
      patentsDescription: "As an indicator of the results of innovative activity, the evolution of patent registration is presented, with analysis by sectors and territorial comparisons. These data allow the evaluation of the capacity to transform R&D investment into intellectual and industrial property with commercial potential.",
      additionalFeatures: "To facilitate the exploration of these data, the report offers options to customize the visualization through filters for territory selection, time ranges, and language change between Spanish and English. All visualizations are interactive, allowing users to explore aspects of greater interest.",
      updateInfo: "The presented information is periodically updated to maintain the relevance and accuracy of the analyses offered."
    }
  };

  // Acceso a los textos según el idioma
  const t = (key: keyof typeof texts.es) => {
    if (language === 'es') {
      return texts.es[key];
    }
    return texts.en[key];
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 pt-4 pb-8 w-full min-h-[700px] overflow-y-auto">
      {/* Contenedor principal con efecto de tarjeta */}
      <div className="max-w-full mx-auto">
        {/* Sección Sobre EMERGE con diseño moderno */}
        <div className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-blue-200">
          <SectionTitle title={t('aboutEmerge')} />
          
          <div className="prose prose-blue max-w-none">
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">{t('emergeDescription1')}</p>
              <p>{t('emergeDescription2')}</p>
            </div>
            
            <div className="mb-4 text-gray-700 leading-relaxed">
              <p className="mb-4">{t('emergeTeam')}</p>
              <div className="flex items-center my-3 text-blue-800">
                <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                <span className="font-semibold">{t('emergeSpaces')}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4">
            <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
              <div className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {t('marineTitle')}
              </div>
              <p className="text-gray-700">{t('marineDesc')}</p>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
              <div className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2H4v-1h16v1h-1z" clipRule="evenodd" />
                </svg>
                {t('paletexpressTitle')}
              </div>
              <p className="text-gray-700">{t('paletexpressDesc')}</p>
            </div>
          </div>
          
          <div className="mt-4 mb-2 text-gray-700 leading-relaxed">
            <p>{t('emergeObjectives')}</p>
          </div>
        </div>

        {/* Propósito del reporte con efectos visuales */}
        <div className="mb-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -z-10 opacity-70 blur-2xl"></div>
          <SectionTitle title={t('reportPurpose')} />
          
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <p className="mb-4 text-gray-700 leading-relaxed">{t('purposeDescription1')}</p>
            <p className="mb-5 text-gray-700 leading-relaxed">{t('purposeDescription2')}</p>
            
            <ul className="space-y-3 text-gray-700 mb-4">
              {[
                t('purposeList1'),
                t('purposeList2'),
                t('purposeList3'),
                t('purposeList4')
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 flex h-6 items-center">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span className="ml-3">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contenido del reporte con diseño de tarjetas */}
        <div className="mb-4 relative">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full -z-10 opacity-70 blur-2xl"></div>
          <SectionTitle title={t('reportContent')} />
          
          <div className="mb-5 p-5 bg-white rounded-lg shadow-sm border border-blue-100">
            <p className="mb-6 text-gray-700 leading-relaxed">{t('contentDescription')}</p>
            
            <div className="space-y-8">
              {/* Inversión en I+D Card */}
              <div className="group p-0 rounded-xl shadow-sm overflow-hidden border border-blue-100 transition-all hover:shadow-md">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('investmentTitle')}
                  </h3>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-gray-700 leading-relaxed">{t('investmentDescription')}</p>
                </div>
              </div>
              
              {/* Actividad investigadora Card */}
              <div className="group p-0 rounded-xl shadow-sm overflow-hidden border border-blue-100 transition-all hover:shadow-md">
                <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('researchersTitle')}
                  </h3>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-gray-700 leading-relaxed">{t('researchersDescription')}</p>
                </div>
              </div>
              
              {/* Producción de patentes Card */}
              <div className="group p-0 rounded-xl shadow-sm overflow-hidden border border-blue-100 transition-all hover:shadow-md">
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-5 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('patentsTitle')}
                  </h3>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-gray-700 leading-relaxed">{t('patentsDescription')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-inner">
            <div className="flex items-start mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-700">{t('additionalFeatures')}</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-gray-700">{t('updateInfo')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;