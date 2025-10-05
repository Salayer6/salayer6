import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import NotesBoard from './components/NotesBoard';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import SettingsModal from './components/SettingsModal';
import SettingsIcon from './components/icons/SettingsIcon';
import { useApiKey } from './hooks/useApiKey';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const defaultApiKey = process.env.API_KEY || '';
  const { apiKey: userApiKey, saveApiKey, clearApiKey, isLoaded } = useApiKey();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [effectiveApiKey, setEffectiveApiKey] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    // Determine the API key to use once the user's key is loaded from storage.
    if (isLoaded) {
      setEffectiveApiKey(userApiKey || defaultApiKey);
    }
  }, [userApiKey, defaultApiKey, isLoaded]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <header className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold pl-2">Study Hub</h1>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label={t('settings.open')}
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-hidden">
        <div className="md:col-span-1 h-full min-h-0">
          <ChatPanel apiKey={effectiveApiKey} />
        </div>
        <div className="md:col-span-2 h-full min-h-0">
          <NotesBoard />
        </div>
      </main>

      <LanguageToggle />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={saveApiKey}
        onClear={clearApiKey}
        currentApiKey={userApiKey}
      />
    </div>
  );
};

export default App;