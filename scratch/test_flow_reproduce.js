require('dotenv').config();
const { generateGroqResponse } = require('../src/lib/groq');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./bot_config.json', 'utf8'));
const systemPrompt = config.expert_prompt;

const systemConstraint = `
[RESTRICCIÓN CRÍTICA DE RESPUESTA]
1. Respuestas basadas únicamente en Fuxion: Tus respuestas deben centrarse ÚNICAMENTE en los productos de Fuxion, estreñimiento, hígado graso, peso, energía, limpieza de colon o temas de salud y bienestar del catálogo de Fuxion provistos en las instrucciones y en la base de datos (APOYO).
2. Prohibida la conversación casual: Tienes ESTRICTAMENTE PROHIBIDO responder con frases de relleno, preguntas generales de chat, cháchara sobre la vida personal del usuario (por ejemplo, preguntar cómo fue su día, cómo está el clima, de dónde es, chistes, anécdotas, etc.).
3. Saludo e inicio enfocado: Si el usuario te saluda ("Hola", "Buenas", etc.), y NO han coordinado una llamada en el historial, debes iniciar saludando con un "Hola" inicial, presentarte como tu asesor Fuxion (ej: "Hola, te saluda tu asesor Fuxion.") y preguntar qué objetivo de salud, energía o peso busca mejorar (Paso 1). Pero si la llamada ya está agendada/coordinada en el historial de chat (ej: confirmaste que le llamas o agendaste), NO reinicies el flujo ni te presentes de nuevo; solo saluda cordialmente de forma muy humana y confirma que ya está todo listo para la llamada o pregúntale si tiene otra duda antes.
4. Temas fuera de alcance o dudas sobre quién eres: Si pregunta por temas ajenos a Fuxion o qué/quién eres (ej. "¿qué es eso?"), responde de forma muy humana y natural como asesor independiente Fuxion (ej: "Te saluda tu asesor de las bebidas Fuxion y te ayudo con tus dudas o entrega. Qué objetivo de salud o bienestar te gustaría mejorar hoy?"). Jamás digas "soy un bot", "estoy capacitado para", "soy un modelo de lenguaje" o similares.
5. Sigue al pie de la letra las REGLAS del flujo.
6. SÉ EXTREMADAMENTE BREVE Y CONCISO: Tus respuestas deben tener un máximo de 1 a 2 oraciones muy cortas (menos de 30 palabras en total). Simula mensajes de WhatsApp reales, que son rápidos, directos y van al grano. Evita explicaciones largas, detalles innecesarios o textos extensos.
7. REGLAS DE HUMANIZACIÓN: Respeta estrictamente las prohibiciones de tu instrucción (Cero listas, cero viñetas, PROHIBIDO usar saludos genéricos como "Cómo estás hoy?" o "Necesitas algo?", y PROHIBIDO usar la palabra "gustaría" o variaciones de ella. En su lugar, usa preguntas directas como "Buscas...?", "Deseas...?", o "Quieres...?"). Queda ESTRICTAMENTE PROHIBIDO utilizar los signos de interrogación y exclamación de apertura (¿ y ¡).
`;

async function test() {
    const now = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    const finalPrompt = systemPrompt + "\n" + systemConstraint + `\n\nHORA ACTUAL EN PERÚ: ${now}`;

    // Helper to simulate final cleanups done in whatsapp.js
    function cleanAIResponse(response) {
        if (!response) return response;
        let cleaned = response.replace(/[¿¡]/g, '');
        // Extrae agendar tag
        const agendarRegex = /\[\s*AGENDAR\s*:\s*([^,\]]+)\s*,\s*([^\]]+)\s*\]/i;
        cleaned = cleaned.replace(agendarRegex, '').trim();
        return cleaned;
    }

    // Test Case 1: Greeting after a scheduled call
    console.log("--- TEST 1: Greeting after scheduled call ---");
    const history1 = [
        { role: "user", content: "Hola" },
        { role: "assistant", content: "Hola, te saluda tu asesor Fuxion. Cuéntame, buscas mejorar tu digestión, bajar de peso, tener más energía o qué objetivo de salud tienes hoy?" },
        { role: "user", content: "Deseo mas informacion de prunex1" },
        { role: "assistant", content: "Excelente elección, Prunex 1 es un té herbal de guindón y anís que ayuda a mejorar el tránsito intestinal lento y el estreñimiento. Deseas saber cuál es el precio?" },
        { role: "user", content: "Si" },
        { role: "assistant", content: "La caja de 28 sticks de Prunex 1 cuesta S/ 76.00 y el pack de 7 sticks cuesta S/ 21.00." },
        { role: "user", content: "A las 12:15 pm estaria bien" },
        { role: "assistant", content: "Genial, te llamo a las 12:15 pm a este número." },
        { role: "user", content: "Hola" }
    ];
    let res1 = await generateGroqResponse(history1, finalPrompt, "test-user-1");
    console.log("Response:", cleanAIResponse(res1));

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test Case 2: Asking "que es eso?"
    console.log("\n--- TEST 2: Asking 'que es eso?' after greeting ---");
    const history2 = [
        { role: "user", content: "Hola" },
        { role: "assistant", content: "Hola, te saluda tu asesor Fuxion. Cuéntame, buscas mejorar tu digestión, bajar de peso, tener más energía o qué objetivo de salud tienes hoy?" },
        { role: "user", content: "¿que es eso?" }
    ];
    let res2 = await generateGroqResponse(history2, finalPrompt, "test-user-2");
    console.log("Response:", cleanAIResponse(res2));

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test Case 3: Saying "Hola" after a 15-minute scheduled call
    console.log("\n--- TEST 3: Greeting after 15-minute scheduled call ---");
    const history3 = [
        { role: "user", content: "Hola" },
        { role: "assistant", content: "Hola, te saluda tu asesor Fuxion. Cuéntame, buscas mejorar tu digestión, bajar de peso, tener más energía o qué objetivo de salud tienes hoy?" },
        { role: "user", content: "Deseo mas informacion de prunex1" },
        { role: "assistant", content: "Excelente elección, Prunex 1 es un té herbal de guindón y anís que ayuda a mejorar el tránsito intestinal lento y el estreñimiento. Deseas saber cuál es el precio?" },
        { role: "user", content: "Si" },
        { role: "assistant", content: "La caja de 28 sticks de Prunex 1 cuesta S/ 76.00 y el pack de 7 sticks cuesta S/ 21.00." },
        { role: "user", content: "si esta bien a este mismo numero" },
        { role: "assistant", content: "excelente, te llamo en un momento para darte una mejor atencion." },
        { role: "user", content: "Hola" }
    ];
    let res3 = await generateGroqResponse(history3, finalPrompt, "test-user-3");
    console.log("Response:", cleanAIResponse(res3));

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test Case 4: Initial Greeting (Verifying it doesn't mention "Alex" and is broad)
    console.log("\n--- TEST 4: Initial Greeting ---");
    const history4 = [
        { role: "user", content: "Hola" }
    ];
    let res4 = await generateGroqResponse(history4, finalPrompt, "test-user-4");
    console.log("Response:", cleanAIResponse(res4));
}

test();
