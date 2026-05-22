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

class WhatsAppManager {
    constructor() {
        this.clients = new Map(); // Map<userId, Client>
        this.statuses = new Map(); // Map<userId, { state: string, qr: string }>
        this.histories = new Map(); // Memoria por chat
        this.processedMessages = new Set(); // Para evitar procesar el mismo mensaje varias veces (duplicados de red)
        this.messageBuffers = new Map(); // Map<chatId, string> - Acumulador de mensajes
        this.messageTimers = new Map(); // Map<chatId, Timeout> - Temporizadores de espera
        this.activePromises = new Map(); // Map<chatId, Promise> - Colas de procesamiento para serialización
        
        // Limpiar mensajes procesados cada 30 minutos
        setInterval(() => this.processedMessages.clear(), 30 * 60 * 1000);
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

            const chat = await originalMsg.getChat();
            await chat.sendStateTyping();

            if (!this.histories.has(originalMsg.from)) this.histories.set(originalMsg.from, []);
            const history = this.histories.get(originalMsg.from);

            // Ahorro de tokens / Contexto dinámico
            const historyText = history.map(h => h.content).join(" ");
            const fullContextText = (messageBody + " " + historyText).toUpperCase();
            const keywords = ['DIGESTION', 'PESO', 'ENERGIA', 'PRUNEX', 'THERMO', 'VITA', 'FLORA', 'NOCARB', 'ON'];
            const foundKeywords = keywords.filter(k => fullContextText.includes(k));
            
            let dynamicContext = "";
            if (foundKeywords.length > 0) {
                const { data: knowledge } = await supabase.from('bot_knowledge').select('content').eq('user_id', targetId).in('keyword', foundKeywords);
                if (knowledge) dynamicContext = "\n\nAPOYO:\n" + knowledge.map(k => k.content).join("\n");
            }

            const systemConstraint = `
[RESTRICCIÓN CRÍTICA DE RESPUESTA]
1. Respuestas basadas únicamente en Fuxion: Tus respuestas deben centrarse ÚNICAMENTE en los productos de Fuxion, estreñimiento, hígado graso, peso, energía, limpieza de colon o temas de salud y bienestar del catálogo de Fuxion provistos en las instrucciones y en la base de datos (APOYO).
2. Prohibida la conversación casual: Tienes ESTRICTAMENTE PROHIBIDO responder con frases de relleno, preguntas generales de chat, cháchara sobre la vida personal del usuario (por ejemplo, preguntar cómo fue su día, cómo está el clima, de dónde es, chistes, anécdotas, etc.).
3. Saludo e inicio enfocado: Si el usuario te saluda ("Hola", "Buenas", etc.), debes iniciar tu respuesta saludando con un "Hola" inicial y presentarte como Alex (ejemplo: "Hola, soy Alex..."), e inmediatamente haz una pregunta sobre su salud o digestión para iniciar el Diagnóstico (Paso 1). Ejemplo: "Hola, soy Alex. Cuéntame, buscas mejorar tu digestión o qué objetivo de salud tienes hoy?".
4. Comportamiento ante temas fuera de alcance: Si el usuario te pregunta por cualquier tema que no sea de Fuxion o de los productos/temas provistos (por ejemplo, temas personales, de actualidad, chistes, etc.), responde en una única oración corta que solo estás capacitado para asesorarle en productos Fuxion y redirige la conversación.
5. Sigue al pie de la letra las REGLAS del flujo.
6. SÉ EXTREMADAMENTE BREVE Y CONCISO: Tus respuestas deben tener un máximo de 1 a 2 oraciones muy cortas (menos de 30 palabras en total). Simula mensajes de WhatsApp reales, que son rápidos, directos y van al grano. Evita explicaciones largas, detalles innecesarios o textos extensos.
7. REGLAS DE HUMANIZACIÓN: Respeta estrictamente las prohibiciones de tu instrucción (Cero listas, cero viñetas, PROHIBIDO usar saludos genéricos como "Cómo estás hoy?" o "Necesitas algo?", y PROHIBIDO usar la palabra "gustaría" o variaciones de ella. En su lugar, usa preguntas directas como "Buscas...?", "Deseas...?", o "Quieres...?"). Queda ESTRICTAMENTE PROHIBIDO utilizar los signos de interrogación y exclamación de apertura (¿ y ¡).
`;

            const now = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
            const finalPrompt = systemPrompt + "\n" + systemConstraint + dynamicContext + `\n\nHORA ACTUAL EN PERÚ: ${now}`;

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
                    const productoInteres = agendarMatch[2].trim();
                    
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

                        const notificationText = `🔔 *LLAMADA AGENDADA*\n\n📞 *Cliente:* ${clientNumber.startsWith('+') ? clientNumber : '+' + clientNumber}\n🔗 *Chat:* ${waLink}\n📦 *Producto:* ${productoInteres}\n⏰ *Hora pactada:* ${horaPactada}\n\nListo, llama al cliente a la hora acordada para cerrar la venta.`;
                        
                        await client.sendMessage(selfJid, notificationText);
                        console.log(`[Notification] Sent call notification to self (${selfJid}) for client ${clientNumber}`);
                    })().catch(err => console.error("[Notification] Error processing/sending notification:", err));
                } else {
                    console.warn("[Notification] Could not get selfJid from client.info to send notification");
                }
            }

            if (dynamicMatch) {
                const searchName = dynamicMatch[1].trim().toUpperCase();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await chat.sendStateRecording();
                await new Promise(resolve => setTimeout(resolve, 3000));

                const { data: audioRecord } = await supabase.from('bot_audios').select('message_id').eq('user_id', targetId).eq('name', searchName).single();
                if (audioRecord) {
                    const messageToForward = await client.getMessageById(audioRecord.message_id);
                    await messageToForward.forward(originalMsg.from);
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

