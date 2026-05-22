
require('dotenv').config();
const { supabase } = require('../src/lib/supabase');
const fs = require('fs');

async function syncConfig() {
    const config = JSON.parse(fs.readFileSync('./bot_config.json', 'utf8'));
    const targetUserId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';

    console.log(`Sincronizando prompt para el usuario: ${targetUserId}...`);

    const { data, error } = await supabase
        .from('bot_configs')
        .upsert({
            user_id: targetUserId,
            expert_prompt: config.expert_prompt,
            updated_at: new Date()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("Error al sincronizar con Supabase:", error);
    } else {
        console.log("✅ Prompt sincronizado con éxito en Supabase.");
    }
    process.exit();
}

syncConfig();
