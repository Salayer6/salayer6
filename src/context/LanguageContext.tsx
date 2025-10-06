import React, { createContext, useState, useEffect, useCallback } from 'react';
import { translations, Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, key: string) => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const initialLang = browserLang === 'es' ? 'es' : 'en';
    setLanguage(initialLang);
  }, []);

  const t = useCallback((key: string, replacements: Record<string, string> = {}): string => {
    let translation = getNestedValue(translations[language], key) || key;
    
    Object.keys(replacements).forEach(placeholder => {
        const value = replacements[placeholder];
        translation = translation.replace(`{${placeholder}}`, value);
    });

    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
