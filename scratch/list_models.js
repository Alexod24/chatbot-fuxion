const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  try {
    const response = await ai.models.list();
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.error(e);
  }
}

list();
