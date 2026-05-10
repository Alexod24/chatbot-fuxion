const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const models = await ai.models.list();
        console.log("--- MODELOS DISPONIBLES EN TU CUENTA ---");
        models.forEach(m => {
            console.log(`- ${m.name}`);
        });
        console.log("---------------------------------------");
    } catch (error) {
        console.error("Error listando modelos:", error);
    }
}

listModels();
