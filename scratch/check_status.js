const { whatsappManager } = require('../src/lib/whatsapp');
const status = whatsappManager.getStatus('d6ad5552-f84f-4f5f-aa97-86fca5a5402a');
console.log('Bot Status:', JSON.stringify(status, null, 2));
process.exit(0);
