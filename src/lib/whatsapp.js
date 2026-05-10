require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { generateChatbotResponse } = require('./gemini');

// Regex global para detectar audios dinámicos en el texto
const dynamicAudioRegex = /\[\s*ENVIAR_AUDIO\s*:\s*([^\]]+)\s*\]/i;

class WhatsAppManager {
    constructor() {
        this.clients = new Map(); // Map<userId, Client>
        this.statuses = new Map(); // Map<userId, { state: string, qr: string }>
        this.histories = new Map(); // Memoria por chat
        this.processedMessages = new Set(); // Para evitar procesar el mismo mensaje varias veces (duplicados de red)
        
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
                dataPath: path.join(process.cwd(), '.wwebjs_auth')
            }),
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
                // ESCUDO TOTAL: Si no hay mensaje o no hay ID, fuera.
                if (!msg || !msg.id || !msg.id._serialized) return;

                // Asegurar que la memoria exista (evita fallos en hot-reload)
                if (!this.histories) this.histories = new Map();
                if (!this.processedMessages) this.processedMessages = new Set();
                
                const msgId = msg.id._serialized;
                if (this.processedMessages.has(msgId)) return;
                this.processedMessages.add(msgId);

                // Clasificación básica
                const isAudio = msg.type === 'audio' || msg.type === 'ptt';
                const isStatus = msg.isStatus || msg.from === 'status@broadcast';
                const isGroup = msg.from && msg.from.includes('@g.us');

                // MODO RADAR: Si es audio, lo logueamos SIEMPRE (incluso si es nuestro)
                if (isAudio) {
                    console.log("-----------------------------------------");
                    console.log(`[AUDIO DETECTADO] ID: ${msgId}`);
                    console.log("-----------------------------------------");
                }

                // Filtros de salida
                const isCommand = msg.body.startsWith('#GUARDAR:');
                if (msg.fromMe && !isAudio && !isCommand) return;
                if (isStatus || isGroup) return;

                // --- MECÁNICA DE GUARDADO DE AUDIOS (#GUARDAR:NOMBRE) ---
                if (msg.hasQuotedMsg && msg.body.startsWith('#GUARDAR:')) {
                    try {
                        const audioName = msg.body.split(':')[1]?.trim().toUpperCase();
                        const quotedMsg = await msg.getQuotedMessage();
                        
                        if (audioName && (quotedMsg.type === 'audio' || quotedMsg.type === 'ptt')) {
                            console.log("-----------------------------------------");
                            console.log(`[SISTEMA] Guardando audio '${audioName}'...`);
                            console.log("-----------------------------------------");
                            
                            const { supabase } = require('./supabase');
                            const targetUserId = (userId === 'default') ? 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a' : userId;
                            
                            const { error } = await supabase
                                .from('bot_audios')
                                .upsert({
                                    user_id: targetUserId,
                                    name: audioName,
                                    message_id: quotedMsg.id._serialized
                                }, { onConflict: 'user_id, name' });

                            if (!error) {
                                await msg.reply(`✅ *¡CONFIRMADO!* Audio guardado como: *${audioName}*\n\nYa puedes usarlo en tus prompts con: [ENVIAR_AUDIO:${audioName}]`);
                                console.log(`[SISTEMA] ✅ Audio '${audioName}' guardado con éxito.`);
                            } else {
                                console.error("[Supabase Error]", error);
                                await msg.reply("❌ Error al guardar en la base de datos.");
                            }
                            return; // IMPORTANTE: Detener aquí para que la IA no intente responder al comando
                        }
                    } catch (saveErr) {
                        console.error("[Save Audio Error]", saveErr);
                    }
                }

                // --- Privacy & Filtering ---
                const contact = await msg.getContact().catch(() => ({ number: 'unknown', isMyContact: false }));
                
                // Solo responder si NO es un grupo y el contacto NO está en la agenda
                // PERO permitimos que el audio logger pase si es de nosotros mismos
                if (!msg.fromMe && (isGroup || contact.isMyContact)) {
                    return;
                }

                // Si llegamos aquí y es de nosotros mismos, SOLO permitimos si es audio (para loguear)
                if (msg.fromMe && !isAudio) return;
                if (msg.fromMe && isAudio) return; // Ya lo logueamos arriba, no queremos que la IA responda a nuestro propio audio.

            // --- AI Logic with Dynamic Config ---

            // (Eliminado try redundante)
                let systemPrompt = "Eres Alex, asesor experto de Fuxion AI.";
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
                const targetId = isUUID ? userId : 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';
                const { supabase } = require('./supabase');

                const { data: config } = await supabase
                    .from('bot_configs')
                    .select('expert_prompt')
                    .eq('user_id', targetId)
                    .single();
                
                if (config && config.expert_prompt) {
                    systemPrompt = config.expert_prompt;
                }




                
                // --- SIMULACIÓN HUMANA (Paso 1: Lectura y Inicio de Escritura) ---
                const chat = await msg.getChat();
                await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
                await chat.sendStateTyping();

                // --- GESTIÓN DE HISTORIAL (Memoria) ---
                if (!this.histories.has(msg.from)) {
                    this.histories.set(msg.from, []);
                }
                const history = this.histories.get(msg.from);

                // 2. --- AHORRO DE TOKENS: CONOCIMIENTO DINÁMICO (Basado en historial) ---
                const historyText = history.map(h => h.content).join(" ");
                const fullContextText = (msg.body + " " + historyText).toUpperCase();
                
                const keywords = ['DIGESTION', 'PESO', 'ENERGIA', 'PRUNEX', 'THERMO', 'VITA', 'FLORA', 'NOCARB', 'ON'];
                const foundKeywords = keywords.filter(k => fullContextText.includes(k));
                
                let dynamicContext = "";
                if (foundKeywords.length > 0) {
                    const { data: knowledge } = await supabase
                        .from('bot_knowledge')
                        .select('content')
                        .eq('user_id', targetId)
                        .in('keyword', foundKeywords);
                    
                    if (knowledge && knowledge.length > 0) {
                        dynamicContext = "\n\nINFORMACIÓN DE APOYO ACTUALIZADA (Usa estos precios en S/):\n" + 
                                         knowledge.map(k => k.content).join("\n");
                    }
                }

                const now = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
                let finalPrompt = systemPrompt + dynamicContext + `\n\nHORA ACTUAL EN PERÚ: ${now}`;

                // Si hay historial, añadir una nota mental a la IA
                if (history.length > 0) {
                    finalPrompt += "\n\nNOTA: Si el cliente eligió tema pero aún NO ha aceptado saber la inversión, habla SOLO de beneficios. PROHIBIDO dar precios en la explicación inicial. Solo da el precio si el cliente lo pide o acepta saber la inversión. NO menciones que envías un audio.";
                }

                history.push({ role: "user", content: msg.body });
                
                if (history.length > 6) history.shift();

                // Generar respuesta con la IA (MODO TEST: GROQ)
                const { generateGroqResponse } = require('./groq');
                let aiResponse = await generateGroqResponse(history, finalPrompt, userId);

                // Guardar respuesta en historial
                history.push({ role: "assistant", content: aiResponse });
                if (history.length > 6) history.shift();

                // --- DEBUG LOUD ---
                console.log("-----------------------------------------");
                console.log(`[DEBUG] IA RESPONDIÓ: "${aiResponse}"`);
                console.log("-----------------------------------------");

                // --- SIMULACIÓN HUMANA (Paso 2: Tiempo de Escritura proporcional) ---
                const typingTime = Math.min(Math.max(aiResponse.length * 45, 2500), 7000); 
                await new Promise(resolve => setTimeout(resolve, typingTime));

                // --- NOTIFICACIÓN DE LLAMADA PACTADA ---
                if (aiResponse.includes('[LLAMADA_PACTADA:')) {
                    const horaMatch = aiResponse.match(/\[LLAMADA_PACTADA:(.*?)\]/i);
                    const horaCita = horaMatch ? horaMatch[1] : "No definida";
                    
                    // Limpiar la etiqueta para el cliente
                    aiResponse = aiResponse.replace(/\[LLAMADA_PACTADA:.*?\]/gi, "").trim();

                    // Enviar notificación al dueño del bot (a sí mismo)
                    const ownerNumber = client.info.wid._serialized;
                    const clientNumber = msg.from.split('@')[0];
                    const notification = `📌 *NUEVA CITA PACTADA*\n\nHola, hemos agendado una llamada con el número: *${clientNumber}*\n⏰ Hora: *${horaCita}*\n\n¡Buena suerte estratega! 🚀`;
                    
                    await client.sendMessage(ownerNumber, notification);
                    console.log(`[SISTEMA] ✅ Cita notificada al dueño para las ${horaCita}`);
                }

                // --- Soporte para Audios Dinámicos [ENVIAR_AUDIO:NOMBRE] ---
                const dynamicMatch = aiResponse.match(dynamicAudioRegex);

                // --- LIMPIEZA DEL TEXTO (Ocultar códigos al cliente) ---
                let textToSend = aiResponse.replace(dynamicAudioRegex, '').trim();

                if (textToSend) {
                    await chat.sendMessage(textToSend);
                }

                if (dynamicMatch) {
                    try {
                        const searchName = dynamicMatch[1].trim().toUpperCase();
                        
                        // --- SIMULACIÓN HUMANA (Paso 3: Grabación) ---
                        await new Promise(resolve => setTimeout(resolve, 1200));
                        await chat.sendStateRecording();
                        await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));

                        const { supabase } = require('./supabase');
                        const targetUserId = (userId === 'default') ? 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a' : userId;
                        
                        const { data: audioRecord } = await supabase
                            .from('bot_audios')
                            .select('message_id')
                            .eq('user_id', targetUserId)
                            .eq('name', searchName)
                            .single();
                        
                        if (audioRecord) {
                            const messageToForward = await msg.client.getMessageById(audioRecord.message_id);
                            await messageToForward.forward(msg.from);
                            console.log(`[WhatsApp][${userId}] ✅ AUDIO ENVIADO: ${searchName}`);
                        }
                    } catch (audioErr) {
                        console.error(`[WhatsApp] Error audio dinámico:`, audioErr.message);
                    }
                }
                await chat.clearState(); // Detener estados



            } catch (err) {
                console.error(`[WhatsApp] Error processing message for ${userId}:`, err);
            }
        });

        // Captura errores internos de Puppeteer
        client.initialize().then(() => {
            console.log(`[WhatsApp][${userId}] >> Initialization process started... (Groq Llama 3 enabled)`);
            status.step = 'Loading WhatsApp Web';
        }).catch(err => {
            console.error(`[WhatsApp][${userId}] !! CRITICAL ERROR during init:`, err.message);
            status.state = 'ERROR';
            status.error = err.message;
            status.step = 'Fatal Error';
        });
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

