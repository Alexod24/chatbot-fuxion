const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let whatsappStatus = {
    state: 'DISCONNECTED',
    qr: null
};

// Make it available globally to avoid import issues in Next.js routes
global.whatsappStatus = whatsappStatus;

function initializeWhatsApp(onReady) {
    if (client) return; // Prevent multiple initializations

    const botStartTime = Math.floor(Date.now() / 1000); // Record startup time in seconds
    const userMessageQueues = new Map(); // Store messages and timeouts per user
    const userHistories = new Map(); // Store conversation history per user
    const userStates = new Map(); // Track state per user (e.g. if image was sent)
    const TYPING_DELAY_MS = 5000; // Wait 5 seconds to merge messages

    console.log("Initializing WhatsApp Client...");
    
    client = new Client({
        authStrategy: new LocalAuth({ clientId: 'chatbot-fuxion' }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('============================================');
        console.log('SCAN THIS QR CODE TO LOG IN TO WHATSAPP:');
        qrcode.generate(qr, { small: true });
        console.log('============================================');
        whatsappStatus.qr = qr;
        whatsappStatus.state = 'QR_READY';
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Client is ready and connected!');
        whatsappStatus.state = 'CONNECTED';
        whatsappStatus.qr = null;
        if (onReady) onReady();
    });

    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
        whatsappStatus.state = 'AUTHENTICATED';
    });

    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
        whatsappStatus.state = 'DISCONNECTED';
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        whatsappStatus.state = 'DISCONNECTED';
        client.initialize(); // Try to re-initialize
    });

    const { generateChatbotResponse } = require('./gemini');

    client.on('message_create', async (msg) => {
        // Basic ping-pong test to verify it works
        if (msg.fromMe) return; // Avoid infinite loops

        // Ignore statuses, broadcasts, and group messages to save API quota
        if (msg.isStatus || msg.from === 'status@broadcast' || msg.from.includes('@g.us')) {
            return;
        }

        // --- FILTRO DE CONTACTOS (OPCIÓN A) ---
        // Solo responder a números que NO están en la agenda de contactos
        const contact = await msg.getContact();
        if (contact.isMyContact) {
            // Si es un contacto guardado, ignorar el mensaje
            // Permitimos "!bot" solo para que tú puedas probarlo desde otro número guardado si quieres
            if (msg.body !== '!bot') {
                return;
            }
        }
        // ---------------------------------------

        // Ignore non-text messages (stickers, images, audio, etc) for now
        if (msg.type !== 'chat') {
            return;
        }

        // Ignore messages older than the bot's startup time
        if (msg.timestamp < botStartTime) {
            return;
        }

        if (msg.body === '!ping') {
            await msg.reply('pong!');
            return;
        }

        console.log(`Received message from ${msg.from}: ${msg.body}`);
        
        // Add message to the user's queue to avoid responding to every single line
        if (!userMessageQueues.has(msg.from)) {
            userMessageQueues.set(msg.from, { messages: [], timer: null });
        }
        
        const queue = userMessageQueues.get(msg.from);
        queue.messages.push(msg.body);
        
        if (queue.timer) clearTimeout(queue.timer);
        
        queue.timer = setTimeout(async () => {
            // Combine all messages received from this user in the last 5 seconds
            const combinedMessage = queue.messages.join(' | ');
            userMessageQueues.delete(msg.from); // Clear before processing

            // Manage history
            if (!userHistories.has(msg.from)) {
                userHistories.set(msg.from, []);
            }
            const history = userHistories.get(msg.from);
            history.push(`Cliente: ${combinedMessage}`);
            if (history.length > 20) history.shift(); // Keep last 20 messages

            const conversationContext = `Historial de chat:\n${history.join('\n')}\n\nResponde como Asesor siguiendo tus instrucciones:`;

            // Emulate fetching from DB (RAG) for the moment
            const contextData = `# ROLE: EXPERTO EN VENTAS "NINJA" Y ASESOR DE BIENESTAR
Eres un asesor de ventas de élite para Fuxion. Tu único objetivo es CERRAR LA VENTA hoy. No eres un bot informativo, eres un consultor que soluciona problemas de salud y concreta pedidos de forma efectiva.

# PERSONALIDAD Y TONO:
- Seguro y con Autoridad: Tú eres el experto. Si el cliente duda, dale seguridad con los resultados.
- Persuasivo y Escaso: Usa la escasez (ej. "me quedan pocos tomatodos de regalo").
- Directo: Usa *negritas* para resaltar beneficios, precios y llamados a la acción.

# REGLAS DE ORO DE WHATSAPP:
- Formato: Usa *negritas* para palabras clave y beneficios.
- Brevedad: Párrafos de máximo 2 líneas. No envíes "biblias" de texto.
- Cierre Asertivo: OBLIGATORIO terminar cada mensaje con una pregunta que mueva la venta (ej. "¿Te lo separo ahora?", "¿Prefieres la caja o el pack?").

# INFORMACIÓN DE PRODUCTOS Y PRECIOS:
- PRUNEX 1 (Limpia colon/Estreñimiento):
  * Caja 28 sticks: *S/ 76.00* (Suma 10 puntos).
  * Pack 7 sticks: *S/ 21.00* (Suma 2 puntos).
- SISTEMA DE PUNTOS: Cada compra suma. Al llegar a *80 puntos*, ¡el sistema te regala 1 producto totalmente GRATIS!
- PROMO BAJAR DE PESO: Thermo T3 + Nocarb-T por *S/ 259.00* + *1 TOMATODO DE REGALO* (Quedan pocos para hoy).
- ENTREGAS: Directas y rápidas en *HUANCAYO* (presencial o domicilio gratis).

# ESTRATEGIA DE CIERRE "NINJA":
1. DIAGNÓSTICO EMOCIONAL: Si piden info, responde: "¡Claro! Para darte la mejor solución, ¿qué objetivo te urge lograr hoy: limpiar tu organismo, tener más energía o bajar de peso?"
2. PITCH DE VALOR: "El Prunex no solo limpia, te quita esa sensación de pesadez e hinchazón en una sola noche. Mira este video corto: https://www.tiktok.com/@balancefuxion/video/7585301463060991253. ¿Quieres sentirte ligero mañana mismo?"
3. CIERRE DE ALTERNATIVA: "La caja de 28 sticks está a *S/ 76* y el pack de 7 días a *S/ 21*. ¿Con cuál de los dos empezamos para limpiar tu organismo hoy?"
4. LOGÍSTICA ASUMIDA: "Perfecto, en Huancayo te lo entrego hoy. ¿Te lo llevo a tu dirección o prefieres coordinar en un punto céntrico?"

# INSTRUCCIÓN MULTIMEDIA:
Si hablas de PRUNEX o estreñimiento por PRIMERA VEZ, incluye SIEMPRE al final el tag [MEDIA:prunex] para enviar la imagen informativa.`;
            
            try {
                // Determine the original chat to reply to properly using the last message object logic or direct client API
                const chat = await msg.getChat();
                
                // Show typing indicator
                chat.sendStateTyping();
                
                const aiResponse = await generateChatbotResponse(conversationContext, contextData);
                
                // Save AI response to history
                history.push(`Asesor: ${aiResponse}`);

                if (aiResponse.includes('[MEDIA:prunex]')) {
                    const cleanResponse = aiResponse.replace('[MEDIA:prunex]', '').trim();
                    if (cleanResponse) await chat.sendMessage(cleanResponse);
                    
                    // Solo enviar la imagen si no se ha enviado antes a este usuario
                    if (!userStates.get(msg.from)?.hasSentPrunexImage) {
                        try {
                            const media = MessageMedia.fromFilePath('./public/prunex.png');
                            await chat.sendMessage(media);
                            
                            // Marcar como enviada
                            if (!userStates.has(msg.from)) userStates.set(msg.from, {});
                            userStates.get(msg.from).hasSentPrunexImage = true;
                        } catch (mediaError) {
                            console.error("Error sending media:", mediaError);
                        }
                    }
                } else {
                    await chat.sendMessage(aiResponse);
                }
            } catch (error) {
                console.error("Error processing queue for", msg.from, error);
            }
        }, TYPING_DELAY_MS);
    });

    client.initialize().catch(err => {
        console.error("Failed to initialize WhatsApp client:", err);
    });
}

function getWhatsAppClient() {
    return client;
}

function getWhatsAppStatus() {
    return whatsappStatus;
}

module.exports = {
    initializeWhatsApp,
    getWhatsAppClient,
    getWhatsAppStatus
};
