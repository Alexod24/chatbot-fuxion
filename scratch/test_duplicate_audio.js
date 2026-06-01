require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateGroqResponse } = require('../src/lib/groq');
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const targetId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';

// Mock check for sent audios
class MockWhatsAppManager {
    constructor() {
        this.sentAudios = new Set();
    }
    
    hasAudioBeenSent(audioName, history) {
        if (this.sentAudios.has(audioName.toUpperCase())) {
            return true;
        }
        if (history && history.length > 0) {
            const regex = new RegExp(`\\[\\s*(?:ENVIAR_AUDIO|AUDIO)\\s*:\\s*${audioName}\\s*\\]`, 'i');
            for (const h of history) {
                if (h.role === 'assistant' && regex.test(h.content)) {
                    return true;
                }
            }
        }
        return false;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("=== INICIANDO SIMULACIÓN DE PRUEBA ===");
    
    // 1. Obtener el prompt de base de datos
    const { data: config } = await supabase.from('bot_configs').select('expert_prompt').eq('user_id', targetId).single();
    const systemPrompt = config?.expert_prompt || "";
    
    // 2. Obtener el catálogo
    const { data: catalogRecord } = await supabase
        .from('bot_knowledge')
        .select('content')
        .eq('user_id', targetId)
        .eq('keyword', 'CATALOGO')
        .single();
    const catalog = JSON.parse(catalogRecord.content);
    
    // Configuración del mock de audios
    const mockManager = new MockWhatsAppManager();
    
    // Historial acumulado de la simulación
    const history = [];

    // Turno 1: User says "Hola, me duele el estómago, tengo gastritis"
    const msg1 = "Hola, me duele el estómago, tengo gastritis";
    console.log(`\nCliente: "${msg1}"`);
    history.push({ role: "user", content: msg1 });
    
    let matchedProducts = [];
    const fullContextText1 = history.map(h => h.content).join(" ").toLowerCase();
    for (const prod of catalog) {
        const hasMatch = prod.keywords.some(kw => fullContextText1.includes(kw.toLowerCase().trim()));
        if (hasMatch) matchedProducts.push(prod);
    }
    
    let dynamicContext = "\n\nAPOYO:\n" + matchedProducts.map(p => `- ${p.nombre}: ${p.desc} Precios: ${p.precio}.`).join("\n");
    
    const systemConstraint = `
[RESTRICCIÓN CRÍTICA DE RESPUESTA]
1. Respuestas basadas únicamente en Fuxion: Tus respuestas deben centrarse ÚNICAMENTE en el catálogo de productos de Fuxion provistos en la sección APOYO y el objetivo de salud o bienestar del cliente. Queda ESTRICTAMENTE PROHIBIDO recomendar, mencionar o cotizar cualquier producto que NO aparezca listado en la sección APOYO. No menciones otras enfermedades, síntomas o beneficios que no estén en la sección APOYO o que el cliente no te haya expresado.
2. Prohibida la conversación casual: Tienes ESTRICTAMENTE PROHIBIDO responder con frases de relleno, preguntas generales de chat, cháchara sobre la vida personal del usuario (por ejemplo, preguntar cómo fue su día, cómo está el clima, de dónde es, chistes, anécdotas, etc.).
3. Saludo e inicio enfocado: Si el usuario te saluda ("Hola", "Buenas", etc.), y NO han coordinado una llamada en el historial, debes iniciar saludando con un "Hola" inicial, presentarte como tu asesor Fuxion (ej: "Hola, te saluda tu asesor Fuxion.") y preguntar qué objetivo de salud, energía o peso busca mejorar (Paso 1). Pero si la llamada ya está agendada/coordinada en el historial de chat (ej: confirmaste que le llamas o agendaste), NO reinicies el flujo ni te presentes de nuevo; solo saluda cordialmente de forma muy humana y confirma que ya está todo listo para la llamada o pregúntale si tiene otra duda antes.
4. Temas fuera de alcance o dudas sobre quién eres: Si pregunta por temas ajenos a Fuxion o qué/quién eres (ej. "¿qué es eso?"), responde de forma muy humana y natural como asesor independiente Fuxion (ej: "Te saluda tu asesor de las bebidas Fuxion y te ayudo con tus dudas o entrega. Qué objetivo de salud o bienestar te gustaría mejorar hoy?"). Jamás digas "soy un bot", "estoy capacitado para", "soy un modelo de lenguaje" o similares.
5. Sigue al pie de la letra las REGLAS del flujo.
6. SÉ EXTREMADAMENTE BREVE Y CONCISO: Tus respuestas deben tener un máximo de 1 a 2 oraciones muy cortas (menos de 30 palabras en total). Simula mensajes de WhatsApp reales, que son rápidos, directos y van al grano. Evita explicaciones largas, detalles innecesarios o textos extensos.
7. REGLAS DE HUMANIZACIÓN: Respeta estrictamente las prohibiciones de tu instrucción (Cero listas, cero viñetas, PROHIBIDO usar saludos genéricos como "Cómo estás hoy?" o "Necesitas algo?", y PROHIBIDO usar la palabra "gustaría" o variaciones de ella. En su lugar, usa preguntas directas como "Buscas...?", "Deseas...?", o "Quieres...?"). Queda ESTRICTAMENTE PROHIBIDO utilizar los signos de interrogación y exclamación de apertura (¿ y ¡).
`;

    let audioConstraint = "";
    let finalPrompt = systemPrompt + "\n" + systemConstraint + audioConstraint + dynamicContext;
    
    let res1 = await generateGroqResponse(history, finalPrompt, "test-user-dup");
    res1 = res1.replace(/[¿¡]/g, '').trim();
    console.log(`Bot: "${res1}"`);
    
    // Verificar que NO mencione hígado graso
    if (res1.toLowerCase().includes("hígado graso") || res1.toLowerCase().includes("higado graso")) {
        console.error("❌ ERROR: El bot mencionó hígado graso!");
    } else {
        console.log("✅ OK: El bot no mencionó hígado graso.");
    }
    
    history.push({ role: "assistant", content: res1 });
    
    // Esperar 15 segundos para evitar rate limit
    console.log("Esperando 15s para evitar rate limit...");
    await sleep(15000);

    // Turno 2: User says "Sí, por favor, cuál es el precio?"
    const msg2 = "Sí, por favor, cuál es el precio?";
    console.log(`\nCliente: "${msg2}"`);
    history.push({ role: "user", content: msg2 });
    
    let res2 = await generateGroqResponse(history, finalPrompt, "test-user-dup");
    res2 = res2.replace(/[¿¡]/g, '').trim();
    console.log(`Bot: "${res2}"`);
    
    // Verificar si contiene [AUDIO:llamada]
    if (res2.includes("[AUDIO:llamada]")) {
        console.log("✅ OK: El bot incluye el audio de llamada en la primera consulta de precio.");
        // Marcar como enviado en nuestro mock
        mockManager.sentAudios.add("LLAMADA");
    } else {
        console.error("❌ ERROR: El bot debió incluir [AUDIO:llamada]!");
    }
    
    history.push({ role: "assistant", content: res2 });
    
    // Esperar 15 segundos para evitar rate limit
    console.log("Esperando 15s para evitar rate limit...");
    await sleep(15000);

    // Turno 3: User says "y tienes prunex? cuál es el precio de prunex?"
    const msg3 = "y tienes prunex? cuál es el precio de prunex?";
    console.log(`\nCliente: "${msg3}"`);
    history.push({ role: "user", content: msg3 });
    
    // Re-evaluar catálogo con nuevo contexto
    matchedProducts = [];
    const fullContextText3 = history.map(h => h.content).join(" ").toLowerCase();
    for (const prod of catalog) {
        const hasMatch = prod.keywords.some(kw => fullContextText3.includes(kw.toLowerCase().trim()));
        if (hasMatch) matchedProducts.push(prod);
    }
    dynamicContext = "\n\nAPOYO:\n" + matchedProducts.map(p => `- ${p.nombre}: ${p.desc} Precios: ${p.precio}.`).join("\n");
    
    let promptToUse = systemPrompt;
    // Inyectar restricción si el audio de llamada ya fue enviado
    if (mockManager.hasAudioBeenSent('llamada', history)) {
        promptToUse = promptToUse.replace(
            /- P3\s*\(PRECIO\):.*/gi,
            '- P3 (PRECIO): Si pregunta precio (o dice sí en P2), da el precio exacto del producto y, obligatoriamente en el mismo mensaje, coordina la hora para la llamada directamente por chat (texto) preguntando: "A qué hora te acomoda la llamada hoy?" o "Te puedo llamar en 15 minutos?". Queda TOTALMENTE PROHIBIDO usar la etiqueta [AUDIO:llamada] o cualquier etiqueta de audio.'
        );
        audioConstraint = `
[REGLA DE CONEXIÓN POR TEXTO (SOBREESCRIBE P3 Y REGLAS DE FLUJO)]
- Ya se envió el audio de llamada anteriormente. Queda TOTALMENTE PROHIBIDO usar la etiqueta [AUDIO:llamada] o cualquier etiqueta de audio.
- Al dar el precio de cualquier producto, es obligatorio coordinar la hora de la llamada en el mismo mensaje. Debes terminar tu respuesta preguntando por texto: "A qué hora te acomoda la llamada hoy?" o "Te puedo llamar en 15 minutos?". No uses ninguna otra pregunta al final.
`;
    }
    
    finalPrompt = promptToUse + "\n" + systemConstraint + dynamicContext + audioConstraint;
    
    let res3 = await generateGroqResponse(history, finalPrompt, "test-user-dup");
    res3 = res3.replace(/[¿¡]/g, '').trim();
    console.log(`Bot: "${res3}"`);
    
    // Verificar que NO contenga [AUDIO:llamada]
    if (res3.includes("[AUDIO:llamada]")) {
        console.error("❌ ERROR: El bot volvió a incluir [AUDIO:llamada]!");
    } else {
        console.log("✅ OK: El bot coordinó por texto y no envió [AUDIO:llamada] por segunda vez.");
    }
    
}

runTest();
