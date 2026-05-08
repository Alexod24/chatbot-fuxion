const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { generateChatbotResponse } = require('./gemini');

class WhatsAppManager {
    constructor() {
        this.clients = new Map(); // Map<userId, Client>
        this.statuses = new Map(); // Map<userId, { state: string, qr: string }>
    }

    /**
     * Initializes a WhatsApp client for a specific user.
     * @param {string} userId - The unique ID of the user/tenant.
     */
    async initializeClient(userId) {
        if (this.clients.has(userId)) {
            console.log(`[WhatsApp] Client already exists for user ${userId}`);
            return;
        }

        console.log(`[WhatsApp] Initializing Client for user: ${userId}`);
        
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: `client-${userId}`,
                dataPath: path.join(process.cwd(), '.wwebjs_auth')
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                // Needed for Digital Ocean/Linux environments
                executablePath: process.env.CHROME_PATH || null 
            }
        });

        const status = { state: 'DISCONNECTED', qr: null };
        this.statuses.set(userId, status);
        this.clients.set(userId, client);

        client.on('qr', (qr) => {
            console.log(`[WhatsApp] QR Generated for user ${userId}`);
            status.qr = qr;
            status.state = 'QR_READY';
        });

        client.on('ready', () => {
            console.log(`[WhatsApp] Client READY for user ${userId}`);
            status.state = 'CONNECTED';
            status.qr = null;
        });

        client.on('authenticated', () => {
            console.log(`[WhatsApp] Authenticated for user ${userId}`);
            status.state = 'AUTHENTICATED';
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WhatsApp] Auth Failure for user ${userId}:`, msg);
            status.state = 'DISCONNECTED';
        });

        client.on('disconnected', (reason) => {
            console.log(`[WhatsApp] Disconnected for user ${userId}:`, reason);
            status.state = 'DISCONNECTED';
            // Optional: Auto-reconnect logic
        });

        // Message Handling Logic
        client.on('message_create', async (msg) => {
            if (msg.fromMe) return;
            if (msg.isStatus || msg.from === 'status@broadcast' || msg.from.includes('@g.us')) return;

            // Basic ping test
            if (msg.body === '!ping') {
                await msg.reply('pong!');
                return;
            }

            // --- AI Logic ---
            try {
                // Get user-specific config (placeholder for Supabase call)
                // const config = await getBotConfig(userId);
                const systemPrompt = "Eres un asesor experto de Fuxion."; 
                
                const aiResponse = await generateChatbotResponse(msg.body, systemPrompt, userId);
                
                const chat = await msg.getChat();
                await chat.sendStateTyping();
                await chat.sendMessage(aiResponse);
            } catch (err) {
                console.error(`[WhatsApp] Error processing message for ${userId}:`, err);
            }
        });

        client.initialize().catch(err => {
            console.error(`[WhatsApp] Failed to initialize client for ${userId}:`, err);
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

// Singleton instance for the whole app
const manager = new WhatsAppManager();

module.exports = {
    whatsappManager: manager,
    // Legacy support for single-instance if needed during migration
    initializeWhatsApp: () => manager.initializeClient('default'),
    getWhatsAppStatus: () => manager.getStatus('default')
};

