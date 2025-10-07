import React, { useState, lazy, Suspense, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import NotesBoard from './components/NotesBoard';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import { useApiKey } from './hooks/useApiKey';
import SettingsIcon from './components/icons/SettingsIcon';
import { useTranslation } from './hooks/useTranslation';

const SettingsModal = lazy(() => import('./components/SettingsModal'));

const App: React.FC = () => {
  const { apiKey, saveApiKey, clearApiKey, isLoaded, isKeyMissing } = useApiKey();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoaded && isKeyMissing) {
      // Use a timeout to ensure the alert doesn't block the initial render
      setTimeout(() => {
        alert(t('settings.forceSettingsOpen'));
        setIsSettingsModalOpen(true);
      }, 100);
    }
  }, [isLoaded, isKeyMissing, t]);

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
              aria-label={t('settings.ariaLabelOpen')}
          >
              <SettingsIcon className="w-6 h-6" />
          </button>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-hidden">
        <div className="md:col-span-1 h-full min-h-0">
          {isLoaded ? (
            <ChatPanel apiKey={apiKey} />
          ) : (
            <div className="flex items-center justify-center h-full bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <p className="text-slate-500">Loading...</p>
            </div>
          )}
        </div>
        <div className="md:col-span-2 h-full min-h-0">
          <NotesBoard />
        </div>
      </main>

      <LanguageToggle />

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={saveApiKey}
          onClear={clearApiKey}
          currentApiKey={apiKey}
        />
      </Suspense>
      
    </div>
  );
};

export default App;