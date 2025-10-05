import { GoogleGenAI, Chat } from "@google/genai";
import { systemInstructions, Language } from '../i18n/translations';

// Fix: The API key is passed from the environment variable `process.env.API_KEY`.
export const createGeminiChat = (language: Language, apiKey: string): Chat => {
    if (!apiKey) {
        throw new Error("Gemini API key not provided.");
    }
    const ai = new GoogleGenAI({ apiKey });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstructions[language],
        },
    });
};
