import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <button
      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none shadow-sm"
      onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
    >
      {t('changeLanguage')}
    </button>
  );
};

export default LanguageSelector;