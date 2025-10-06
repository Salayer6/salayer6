import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  onClear: () => void;
  currentApiKey: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, onClear, currentApiKey }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
        // We check local storage directly to only show the user's key, not the developer's.
        const userStoredKey = localStorage.getItem('gemini_api_key');
        setInputValue(userStoredKey || '');
    }
  }, [currentApiKey, isOpen]);

  const handleSave = () => {
    onSave(inputValue);
    onClose();
  };

  const handleClear = () => {
    onClear();
    setInputValue('');
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label={t('settings.ariaLabelClose')}
        >
          <svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">{t('settings.title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {t('settings.description')}
        </p>
        
        <div className="mb-4">
            <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('settings.apiKeyLabel')}</label>
            <input
                id="api-key-input"
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="******************"
            />
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('settings.getApiKeyPrompt')}{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline dark:text-indigo-400"
          >
            {t('settings.getApiKeyLink')}
          </a>
        </p>

         <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-3 rounded-r-lg mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300/90">
                {t('settings.privacyNotice')}
            </p>
         </div>
        
        <div className="flex justify-end gap-4">
            <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {t('settings.clear')}
            </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors">
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
