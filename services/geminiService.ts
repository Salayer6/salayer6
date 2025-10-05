import { GoogleGenAI, Chat } from "@google/genai";
import { systemInstructions, Language } from '../i18n/translations';

// --- IMPORTANT! ---
// The Gemini API Key is retrieved from an environment variable named `API_KEY`.
// This is a security best practice to avoid exposing sensitive keys in the source code.
// Ensure the `API_KEY` environment variable is set in your deployment environment.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please set it to your Gemini API key.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createGeminiChat = (language: Language): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstructions[language],
        },
    });
};
