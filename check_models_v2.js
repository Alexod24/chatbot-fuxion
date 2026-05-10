const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Leer .env manualmente
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKey = envContent.split('\n')
    .find(line => line.startsWith('GEMINI_API_KEY='))
    .split('=')[1]
    .trim()
    .replace(/['"]/g, '');

async function checkModels() {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.list();
        fs.writeFileSync('debug_models.json', JSON.stringify(res, null, 2));
        console.log('--- MODELOS GUARDADOS EN debug_models.json ---');
    } catch (e) {
        console.error('Error al listar modelos:', e.message);
    }
}

checkModels();
