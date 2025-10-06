export type Language = 'en' | 'es';

export const systemInstructions: Record<Language, string> = {
    en: "You are an AI assistant for a mind-mapping and study application called Study Hub. Your goal is to help users brainstorm, organize their thoughts, and understand complex topics. When a user asks a question, provide a concise and clear explanation that can be easily broken down into smaller, connected ideas, suitable for creating mind map notes. Respond in the user's language.",
    es: "Eres un asistente de IA para una aplicación de mapas mentales y estudio llamada Study Hub. Tu objetivo es ayudar a los usuarios a hacer una lluvia de ideas, organizar sus pensamientos y comprender temas complejos. Cuando un usuario haga una pregunta, proporciona una explicación concisa y clara que se pueda desglosar fácilmente en ideas más pequeñas y conectadas, adecuadas para crear notas de mapa mental. Responde en el idioma del usuario.",
};

export const translations: Record<Language, any> = {
    en: {
        chat: {
            welcomeMessage: "Hello! I'm your Study Hub assistant. How can I help you brainstorm today?",
            apiKeyError: "Please set your API key in the settings to start chatting.",
            initError: "Chat service could not be initialized. Please check your API key and try again.",
            errorMessage: "Sorry, something went wrong. Please try again.",
            agentName: "Study Assistant",
            inputPlaceholder: "Ask me anything...",
            ariaLabelSendMessage: "Send message",
        },
        board: {
            title: "Notes Board",
            exportButtonAria: "Export board as SVG",
            helpButtonAria: "Open help modal",
            pasteArea: "Paste text or an image here (Ctrl+V)",
            deleteNoteAria: "Delete note",
        },
        theme: {
            toggle: "Toggle {theme} mode",
        },
        language: {
            toggle: "Switch to Spanish",
        },
        settings: {
            title: "Settings",
            description: "Please enter your Gemini API key to use the chat assistant. Your key is stored securely in your browser's local storage and is never sent to our servers.",
            apiKeyLabel: "Gemini API Key",
            getApiKeyPrompt: "You can get your key from",
            getApiKeyLink: "Google AI Studio.",
            privacyNotice: "Your API key is saved locally and is only used to communicate with the Google Gemini API.",
            save: "Save",
            clear: "Clear Key",
            ariaLabelOpen: "Open settings",
            ariaLabelClose: "Close settings",
        },
        helpModal: {
            ariaLabelClose: "Close help modal",
            title: "How to Use Study Hub",
            intro: "Welcome to Study Hub! This is a simple tool to help you visually organize your ideas using a chat assistant and a notes board.",
            boardWarningTitle: "Important: Local Storage",
            boardWarningDesc: "Your notes and connections are saved in your browser's local storage. They are not backed up online. Clearing your browser data will erase your work.",
            chatTitle: "The Chat Assistant",
            chatDesc: "Use the chat panel to ask questions or brainstorm ideas. The assistant is designed to give you concise answers that you can easily turn into notes.",
            boardTitle: "The Notes Board",
            howToPasteTitle: "Pasting Notes",
            howToPasteDesc: "You can easily add content to your board by pasting it.",
            howToPasteStep1: "Copy any text or an image to your clipboard.",
            howToPasteStep2: "Click anywhere on the notes board area to focus it.",
            howToPasteStep3: "Press Ctrl+V (or Cmd+V on Mac) to paste the content as a new note.",
            close: "Got it!",
        }
    },
    es: {
        chat: {
            welcomeMessage: "¡Hola! Soy tu asistente de Study Hub. ¿Cómo puedo ayudarte a generar ideas hoy?",
            apiKeyError: "Por favor, introduce tu clave de API en la configuración para empezar a chatear.",
            initError: "No se pudo inicializar el servicio de chat. Por favor, revisa tu clave de API e inténtalo de nuevo.",
            errorMessage: "Lo siento, algo salió mal. Por favor, inténtalo de nuevo.",
            agentName: "Asistente de Estudio",
            inputPlaceholder: "Pregúntame lo que sea...",
            ariaLabelSendMessage: "Enviar mensaje",
        },
        board: {
            title: "Tablero de Notas",
            exportButtonAria: "Exportar tablero como SVG",
            helpButtonAria: "Abrir modal de ayuda",
            pasteArea: "Pega texto o una imagen aquí (Ctrl+V)",
            deleteNoteAria: "Eliminar nota",
        },
        theme: {
            toggle: "Cambiar a modo {theme}",
        },
        language: {
            toggle: "Cambiar a Inglés",
        },
        settings: {
            title: "Configuración",
            description: "Por favor, introduce tu clave de API de Gemini para usar el asistente de chat. Tu clave se guarda de forma segura en el almacenamiento local de tu navegador y nunca se envía a nuestros servidores.",
            apiKeyLabel: "Clave de API de Gemini",
            getApiKeyPrompt: "Puedes obtener tu clave desde",
            getApiKeyLink: "Google AI Studio.",
            privacyNotice: "Tu clave de API se guarda localmente y solo se utiliza para comunicarse con la API de Google Gemini.",
            save: "Guardar",
            clear: "Limpiar Clave",
            ariaLabelOpen: "Abrir configuración",
            ariaLabelClose: "Cerrar configuración",
        },
        helpModal: {
            ariaLabelClose: "Cerrar modal de ayuda",
            title: "Cómo Usar Study Hub",
            intro: "¡Bienvenido a Study Hub! Esta es una herramienta sencilla para ayudarte a organizar visualmente tus ideas usando un asistente de chat y un tablero de notas.",
            boardWarningTitle: "Importante: Almacenamiento Local",
            boardWarningDesc: "Tus notas y conexiones se guardan en el almacenamiento local de tu navegador. No se respaldan en línea. Limpiar los datos de tu navegador borrará tu trabajo.",
            chatTitle: "El Asistente de Chat",
            chatDesc: "Usa el panel de chat para hacer preguntas o generar ideas. El asistente está diseñado para darte respuestas concisas que puedes convertir fácilmente en notas.",
            boardTitle: "El Tablero de Notas",
            howToPasteTitle: "Pegar Notas",
            howToPasteDesc: "Puedes añadir contenido fácilmente a tu tablero pegándolo.",
            howToPasteStep1: "Copia cualquier texto o imagen a tu portapapeles.",
            howToPasteStep2: "Haz clic en cualquier parte del área del tablero de notas para enfocarlo.",
            howToPasteStep3: "Presiona Ctrl+V (o Cmd+V en Mac) para pegar el contenido como una nueva nota.",
            close: "¡Entendido!",
        }
    }
};
