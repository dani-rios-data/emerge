import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const HeaderMain: React.FC = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white py-6 px-4 shadow-md z-50">
      <div className="max-w-6xl mx-auto text-center relative">
        {/* Selector de idioma */}
        <div className="absolute top-0 right-0">
          <button
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none shadow-sm"
            onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
          >
            {language === 'es' ? 'ES' : 'EN'}
          </button>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800">{t('app.title')}</h1>
        <p className="text-xl mt-3 text-gray-600">{t('app.subtitle')}</p>
        <p className="mt-2 text-blue-600">{t('app.developedFor')}</p>
      </div>
    </header>
  );
};

export default HeaderMain; 