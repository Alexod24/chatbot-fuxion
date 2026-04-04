const { GoogleGenAI } = require('@google/genai');

// Ensure GEMINI_API_KEY is available in the environment scope
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateChatbotResponse(message, contextData) {
    const systemInstruction = `Eres un asesor de bienestar Fuxion. Tu objetivo es guiar una venta de forma empática, amable y cero agresiva. Eres un amigo recomendando una solución.
Basate ÚNICAMENTE en este contexto y catálogo para operar:
${contextData}

Flujo de Venta y Reglas:
1. DIAGNÓSTICO: Si el cliente saluda o pide "información", NO lances el catálogo. Pregúntale amablemente qué aspecto de su salud le gustaría mejorar (ej: falta de energía, subir defensas, bajar de peso o mejorar digestión).
2. BENEFICIO ANTES QUE PRECIO: Una vez conozcas su problema, recomiéndale la solución ideal. PRIMERO dile cómo el producto va a solucionar su problema (los beneficios), enamóralo del producto, y AL FINAL dile el precio de forma natural, para que el valor percibido sea alto.
3. PROMO PESO: Si quiere bajar de peso, ofrécele directamente el dúo dinámico: Thermo T3 y Nocarb-T. Cuéntale qué hace cada uno y luego dile: "Lo genial es que cada uno está S/ 129.50, pero si llevas ambos hoy (S/ 259.00), te enviamos 1 TOMATODO DE REGALO".
4. CIERRE (HUANCAYO): Cuando muestre interés en comprar, indícale alegremente que realizamos entregas en HUANCAYO y pregúntale: ¿Qué día y a qué hora te vendría mejor que te lo entreguemos?
5. BREVEDAD: Tus mensajes deben parecer de una persona real texteando en WhatsApp (máximo 2 a 3 oraciones cortas por mensaje).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
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
