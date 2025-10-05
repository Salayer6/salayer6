import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { createGeminiChat } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';
import type { Chat } from '@google/genai';
import SendIcon from './icons/SendIcon';
import SparklesIcon from './icons/SparklesIcon';

// Fix: Removed `onOpenSettings` from props to align with API key handling guidelines.
interface ChatPanelProps {
  apiKey: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ apiKey }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // This will throw an error if the API key is missing, which is caught below.
      chatRef.current = createGeminiChat(language, apiKey);
      setMessages([{ role: 'model', text: t('chat.welcomeMessage') }]);
    } catch (error) {
      console.error("Failed to initialize Gemini chat:", error);
      chatRef.current = null; // Ensure chat is not usable
      setMessages([{ role: 'model', text: t('chat.apiKeyError') }]);
    }
  }, [language, apiKey, t]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
        const stream = await chatRef.current.sendMessageStream({ message: userInput });
        
        let modelResponse = '';
        setMessages((prev) => [...prev, { role: 'model', text: '...' }]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                   newMessages[newMessages.length - 1].text = modelResponse;
                }
                return newMessages;
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [...prev, { role: 'model', text: t('chat.errorMessage') }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-lg rounded-lg">
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-3">
        <SparklesIcon className="w-6 h-6 text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('chat.agentName')}</h2>
      </header>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                <SparklesIcon className="w-5 h-5" />
              </div>
            )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div className="max-w-md p-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-75"></span>
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSendMessage}>
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('chat.inputPlaceholder')}
              className="w-full pl-4 pr-12 py-2 border border-slate-300 dark:border-slate-600 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={isLoading || !apiKey}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim() || !apiKey}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              aria-label={t('chat.ariaLabelSendMessage')}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
        {/* Fix: Removed settings button to adhere to API key guidelines. */}
      </div>
    </div>
  );
};

export default ChatPanel;