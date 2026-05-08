const { GoogleGenAI } = require('@google/genai');

// Ensure GEMINI_API_KEY is available in the environment scope
async function generateChatbotResponse(message, contextData) {
    // Initialize inside the function so it always uses the latest GEMINI_API_KEY from .env
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemInstruction = contextData; 
    console.log("--- GENERATING RESPONSE WITH GEMINI 2.5 FLASH LITE ---");

    try {
        const response = await ai.models.generateContent({
            model: 'models/gemini-2.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: message }] }],
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lo siento, experimenté un problema momentáneo procesando el mensaje. ¿Podemos intentar de nuevo en un momento?";
    }
}

async function generateEmbedding(text) {
    try {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
        });

        return response.embeddings[0].values;
    } catch (error) {
        console.error("Gemini Embeddings Error:", error);
        throw error;
    }
}

module.exports = {
    generateChatbotResponse,
    generateEmbedding
};
