const { supabase } = require('./supabase');

// Caché simple para evitar doble cobro por mensajes idénticos en menos de 60 segundos
const responseCache = new Map();
// Limpiar caché cada hora
setInterval(() => responseCache.clear(), 60 * 60 * 1000);

/**
 * Generates a chatbot response using the Gemini REST API for maximum compatibility.
 */
async function generateChatbotResponse(message, systemInstruction, userId = null) {
    const cacheKey = `${userId}-${message}-${systemInstruction.substring(0, 50)}`;
    const now = Date.now();
    
    if (responseCache.has(cacheKey)) {
        const cached = responseCache.get(cacheKey);
        if (now - cached.timestamp < 60000) { // 60 segundos de gracia
            console.log(`[Gemini] Usando respuesta cacheada para ahorrar tokens (User: ${userId})`);
            return cached.text;
        }
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not defined in environment variables.");

        console.log(`--- GENERANDO RESPUESTA NINJA REST (User: ${userId || 'default'}) ---`);
        
        // Usamos la v1beta que es la que soporta system_instruction vía REST
        // Usamos el modelo Flash estándar que es estable y económico
        const model = "gemini-1.5-flash-latest";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const body = {
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: [{
                role: "user",
                parts: [{ text: message }]
            }],
            generationConfig: {
                temperature: 0.2, // Más centrado, menos palabras innecesarias
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 300 // Límite estricto de ahorro: aprox 200-250 palabras máx
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("[Gemini REST API Error]:", data.error);
            throw new Error(data.error.message);
        }

        if (!data.candidates || data.candidates.length === 0) {
            return "Lo siento, mi cerebro se bloqueó un momento. ¿Me puedes repetir la pregunta? 🙏";
        }

        const text = data.candidates[0].content.parts[0].text;

        // Registro de uso en Supabase
        if (userId && userId !== 'default') {
            try {
                await supabase.from('usage_logs').insert({
                    user_id: userId,
                    request_type: 'chat',
                    tokens_input: data.usageMetadata?.promptTokenCount || 0,
                    tokens_output: data.usageMetadata?.candidatesTokenCount || 0
                });
            } catch (e) {
                console.error("Error logging usage:", e.message);
            }
        }

        // Guardar en caché para ahorrar tokens si repiten el mensaje
        responseCache.set(cacheKey, { text, timestamp: Date.now() });

        return text;

    } catch (error) {
        console.error("Gemini Critical Error:", error);
        return "¡Hola! Estamos recibiendo muchos mensajes. ¿Me podrías escribir de nuevo en un momento? 🙏";
    }
}

module.exports = { generateChatbotResponse };
