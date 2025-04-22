import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white py-6 px-4 shadow-md z-50">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800">{t('title')}</h1>
        <p className="text-xl mt-3 text-gray-600">{t('subtitle')}</p>
        <p className="mt-2 text-blue-600">{t('developedFor')}</p>
      </div>
    </header>
  );
};

export default Header;