import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleLanguage}
        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-xs font-bold uppercase"
        aria-label={t('language.toggle')}
      >
        {language === 'en' ? 'es' : 'en'}
      </button>
    </div>
  );
};

export default LanguageToggle;
