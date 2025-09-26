// FIX: Replaced invalid file content with a functional React component for Gemini API interaction.
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// As per guidelines, the API key is sourced from environment variables.
// Make sure to set up your environment with the API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Per guidelines, use ai.models.generateContent
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // Per guidelines, access the text directly from the .text property
      setResponse(genAIResponse.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Gemini API React Example</h1>
      <p>Enter a prompt and see what Gemini can do!</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="prompt-input"
        placeholder="e.g., why is the sky blue?"
        aria-label="Prompt input for Gemini API"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="generate-button"
      >
        {loading ? 'Generating...' : 'Generate Content'}
      </button>

      {error && <p className="error-message">Error: {error}</p>}

      {response && (
        <div className="response-container" role="article" aria-label="Gemini API Response">
          <h2>Response:</h2>
          <p className="response-text">{response}</p>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
    console.error("Failed to find the root element");
}