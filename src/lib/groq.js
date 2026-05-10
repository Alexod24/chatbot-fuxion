require('dotenv').config();
/**
 * Generates a chatbot response using the Groq API.
 * High performance, low latency.
 */
async function generateGroqResponse(history, systemInstruction, userId = null) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("GROQ_API_KEY is not defined.");

        console.log(`--- GENERANDO RESPUESTA GROQ (User: ${userId || 'default'}) ---`);
        
        const url = "https://api.groq.com/openai/v1/chat/completions";

        const body = {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemInstruction },
                ...history
            ],
            temperature: 0.2,
            max_tokens: 300
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("[Groq API Error]:", data.error);
            throw new Error(data.error.message);
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error("Groq Critical Error:", error);
        return "¡Hola! Estamos afinando el motor de respuesta. ¿Me escribes de nuevo? 🙏";
    }
}

module.exports = { generateGroqResponse };
