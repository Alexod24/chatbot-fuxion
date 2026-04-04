const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;

function initializeWhatsApp(onReady) {
    if (client) return; // Prevent multiple initializations

    const botStartTime = Math.floor(Date.now() / 1000); // Record startup time in seconds
    const userMessageQueues = new Map(); // Store messages and timeouts per user
    const userHistories = new Map(); // Store conversation history per user
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
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Client is ready and connected!');
        if (onReady) onReady();
    });

    const { generateChatbotResponse } = require('./gemini');

    client.on('message_create', async (msg) => {
        // Basic ping-pong test to verify it works
        if (msg.fromMe) return; // Avoid infinite loops

        // Ignore statuses, broadcasts, and group messages to save API quota
        if (msg.isStatus || msg.from === 'status@broadcast' || msg.from.includes('@g.us')) {
            return;
        }

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
            const contextData = "Eres un Asesor Fuxion experto. Objetivo: Cerrar ventas. PROMO ESTRELLA BAJAR DE PESO: Pack Thermo T3 (quema grasa/da energía) + Nocarb-T (bloquea carbohidratos/azúcar). Cada uno cuesta S/ 129.50, pero si compran ambos (S/ 259.00) se llevan 1 TOMATODO DE REGALO. Además, siempre por cada 4 productos el 5to es gratis. Catálogo: Prunex 1 (S/ 76.00) limpia colon, Flora Liv (S/ 154.00) probióticos, Liquid Fiber (S/ 120.00), Alpha Balance (S/ 154.00). Chocolate Fit (S/ 140.00) ansiedad. Energía: Vita Xtra T+ (S/ 129.50), ON (S/ 129.50). Inmunitaria/Estética: Vera+ (S/ 169.00), Beauty-In (S/ 163.00), Golden Flx (S/ 150.00). ENTREGAS: Directas en HUANCAYO.";
            
            try {
                // Determine the original chat to reply to properly using the last message object logic or direct client API
                const chat = await msg.getChat();
                
                // Show typing indicator
                chat.sendStateTyping();
                
                const aiResponse = await generateChatbotResponse(conversationContext, contextData);
                
                // Save AI response to history
                history.push(`Asesor: ${aiResponse}`);

                await chat.sendMessage(aiResponse);
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

module.exports = {
    initializeWhatsApp,
    getWhatsAppClient
};
