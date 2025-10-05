import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9Z" />
  </svg>
);

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative m-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label={t('helpModal.ariaLabelClose')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">{t('helpModal.title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {t('helpModal.intro')}
        </p>

        <div className="space-y-6">
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg">
            <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-300">{t('helpModal.boardWarningTitle')}</h3>
            <p className="text-yellow-700 dark:text-yellow-300/80">
                {t('helpModal.boardWarningDesc')}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <SparklesIcon className="w-5 h-5 text-indigo-500" />
              {t('helpModal.chatTitle')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('helpModal.chatDesc')}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">
             {t('helpModal.boardTitle')}
            </h3>
             <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('helpModal.howToPasteTitle')}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{t('helpModal.howToPasteDesc')}</p>
                 <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li>{t('helpModal.howToPasteStep1')}</li>
                    <li>{t('helpModal.howToPasteStep2')}</li>
                    <li>{t('helpModal.howToPasteStep3')}</li>
                </ol>
             </div>
          </div>
        </div>
         <div className="mt-6 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors">
                {t('helpModal.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;