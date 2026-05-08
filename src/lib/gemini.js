const { GoogleGenAI } = require('@google/genai');
const supabase = require('./supabase');

/**
 * Generates a chatbot response using Gemini 1.5 Flash.
 * @param {string} message - The message context and user input.
 * @param {string} systemInstruction - The expert prompt for the bot.
 * @param {string} userId - Optional userId to track usage in Supabase.
 */
async function generateChatbotResponse(message, systemInstruction, userId = null) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Using gemini-1.5-flash as it's the most cost-effective for production
    const model = ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction 
    });

    console.log(`--- GENERATING RESPONSE WITH GEMINI 1.5 FLASH (User: ${userId || 'anonymous'}) ---`);

    try {
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        // Usage tracking in Supabase
        if (userId && userId !== 'default') {
            try {
                const { error } = await supabase.from('usage_logs').insert({
                    user_id: userId,
                    request_type: 'chat',
                    tokens_input: response.usageMetadata?.promptTokenCount || 0,
                    tokens_output: response.usageMetadata?.candidatesTokenCount || 0
                });
                if (error) console.error("[Supabase Usage Log Error]:", error);
            } catch (logErr) {
                console.error("[Usage Logging Exception]:", logErr);
            }
        }

        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lo siento, experimenté un problema momentáneo procesando el mensaje. ¿Podemos intentar de nuevo en un momento?";
    }
}


async function generateEmbedding(text) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Gemini Embeddings Error:", error);
        throw error;
    }
}

module.exports = {
    generateChatbotResponse,
    generateEmbedding
};

