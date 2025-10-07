import { useState, useEffect, useCallback } from 'react';
import { DEVELOPER_API_KEY } from '../config';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const useApiKey = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isKeyMissing, setIsKeyMissing] = useState(false);

    useEffect(() => {
        try {
            const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
            if (storedKey) {
                setApiKey(storedKey);
                setIsKeyMissing(false);
            } else if (DEVELOPER_API_KEY) {
                setApiKey(DEVELOPER_API_KEY);
                setIsKeyMissing(false);
            } else {
                setApiKey(null);
                setIsKeyMissing(true);
            }
        } catch (error) {
            console.error("Failed to read API key", error);
            setApiKey(null);
            setIsKeyMissing(true);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveApiKey = useCallback((key: string) => {
        try {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
            setApiKey(key);
            setIsKeyMissing(!key);
        } catch (error) {
            console.error("Failed to save API key to localStorage", error);
        }
    }, []);

    const clearApiKey = useCallback(() => {
        try {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
            // Fallback to developer key if it exists, otherwise null
            if (DEVELOPER_API_KEY) {
                setApiKey(DEVELOPER_API_KEY);
                setIsKeyMissing(false);
            } else {
                setApiKey(null);
                setIsKeyMissing(true);
            }
        } catch (error) {
            console.error("Failed to clear API key from localStorage", error);
        }
    }, []);

    return { apiKey, saveApiKey, clearApiKey, isLoaded, isKeyMissing };
};