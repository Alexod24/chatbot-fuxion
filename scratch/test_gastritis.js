const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const targetId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';

async function testGastritis() {
    // 1. Fetch prompt
    const { data: config } = await supabase.from('bot_configs').select('expert_prompt').eq('user_id', targetId).single();
    let systemPrompt = config?.expert_prompt || "";
    // Clean up hardcoded products from systemPrompt for this test
    systemPrompt = systemPrompt.replace(/# PRODUCTOS:\s*-\s*PRUNEX 1[\s\S]+?Entregas: Huancayo\./g, '# REGLAS DE ENTREGA:\n- Entregas: Huancayo.');
    console.log("=== SYSTEM PROMPT (CLEANED) ===");
    console.log(systemPrompt);

    // 2. Fetch catalog
    const { data: catalogRecord } = await supabase
        .from('bot_knowledge')
        .select('content')
        .eq('user_id', targetId)
        .eq('keyword', 'CATALOGO')
        .single();
    
    const catalog = JSON.parse(catalogRecord.content);
    console.log(`\nCatalog has ${catalog.length} items.`);

    // 3. Match keyword
    const messageBody = "gastritis";
    const historyText = ""; // simulate new greeting
    const fullContextText = (messageBody + " " + historyText).toLowerCase();

    let matchedProducts = [];
    for (const prod of catalog) {
        const hasMatch = prod.keywords.some(kw => {
            const cleanKw = kw.toLowerCase().trim();
            return fullContextText.includes(cleanKw);
        });
        if (hasMatch) {
            matchedProducts.push(prod);
        }
    }

    console.log("\n=== MATCHED PRODUCTS ===");
    matchedProducts.forEach(p => console.log(`- ${p.nombre}: ${p.desc} (${p.keywords.join(', ')})`));

    let dynamicContext = "";
    if (matchedProducts.length > 0) {
        dynamicContext = "\n\nAPOYO:\n" + matchedProducts.map(p => {
            return `- ${p.nombre}: ${p.desc} Precios: ${p.precio}.`;
        }).join("\n");
    }

    console.log("\n=== DYNAMIC CONTEXT ===");
    console.log(dynamicContext);

    // 4. Generate response with Groq
    const { generateGroqResponse } = require('../src/lib/groq');
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

    const now = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    const finalPrompt = systemPrompt + "\n" + systemConstraint + dynamicContext + `\n\nHORA ACTUAL EN PERÚ: ${now}`;
    console.log("\n=== FINAL PROMPT ===");
    console.log(finalPrompt);

    const history = [
        { role: "user", content: "Holaa" },
        { role: "assistant", content: "Hola, te saluda tu asesor Fuxion. Qué objetivo de salud, peso o energía buscas mejorar?" },
        { role: "user", content: "gastritis" }
    ];

    const response = await generateGroqResponse(history, finalPrompt, "test-user-gastritis");
    console.log("\n=== AI RESPONSE ===");
    console.log(response);
}

testGastritis();
