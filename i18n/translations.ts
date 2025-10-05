export const translations = {
  en: {
    app: {
      title: 'Study Hub',
    },
    chat: {
      agentName: 'Gems Agent',
      welcomeMessage: "Hello! I'm your study assistant. What topic from the diploma can I help you with today?",
      inputPlaceholder: 'Type your question here...',
      errorMessage: 'Sorry, an error occurred while processing your request.',
      ariaLabelSendMessage: 'Send message'
    },
    board: {
      title: 'Notes Board',
      pasteArea: 'PASTE IMAGE OR TEXT',
      exportButtonAria: 'Export board as SVG',
      helpButtonAria: 'Help',
      changeColorAria: 'Change color',
      deleteNoteAria: 'Delete note',
    },
    helpModal: {
      title: 'Welcome to Study Hub!',
      intro: "This is your personal space to learn and organize your ideas. Here's a quick guide:",
      chatTitle: 'Gems Agent (Chat)',
      chatDesc: 'Use the chat panel to ask questions about your course material. The AI assistant is specialized in adult learning and can provide clear explanations and practical examples.',
      boardTitle: 'Notes Board',
      boardWarningTitle: '⚠️ Important: Data is Not Saved!',
      boardWarningDesc: 'Your notes and connections are temporary and exist only in this browser tab. If you close or refresh the tab, your work will be lost. Make sure to export your board as an SVG image to save it.',
      howToPasteTitle: 'How to Copy and Paste',
      howToPasteDesc: "If you're new to this, 'pasting' is how you add content. Here's how:",
      howToPasteStep1: 'Find text or an image you want to save (on a website, in a document, etc.).',
      howToPasteStep2: 'Select it, then right-click and choose "Copy". Or, press Ctrl+C (on Windows) or ⌘+C (on Mac).',
      howToPasteStep3: 'Come back here, click the "PASTE IMAGE OR TEXT" area, then right-click and choose "Paste". Or, press Ctrl+V or ⌘+V.',
      close: 'Close',
      ariaLabelClose: 'Close help modal',
    },
    theme: {
      toggle: 'Switch to {theme} mode',
    },
    language: {
      toggle: 'Switch Language'
    }
  },
  es: {
    app: {
      title: 'Study Hub',
    },
    chat: {
      agentName: 'Gems Agent',
      welcomeMessage: '¡Hola! Soy tu asistente de estudio. ¿En qué tema del diplomado puedo ayudarte hoy?',
      inputPlaceholder: 'Escribe tu pregunta aquí...',
      errorMessage: 'Lo siento, ocurrió un error al procesar tu solicitud.',
      ariaLabelSendMessage: 'Enviar mensaje'
    },
    board: {
      title: 'Tablero de Notas',
      pasteArea: 'PEGA IMAGEN O TEXTO',
      exportButtonAria: 'Exportar tablero como SVG',
      helpButtonAria: 'Ayuda',
      changeColorAria: 'Cambiar color',
      deleteNoteAria: 'Eliminar nota',
    },
    helpModal: {
      title: '¡Bienvenido a Study Hub!',
      intro: 'Este es tu espacio personal para aprender y organizar tus ideas. Aquí tienes una guía rápida:',
      chatTitle: 'Gems Agent (Chat)',
      chatDesc: 'Usa el panel de chat para hacer preguntas sobre el material de tu curso. El asistente de IA está especializado en andragogía y puede proporcionar explicaciones claras y ejemplos prácticos.',
      boardWarningTitle: '⚠️ ¡Importante: Los Datos no se Guardan!',
      boardWarningDesc: 'Tus notas y conexiones son temporales y solo existen en esta pestaña del navegador. Si cierras o refrescas la pestaña, tu trabajo se perderá. Asegúrate de exportar tu tablero como imagen SVG para guardarlo.',
      howToPasteTitle: 'Cómo Copiar y Pegar',
      howToPasteDesc: "Si esto es nuevo para ti, 'pegar' es la forma de añadir contenido. Así se hace:",
      howToPasteStep1: 'Encuentra el texto o la imagen que quieres guardar (en una web, un documento, etc.).',
      howToPasteStep2: 'Selecciónalo, luego haz clic derecho y elige "Copiar". O presiona Ctrl+C (en Windows) o ⌘+C (en Mac).',
      howToPasteStep3: 'Vuelve aquí, haz clic en el área "PEGA IMAGEN O TEXTO", luego haz clic derecho y elige "Pegar". O presiona Ctrl+V o ⌘+V.',
      close: 'Cerrar',
      ariaLabelClose: 'Cerrar modal de ayuda',
    },
    theme: {
      toggle: 'Cambiar a modo {theme}',
    },
    language: {
      toggle: 'Cambiar Idioma'
    }
  }
};

export const systemInstructions = {
  en: `You are an AI assistant specializing in andragogy and instructional design. Your purpose is to help students of the 'Diploma in Methodological and Evaluative Strategies for Adult Labor Training'. Provide clear explanations, practical examples, and encourage reflection on the course topics. Always respond in English. Be friendly, professional, and encouraging.`,
  es: `Eres un asistente de IA especializado en andragogía y diseño instruccional. Tu propósito es ayudar a estudiantes del 'Diplomado de estrategias metodológicas y evaluativas para la formación de adultos laborales'. Proporciona explicaciones claras, ejemplos prácticos y fomenta la reflexión sobre los temas del curso. Responde siempre en español. Sé amable, profesional y alentador.`
};

export type Language = keyof typeof translations;
