require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateChatbotResponse } = require('./gemini');

// Regex global para detectar audios dinámicos en el texto (Soporta [ENVIAR_AUDIO:...] y [AUDIO:...])
const dynamicAudioRegex = /\[\s*(?:ENVIAR_AUDIO|AUDIO)\s*:\s*([^\]]+)\s*\]/i;
const agendarRegex = /\[\s*AGENDAR\s*:\s*([^,\]]+)\s*,\s*([^\]]+)\s*\]/i;

// Helper to parse natural language scheduled time into a Google Calendar event URL
function getGoogleCalendarUrl(horaPactada, productoInteres, clientNumber, waLink) {
    try {
        const now = new Date();
        // Convert current server time to Peru time (UTC-5)
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const peruTime = new Date(utc + (3600000 * -5));
        let eventDate = new Date(peruTime);

        const timeStr = horaPactada.toLowerCase().trim();

        if (timeStr.includes("minutos") || timeStr.includes("min")) {
            const minsMatch = timeStr.match(/(\d+)/);
            if (minsMatch) {
                const mins = parseInt(minsMatch[1], 10);
                eventDate.setMinutes(eventDate.getMinutes() + mins);
            } else {
                eventDate.setMinutes(eventDate.getMinutes() + 15);
            }
        } else if (timeStr.includes("hora") && (timeStr.includes("1") || timeStr.includes("una"))) {
            eventDate.setHours(eventDate.getHours() + 1);
        } else {
            const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
                const ampm = timeMatch[3];

                if (ampm === "pm" && hours < 12) {
                    hours += 12;
                } else if (ampm === "am" && hours === 12) {
                    hours = 0;
                }

                eventDate.setHours(hours, minutes, 0, 0);

                if (eventDate < peruTime) {
                    eventDate.setDate(eventDate.getDate() + 1);
                }
            } else {
                // Fallback: 15 mins
                eventDate.setMinutes(eventDate.getMinutes() + 15);
            }
        }

        const formatCalendarDate = (date) => {
            const pad = (num) => String(num).padStart(2, '0');
            const yyyy = date.getFullYear();
            const mm = pad(date.getMonth() + 1);
            const dd = pad(date.getDate());
            const hh = pad(date.getHours());
            const min = pad(date.getMinutes());
            const ss = pad(date.getSeconds());
            return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
        };

        const startDateStr = formatCalendarDate(eventDate);
        const endDate = new Date(eventDate.getTime() + 15 * 60000); // 15 mins duration
        const endDateStr = formatCalendarDate(endDate);

        const cleanPhone = clientNumber.startsWith('+') ? clientNumber : '+' + clientNumber;
        const title = encodeURIComponent(`Llamar a cliente (${cleanPhone}) - Fuxion`);
        const details = encodeURIComponent(`Llamar al cliente para cerrar venta de ${productoInteres}.\n\nWhatsApp del cliente: ${waLink}`);
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}`;
    } catch (e) {
        console.error("Error generating Google Calendar URL:", e);
        return null;
    }
}

class WhatsAppManager {
    constructor() {
        this.clients = new Map(); // Map<userId, Client>
        this.statuses = new Map(); // Map<userId, { state: string, qr: string }>
        this.histories = new Map(); // Memoria por chat
        this.processedMessages = new Set(); // Para evitar procesar el mismo mensaje varias veces (duplicados de red)
        this.messageBuffers = new Map(); // Map<chatId, string> - Acumulador de mensajes
        this.messageTimers = new Map(); // Map<chatId, Timeout> - Temporizadores de espera
        this.activePromises = new Map(); // Map<chatId, Promise> - Colas de procesamiento para serialización
        this.catalogs = new Map(); // Map<userId, Array> - Caché del catálogo de productos en memoria
        this.sentAudios = new Map(); // Map<chatId, Set<string>> - Registro de audios enviados en esta sesión
        
        // Limpiar mensajes procesados cada 30 minutos
        setInterval(() => this.processedMessages.clear(), 30 * 60 * 1000);
    }

    /**
     * Comprueba si un audio ya fue enviado a un chat JID usando memoria de sesión, historial de texto o mensajes previos.
     */
    hasAudioBeenSent(chatId, audioName, history, fetchedMessages = []) {
        const nameUpper = audioName.toUpperCase();
        
        // 1. Verificar en memoria de la sesión activa
        const sessionSent = this.sentAudios.get(chatId);
        if (sessionSent && sessionSent.has(nameUpper)) {
            return true;
        }

        // 2. Verificar en el historial de mensajes local en memoria (buscar tag [AUDIO:name])
        if (history && history.length > 0) {
            const regex = new RegExp(`\\[\\s*(?:ENVIAR_AUDIO|AUDIO)\\s*:\\s*${audioName}\\s*\\]`, 'i');
            for (const h of history) {
                if (h.role === 'assistant' && regex.test(h.content)) {
                    return true;
                }
            }
        }

        // 3. Verificar en mensajes recuperados de WhatsApp (si es el audio de llamada, cualquier audio de salida se considera duplicado)
        if (nameUpper === 'LLAMADA' && fetchedMessages && fetchedMessages.length > 0) {
            for (const msg of fetchedMessages) {
                if (msg.fromMe && (msg.type === 'audio' || msg.type === 'ptt')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Registra un audio como enviado en la sesión activa para un chat JID.
     */
    markAudioAsSent(chatId, audioName) {
        if (!this.sentAudios.has(chatId)) {
            this.sentAudios.set(chatId, new Set());
        }
        this.sentAudios.get(chatId).add(audioName.toUpperCase());
    }


    /**
     * Initializes a WhatsApp client for a specific user.
     * @param {string} userId - The unique ID of the user/tenant.
     */
    async initializeClient(userId) {
        // Si ya existe un cliente y está conectado, no hacemos nada
        if (this.clients.has(userId)) {
            const currentStatus = this.getStatus(userId);
            const activeStates = ['CONNECTED', 'AUTHENTICATED', 'INITIALIZING', 'QR_READY'];
            
            if (activeStates.includes(currentStatus.state)) {
                console.log(`[WhatsApp] Client already in ${currentStatus.state} state for user ${userId}. Ignoring re-init.`);
                return;
            }
            
            console.log(`[WhatsApp] Cleaning up old client for user ${userId} to restart...`);
            const oldClient = this.clients.get(userId);
            try {
                // Intentar cerrar el navegador explícitamente y destruir el cliente
                if (oldClient.pupBrowser) {
                    await oldClient.pupBrowser.close().catch(() => {});
                }
                await oldClient.destroy().catch(() => {});
            } catch (e) {
                console.warn(`[WhatsApp] Warning during cleanup: ${e.message}`);
            }
            this.clients.delete(userId);
            // Espera generosa para que el SO libere los archivos del perfil de Chrome
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`[WhatsApp] Initializing NEW Client for user: ${userId}`);

        
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: `client-${userId}`, // ID fijo para persistencia 24/7
                dataPath: path.join(os.homedir(), '.wwebjs_auth')
            }),
            webVersionCache: {
                type: 'local',
                path: path.join(os.homedir(), '.wwebjs_cache')
            },
            authTimeoutMs: 60000,
            puppeteer: {
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions'
                ],
                executablePath: process.env.CHROME_PATH || null,
                headless: 'new'
            }
        });




        const status = { state: 'INITIALIZING', qr: null, error: null, step: 'Starting', lastPromptUsed: null };
        this.statuses.set(userId, status);
        this.clients.set(userId, client);

        console.log(`[WhatsApp][${userId}] >> Step: Initializing browser...`);
        status.step = 'Initializing Browser';
        
        // Pequeño delay para permitir que procesos viejos se cierren
        await new Promise(resolve => setTimeout(resolve, 500));


        client.on('qr', (qr) => {
            console.log(`[WhatsApp][${userId}] >> QR RECEIVED SUCCESS!`);
            status.qr = qr;
            status.state = 'QR_READY';
            status.step = 'Scan now';
        });

        client.on('ready', () => {
            console.log(`[WhatsApp][${userId}] >> Client is READY and CONNECTED`);
            status.state = 'CONNECTED';
            status.qr = null;
            status.step = 'Active';
            if (!client.readyTime) {
                client.readyTime = Math.floor(Date.now() / 1000);
            }
        });

        client.on('authenticated', () => {
            console.log(`[WhatsApp][${userId}] >> Authentication Successful`);
            status.state = 'AUTHENTICATED';
            status.step = 'Loading chats';
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WhatsApp][${userId}] !! Authentication Failure:`, msg);
            status.state = 'DISCONNECTED';
            status.error = msg;
            status.step = 'Auth Failed';
        });

        client.on('disconnected', (reason) => {
            console.log(`[WhatsApp][${userId}] !! Disconnected:`, reason);
            status.state = 'DISCONNECTED';
            status.step = 'Disconnected';
            this.clients.delete(userId);
        });

        client.on('message_create', async (msg) => {
            try {
                if (!msg || !msg.id || !msg.id._serialized) return;
                
                // Ignorar mensajes recibidos antes de que el cliente esté listo o mensajes de más de 60 segundos de antigüedad
                const now = Math.floor(Date.now() / 1000);
                if (!client.readyTime || msg.timestamp < client.readyTime || (now - msg.timestamp) > 60) {
                    return;
                }

                const msgId = msg.id._serialized;
                if (this.processedMessages.has(msgId)) return;
                this.processedMessages.add(msgId);

                const isAudio = msg.type === 'audio' || msg.type === 'ptt';
                const isStatus = msg.isStatus || msg.from === 'status@broadcast';
                const isGroup = msg.from && msg.from.includes('@g.us');

                if (isAudio) {
                    console.log(`[AUDIO DETECTADO] ID: ${msgId}`);
                }

                if (msg.fromMe && !(msg.body && msg.body.startsWith('#GUARDAR:'))) return;
                if (isStatus || isGroup) return;

                // --- MECÁNICA DE GUARDADO DE AUDIOS (#GUARDAR:NOMBRE) ---
                if (msg.hasQuotedMsg && msg.body.startsWith('#GUARDAR:')) {
                    // (Lógica de guardado se mantiene igual, pero procesada de inmediato)
                    const audioName = msg.body.split(':')[1]?.trim().toUpperCase();
                    const quotedMsg = await msg.getQuotedMessage();
                    if (audioName && (quotedMsg.type === 'audio' || quotedMsg.type === 'ptt')) {
                        const { supabase } = require('./supabase');
                        const targetUserId = (userId === 'default') ? 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a' : userId;
                        await supabase.from('bot_audios').upsert({ user_id: targetUserId, name: audioName, message_id: quotedMsg.id._serialized }, { onConflict: 'user_id, name' });
                        await msg.reply(`✅ *Audio guardado:* ${audioName}`);
                        return;
                    }
                }

                // --- Privacy & Filtering ---
                const contact = await msg.getContact().catch(() => ({ number: 'unknown', isMyContact: false }));
                if (!msg.fromMe && contact.isMyContact) return;

                // --- AGREGACIÓN DE MENSAJES (Espera 6 segundos para agrupar mensajes separados) ---
                const chatId = msg.from;
                const currentContent = this.messageBuffers.get(chatId) || "";
                const newContent = currentContent ? (currentContent + " " + msg.body) : msg.body;
                this.messageBuffers.set(chatId, newContent);

                // Si ya hay un timer corriendo, lo reseteamos
                if (this.messageTimers.has(chatId)) {
                    clearTimeout(this.messageTimers.get(chatId));
                }

                const timer = setTimeout(async () => {
                    const fullMessage = this.messageBuffers.get(chatId);
                    this.messageBuffers.delete(chatId);
                    this.messageTimers.delete(chatId);

                    // Serializar el procesamiento de mensajes para el mismo chat usando una cola de promesas
                    const currentPromise = this.activePromises.get(chatId) || Promise.resolve();
                    const nextPromise = currentPromise.then(async () => {
                        try {
                            await this.processMessageInternal(userId, client, msg, fullMessage);
                        } catch (err) {
                            console.error(`[WhatsApp] Error in sequential process for ${chatId}:`, err);
                        }
                    });

                    this.activePromises.set(chatId, nextPromise);

                    // Limpiar la referencia de la promesa una vez finalizado todo el flujo para no consumir memoria
                    nextPromise.finally(() => {
                        if (this.activePromises.get(chatId) === nextPromise) {
                            this.activePromises.delete(chatId);
                        }
                    });
                }, 6000); // 6 segundos de espera prudente

                this.messageTimers.set(chatId, timer);

            } catch (err) {
                console.error(`[WhatsApp] Error in message_create for ${userId}:`, err);
            }
        });

        // Captura errores internos de Puppeteer
        client.initialize().then(() => {
            console.log(`[WhatsApp][${userId}] >> Initialization process started...`);
            status.step = 'Loading WhatsApp Web';
        }).catch(err => {
            console.error(`[WhatsApp][${userId}] !! CRITICAL ERROR during init:`, err.message);
            status.state = 'ERROR';
        });
    }

    /**
     * Procesa el mensaje final (solo o agrupado) con la IA
     */
    async processMessageInternal(userId, client, originalMsg, messageBody) {
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
            const targetId = isUUID ? userId : 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';
            const { supabase } = require('./supabase');

            const { data: config } = await supabase.from('bot_configs').select('expert_prompt').eq('user_id', targetId).single();
            const systemPrompt = config?.expert_prompt || "Eres Alex, asesor de Fuxion.";

            // --- VERIFICACIÓN DE SUSCRIPCIÓN ACTIVA ---
            const { data: profile } = await supabase.from('profiles').select('plan_end_date').eq('id', targetId).single();
            if (!profile || !profile.plan_end_date) {
                console.log(`[Subscription] No plan active for user ${targetId}. Ignoring message from ${originalMsg.from}`);
                return;
            }
            const planEnd = new Date(profile.plan_end_date);
            if (planEnd < new Date()) {
                console.log(`[Subscription] Plan expired for user ${targetId}. Ignoring message from ${originalMsg.from}`);
                return; // Ignore the message to save tokens
            }

            const chat = await originalMsg.getChat();
            await chat.sendStateTyping();

            let fetchedMessages = [];
            if (!this.histories.has(originalMsg.from)) {
                let fetchedHistory = [];
                try {
                    console.log(`[History] Fetching recent messages for JID: ${originalMsg.from}...`);
                    fetchedMessages = await chat.fetchMessages({ limit: 10 });
                    for (const msg of fetchedMessages) {
                        if (msg.id._serialized === originalMsg.id._serialized) {
                            continue;
                        }
                        if (msg.body && typeof msg.body === 'string' && msg.body.trim() !== '') {
                            const role = msg.fromMe ? "assistant" : "user";
                            fetchedHistory.push({ role, content: msg.body });
                        }
                    }
                    console.log(`[History] Recovered ${fetchedHistory.length} messages from chat.`);
                    fetchedHistory = fetchedHistory.slice(-6);
                } catch (err) {
                    console.error("[History] Error fetching messages from chat:", err);
                }
                this.histories.set(originalMsg.from, fetchedHistory);
            }
            const history = this.histories.get(originalMsg.from);

            // Ahorro de tokens / Contexto dinámico
            const historyText = history.map(h => h.content).join(" ");
            const fullContextText = (messageBody + " " + historyText).toLowerCase();

            // Cargar catálogo de Supabase en memoria si no está cacheado
            if (!this.catalogs.has(targetId)) {
                try {
                    console.log(`[Catalog] Fetching catalog for user ${targetId} from Supabase...`);
                    const { data: catalogRecord } = await supabase
                        .from('bot_knowledge')
                        .select('content')
                        .eq('user_id', targetId)
                        .eq('keyword', 'CATALOGO')
                        .single();
                    if (catalogRecord && catalogRecord.content) {
                        const parsed = JSON.parse(catalogRecord.content);
                        this.catalogs.set(targetId, parsed);
                        console.log(`[Catalog] Loaded ${parsed.length} products into memory cache for user ${targetId}.`);
                    } else {
                        this.catalogs.set(targetId, []);
                    }
                } catch (err) {
                    console.error("[Catalog] Error fetching catalog:", err);
                    this.catalogs.set(targetId, []);
                }
            }

            const catalog = this.catalogs.get(targetId) || [];
            let dynamicContext = "";
            let matchedProducts = [];

            if (catalog.length > 0) {
                // Coincidencia de palabras clave dinámica contra el catálogo
                for (const prod of catalog) {
                    const hasMatch = prod.keywords.some(kw => {
                        const cleanKw = kw.toLowerCase().trim();
                        return fullContextText.includes(cleanKw);
                    });
                    if (hasMatch) {
                        matchedProducts.push(prod);
                    }
                }
                if (matchedProducts.length > 0) {
                    dynamicContext = "\n\nAPOYO:\n" + matchedProducts.map(p => {
                        return `- ${p.nombre}: ${p.desc} Precios: ${p.precio}.`;
                    }).join("\n");
                    console.log(`[Catalog] Matched ${matchedProducts.length} products: ${matchedProducts.map(p => p.nombre).join(', ')}`);
                }
            } else {
                // Fallback a consulta tradicional si no hay catálogo
                const legacyKeywords = ['DIGESTION', 'PESO', 'ENERGIA', 'PRUNEX', 'THERMO', 'VITA', 'FLORA', 'NOCARB', 'ON'];
                const foundKeywords = legacyKeywords.filter(k => fullContextText.toUpperCase().includes(k));
                if (foundKeywords.length > 0) {
                    const { data: knowledge } = await supabase.from('bot_knowledge').select('content').eq('user_id', targetId).in('keyword', foundKeywords);
                    if (knowledge) dynamicContext = "\n\nAPOYO:\n" + knowledge.map(k => k.content).join("\n");
                }
            }

            // Verificar si el audio de llamada ya fue enviado anteriormente
            const isLlamadaAudioSent = this.hasAudioBeenSent(originalMsg.from, 'llamada', history, fetchedMessages);

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

            let promptToUse = systemPrompt;
            let audioConstraint = "";
            if (isLlamadaAudioSent) {
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

            const now = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
            const finalPrompt = promptToUse + "\n" + systemConstraint + dynamicContext + audioConstraint + `\n\nHORA ACTUAL EN PERÚ: ${now}`;

            history.push({ role: "user", content: messageBody });
            if (history.length > 6) history.shift();

            const { generateGroqResponse } = require('./groq');
            let aiResponse = await generateGroqResponse(history, finalPrompt, userId);

            // Eliminar programáticamente los signos de apertura ¿ y ¡ para asegurar el formato informal
            if (aiResponse) {
                aiResponse = aiResponse.replace(/[¿¡]/g, '');

                // Filtro fail-safe de contradicción de precios:
                // Si la respuesta contiene precios y una pregunta sobre si desea saber el precio, la eliminamos.
                const contienePrecio = /s\/\s*\d+|cuesta|cuestan/i.test(aiResponse);
                if (contienePrecio) {
                    // Extraemos temporalmente el tag de audio si existe al final
                    let audioTag = "";
                    const audioTagMatch = aiResponse.match(/(\[\s*(?:ENVIAR_AUDIO|AUDIO)\s*:\s*[^\]]+\s*\])\s*$/i);
                    if (audioTagMatch) {
                        audioTag = " " + audioTagMatch[1];
                        aiResponse = aiResponse.slice(0, -audioTagMatch[0].length).trim();
                    }

                    const redundantPriceRegex = /(?:deseas|quieres|te\s+gustaría|gustaría)\s+(?:saber|conocer)\s+(?:cuál\s+es\s+)?(?:el\s+|los\s+)?precio[s]?[^.]*\??$/gi;
                    aiResponse = aiResponse.replace(redundantPriceRegex, '').trim();

                    // Re-adicionamos el tag de audio si existía
                    if (audioTag) {
                        aiResponse = aiResponse + audioTag;
                    }
                }
            }

            // Detectar y procesar tag de agendamiento
            const agendarMatch = aiResponse ? aiResponse.match(agendarRegex) : null;
            if (agendarMatch) {
                aiResponse = aiResponse.replace(agendarRegex, '').trim();
            }

            history.push({ role: "assistant", content: aiResponse });
            if (history.length > 6) history.shift();

            console.log(`[DEBUG] IA RESPONDIÓ: "${aiResponse}"`);

            const typingTime = Math.min(Math.max(aiResponse.length * 45, 2000), 5000); 
            await new Promise(resolve => setTimeout(resolve, typingTime));

            const dynamicMatch = aiResponse.match(dynamicAudioRegex);
            let textToSend = aiResponse.replace(dynamicAudioRegex, '').trim();

            if (textToSend) await chat.sendMessage(textToSend);

            // Si hay un agendamiento exitoso, notificar al socio en su propio chat
            if (agendarMatch) {
                const selfJid = client.info && client.info.wid ? client.info.wid._serialized : null;
                if (selfJid) {
                    const horaPactada = agendarMatch[1].trim();
                    let productoInteres = agendarMatch[2].trim();
                    
                    // Si el modelo dejó el marcador <producto> literal, lo reemplazamos con los productos detectados
                    if (productoInteres.includes('<') || productoInteres.includes('>') || productoInteres.toLowerCase() === 'producto' || productoInteres === '') {
                        if (matchedProducts && matchedProducts.length > 0) {
                            productoInteres = matchedProducts.map(p => p.nombre).join(', ');
                        } else {
                            productoInteres = 'Productos Fuxion';
                        }
                    }
                    
                    // Ejecutar de forma asíncrona para no bloquear el flujo principal de respuesta al cliente
                    (async () => {
                        let clientJid = originalMsg.from;
                        try {
                            if (clientJid.endsWith('@lid')) {
                                console.log(`[Notification] JID is LID: ${clientJid}. Attempting to resolve to phone number...`);
                                // Intentar múltiples métodos dentro del contexto de Puppeteer para resolver el JID de teléfono real (@c.us)
                                const resolvedPhoneJid = await client.pupPage.evaluate(async (lidStr) => {
                                    try {
                                        const wid = window.Store.WidFactory.createWid(lidStr);
                                        
                                        // 1. Buscar en el almacén de contactos existente
                                        let contact = window.Store.Contact.get(wid);
                                        if (!contact) {
                                            contact = await window.Store.Contact.find(wid);
                                        }
                                        if (contact) {
                                            if (contact.phoneNumber && contact.phoneNumber._serialized) {
                                                return contact.phoneNumber._serialized;
                                            }
                                            if (contact.pn && contact.pn._serialized) {
                                                return contact.pn._serialized;
                                            }
                                        }
                                        
                                        // 2. Intentar usando LidUtils
                                        if (window.Store.LidUtils) {
                                            const phoneWid = window.Store.LidUtils.getPhoneNumber(wid);
                                            if (phoneWid && phoneWid._serialized) {
                                                return phoneWid._serialized;
                                            }
                                        }
                                        
                                        // 3. Forzar recuperación
                                        if (window.WWebJS && window.WWebJS.enforceLidAndPnRetrieval) {
                                            const res = await window.WWebJS.enforceLidAndPnRetrieval(lidStr);
                                            if (res && res.phone && res.phone._serialized) {
                                                return res.phone._serialized;
                                            }
                                        }
                                        
                                        // 4. Buscar en el almacén de chats
                                        const chat = window.Store.Chat.get(wid);
                                        if (chat && chat.contact) {
                                            if (chat.contact.phoneNumber && chat.contact.phoneNumber._serialized) {
                                                return chat.contact.phoneNumber._serialized;
                                            }
                                        }
                                    } catch (e) {
                                        console.error("Error resolving LID to phone inside Puppeteer:", e);
                                    }
                                    return null;
                                }, clientJid);

                                if (resolvedPhoneJid) {
                                    clientJid = resolvedPhoneJid;
                                    console.log(`[Notification] Resolved LID ${originalMsg.from} to phone JID ${clientJid}`);
                                } else {
                                    // Probar con getContactLidAndPhone si todo lo demás falla
                                    const lidPhoneList = await client.getContactLidAndPhone([clientJid]);
                                    if (lidPhoneList && lidPhoneList.length > 0 && lidPhoneList[0].pn) {
                                        clientJid = lidPhoneList[0].pn;
                                        console.log(`[Notification] Resolved LID ${originalMsg.from} using backup method to phone JID ${clientJid}`);
                                    } else {
                                        console.warn(`[Notification] Could not resolve LID ${clientJid} to phone JID`);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("[Notification] Error resolving JID from LID:", err);
                        }

                        let clientNumber = clientJid.split('@')[0];
                        let waLink = `https://wa.me/${clientNumber}`;
                        try {
                            const contact = await client.getContactById(clientJid);
                            if (contact) {
                                const formatted = await contact.getFormattedNumber();
                                if (formatted) {
                                    clientNumber = formatted;
                                    const cleanDigits = formatted.replace(/\D/g, '');
                                    if (cleanDigits) {
                                        waLink = `https://wa.me/${cleanDigits}`;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("[Notification] Error getting formatted contact number:", err);
                        }

                        const calendarUrl = getGoogleCalendarUrl(horaPactada, productoInteres, clientNumber, waLink);
                        let calendarSection = "";
                        if (calendarUrl) {
                            calendarSection = `\n📅 *Agendar en Google Calendar:*\n${calendarUrl}\n`;
                        }

                        const notificationText = `🔔 *LLAMADA AGENDADA*\n\n📞 *Cliente:* ${clientNumber.startsWith('+') ? clientNumber : '+' + clientNumber}\n🔗 *Chat:* ${waLink}\n📦 *Producto:* ${productoInteres}\n⏰ *Hora pactada:* ${horaPactada}\n${calendarSection}\nListo, llama al cliente a la hora acordada para cerrar la venta.`;
                        
                        await client.sendMessage(selfJid, notificationText);
                        console.log(`[Notification] Sent call notification to self (${selfJid}) for client ${clientNumber}`);
                    })().catch(err => console.error("[Notification] Error processing/sending notification:", err));
                } else {
                    console.warn("[Notification] Could not get selfJid from client.info to send notification");
                }
            }

            if (dynamicMatch) {
                const searchName = dynamicMatch[1].trim().toUpperCase();
                // Salvaguarda: Verificar si el audio ya fue enviado anteriormente
                const alreadySent = this.hasAudioBeenSent(originalMsg.from, searchName, history, fetchedMessages);
                if (alreadySent) {
                    console.log(`[AUDIO] Salvaguarda: El audio ${searchName} ya fue enviado anteriormente a ${originalMsg.from}. No se reenviará.`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await chat.sendStateRecording();
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const { data: audioRecord } = await supabase.from('bot_audios').select('message_id').eq('user_id', targetId).eq('name', searchName).single();
                    if (audioRecord) {
                        const messageToForward = await client.getMessageById(audioRecord.message_id);
                        await messageToForward.forward(originalMsg.from);
                        this.markAudioAsSent(originalMsg.from, searchName);
                        console.log(`[AUDIO] Audio ${searchName} enviado por primera vez a ${originalMsg.from}`);
                    }
                }
            }
            await chat.clearState();

        } catch (err) {
            console.error("[WhatsApp] processMessageInternal Error:", err);
        }
    }





    getClient(userId) {
        return this.clients.get(userId);
    }

    getStatus(userId) {
        return this.statuses.get(userId) || { state: 'DISCONNECTED', qr: null };
    }

    async logout(userId) {
        const client = this.clients.get(userId);
        if (client) {
            await client.logout();
            this.clients.delete(userId);
            this.statuses.delete(userId);
        }
    }
}

// Singleton instance with global persistence for Next.js Dev Mode
if (!global._whatsappManager) {
    global._whatsappManager = new WhatsAppManager();
}
const manager = global._whatsappManager;

module.exports = {
    whatsappManager: manager,
    initializeWhatsApp: () => manager.initializeClient('default'),
    getWhatsAppStatus: () => manager.getStatus('default')
};

