const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { saveProspect } = require('./prospects');

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

            // Save prospect info for the dashboard
            const contact = await client.getContactById(msg.from);
            saveProspect({
                id: msg.from,
                name: contact.pushname || contact.name || msg.from.split('@')[0],
                lastMessage: combinedMessage
            });

            const conversationContext = `Historial de chat:\n${history.join('\n')}\n\nResponde como Asesor siguiendo tus instrucciones:`;

            // Read dynamic config from file
            let contextData = '';
            let ownerEmail = 'general';
            try {
                const configPath = path.join(process.cwd(), 'bot_config.json');
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                contextData = config.expert_prompt;
                ownerEmail = config.ownerEmail || 'general';
            } catch (err) {
                console.error("Error loading bot config, using fallback:", err);
                contextData = "Eres un asesor de ventas de Fuxion en Huancayo.";
            }
            
            try {
                // Determine the original chat to reply to properly using the last message object logic or direct client API
                const chat = await msg.getChat();
                
                // Show typing indicator
                chat.sendStateTyping();
                
                const aiResponse = await generateChatbotResponse(conversationContext, contextData);
                
                // Save AI response to history
                history.push(`Asesor: ${aiResponse}`);

                let finalResponse = aiResponse;
                let mediaToSend = [];
                let audiosToSend = [];

                // 1. Detectar Imágenes
                if (finalResponse.includes('[MEDIA:prunex]')) {
                    finalResponse = finalResponse.replace(/\[MEDIA:prunex\]/gi, '').trim();
                    if (!userStates.get(msg.from)?.hasSentPrunexImage) {
                        mediaToSend.push(path.join(process.cwd(), 'public', 'prunex.png'));
                        if (!userStates.has(msg.from)) userStates.set(msg.from, {});
                        userStates.get(msg.from).hasSentPrunexImage = true;
                    }
                }

                // 2. Detectar Audios
                const audioRegex = /\[\s*AUDIO\s*:\s*(.*?)\s*\]/gi;
                let match;
                while ((match = audioRegex.exec(aiResponse)) !== null) {
                    const audioName = match[1].toLowerCase().trim();
                    let audioPath = null;

                    // Estrategia de búsqueda:
                    // A. Carpeta del dueño actual
                    const ownerPath = path.join(process.cwd(), 'public', 'audios', ownerEmail, `${audioName}.ogg`);
                    // B. Carpeta general
                    const generalPath = path.join(process.cwd(), 'public', 'audios', `${audioName}.ogg`);

                    if (fs.existsSync(ownerPath)) {
                        audioPath = ownerPath;
                    } else if (fs.existsSync(generalPath)) {
                        audioPath = generalPath;
                    } else {
                        // C. Búsqueda Profunda (en cualquier subcarpeta)
                        const baseAudiosDir = path.join(process.cwd(), 'public', 'audios');
                        if (fs.existsSync(baseAudiosDir)) {
                            const subdirs = fs.readdirSync(baseAudiosDir);
                            for (const subdir of subdirs) {
                                const subdirPath = path.join(baseAudiosDir, subdir, `${audioName}.ogg`);
                                if (fs.existsSync(subdirPath) && !fs.lstatSync(subdirPath).isDirectory()) {
                                    audioPath = subdirPath;
                                    break;
                                }
                            }
                        }
                    }

                    if (audioPath) {
                        audiosToSend.push(audioPath);
                        console.log(`✅ Audio encontrado y listo para enviar: ${audioPath}`);
                    } else {
                        console.error(`❌ ERROR: No se encontró el audio "${audioName}" en ninguna carpeta.`);
                    }
                }
                
                // Limpiar texto de tags
                finalResponse = finalResponse.replace(/\[\s*AUDIO\s*:\s*(.*?)\s*\]/gi, '');
                finalResponse = finalResponse.replace(/\[\s*MEDIA\s*:\s*(.*?)\s*\]/gi, '');
                finalResponse = finalResponse.trim();

                // 3. Enviar Texto
                if (finalResponse) {
                    await chat.sendMessage(finalResponse);
                }

                // 4. Enviar Multimedia
                for (const mPath of mediaToSend) {
                    if (fs.existsSync(mPath)) {
                        const media = MessageMedia.fromFilePath(mPath);
                        await chat.sendMessage(media);
                    }
                }

                for (const aPath of audiosToSend) {
                    try {
                        const media = MessageMedia.fromFilePath(aPath);
                        await chat.sendMessage(media, { sendAudioAsVoice: true });
                        console.log(`🎙️ Audio enviado con éxito: ${aPath}`);
                    } catch (err) {
                        console.error(`❌ Error al enviar el archivo de audio: ${aPath}`, err);
                    }
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
