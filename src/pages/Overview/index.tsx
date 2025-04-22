import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Overview: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{t('overview')}</h2>
      <p className="mb-4">
        {t('overviewDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold">{t('gdp')}</h3> {/* Cambiado de investment a gdp */}
          <p className="text-sm mt-2">
            {t('gdpDescription')}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold">{t('researchers')}</h3>
          <p className="text-sm mt-2">
            {t('researchersDescription')}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold">{t('patents')}</h3>
          <p className="text-sm mt-2">
            {t('patentsDescription')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Overview;