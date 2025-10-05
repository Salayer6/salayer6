import React from 'react';
import ChatPanel from './components/ChatPanel';
import NotesBoard from './components/NotesBoard';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="container mx-auto max-w-screen-2xl h-screen p-4 flex flex-col">
        <header className="flex-shrink-0 flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('app.title')}</h1>
            <ThemeToggle />
        </header>
        <main className="flex-grow min-h-0">
            <div className="flex flex-col lg:flex-row h-full gap-4">
            {/* Chat Panel */}
            <div className="lg:w-1/2 xl:w-1/3 h-[calc(100vh-80px)] lg:h-full min-h-[500px]">
                <ChatPanel />
            </div>

            {/* Notes Board */}
            <div className="lg:w-1/2 xl:w-2/3 h-[calc(100vh-80px)] lg:h-full min-h-[500px]">
                <NotesBoard />
            </div>
            </div>
        </main>
      </div>
      <LanguageToggle />
    </div>
  );
};

export default App;
