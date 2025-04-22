import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TabType } from '../types';

interface NavBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  
  // Esta función ayuda a convertir literales de cadena a TabType de forma segura
  const tabValue = (value: string): TabType => value as TabType;
  
  return (
    <nav className="bg-white rounded-lg shadow-md overflow-hidden">
      <ul className="flex">
        <li 
          className={`cursor-pointer py-4 px-6 text-center flex-1 font-medium transition-colors duration-200 ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="flex items-center justify-center">
            <svg 
              className={`w-5 h-5 mr-2 ${activeTab === 'overview' ? 'text-white' : 'text-gray-800'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <span>{t('overview')}</span>
          </div>
        </li>
        <li 
          className={`cursor-pointer py-4 px-6 text-center flex-1 font-medium transition-colors duration-200 ${
            activeTab === tabValue('investment') ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab(tabValue('investment'))}
        >
          <div className="flex items-center justify-center">
            <svg 
              className={`w-5 h-5 mr-2 ${activeTab === tabValue('investment') ? 'text-white' : 'text-gray-800'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
            </svg>
            <span>{t('investment')}</span>
          </div>
        </li>
        <li 
          className={`cursor-pointer py-4 px-6 text-center flex-1 font-medium transition-colors duration-200 ${
            activeTab === 'researchers' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab('researchers')}
        >
          <div className="flex items-center justify-center">
            <svg 
              className={`w-5 h-5 mr-2 ${activeTab === 'researchers' ? 'text-white' : 'text-gray-800'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <span>{t('researchers')}</span>
          </div>
        </li>
        <li 
          className={`cursor-pointer py-4 px-6 text-center flex-1 font-medium transition-colors duration-200 ${
            activeTab === 'patents' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab('patents')}
        >
          <div className="flex items-center justify-center">
            <svg 
              className={`w-5 h-5 mr-2 ${activeTab === 'patents' ? 'text-white' : 'text-gray-800'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            <span>{t('patents')}</span>
          </div>
        </li>
        <li 
          className={`cursor-pointer py-4 px-6 text-center flex-1 font-medium transition-colors duration-200 ${
            activeTab === tabValue('sources') ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab(tabValue('sources'))}
        >
          <div className="flex items-center justify-center">
            <svg 
              className={`w-5 h-5 mr-2 ${activeTab === tabValue('sources') ? 'text-white' : 'text-gray-800'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 5h-1.5v5.5H11V13h3.5v-1.5h-3.5V9H17V8zm-8 10H7.5v-1.5h-2V9H4v7.5h3.5V18H9v-1.5z" />
            </svg>
            <span>{t('sources')}</span>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;