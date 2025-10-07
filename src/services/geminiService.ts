import { GoogleGenAI, Chat } from "@google/genai";
import { systemInstructions, Language } from '../i18n/translations';

// This function now requires an API key to initialize the chat.
export const createGeminiChat = (apiKey: string, language: Language): Chat => {
    // A user-provided API key is used for initialization.
    // This is explicitly requested by the user, acknowledging the security implications.
    const ai = new GoogleGenAI({ apiKey });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstructions[language],
        },
    });
};