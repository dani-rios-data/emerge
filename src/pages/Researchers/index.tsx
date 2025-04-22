import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Researchers: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{t('researchers')}</h2>
      <p className="mb-6">
        {t('researchersDescription')}
      </p>
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <span className="text-gray-500">{t('chartPlaceholder')} {t('researchers').toLowerCase()}</span>
      </div>
    </div>
  );
};

export default Researchers;