const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.+?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.+?)"/)[1];

const s = createClient(url, key);

async function check() {
    const targetId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';
    const { data: config, error } = await s.from('bot_configs').select('*').eq('user_id', targetId).single();
    if (error) {
        console.error("Error fetching config:", error);
    } else {
        console.log("Current Config in DB:");
        console.log(JSON.stringify(config, null, 2));
    }
    
    // Also let's check bot_knowledge
    const { data: knowledge, error: kError } = await s.from('bot_knowledge').select('*').eq('user_id', targetId);
    if (kError) {
        console.error("Error fetching knowledge:", kError);
    } else {
        console.log("Current Knowledge in DB counts:", knowledge ? knowledge.length : 0);
        console.log(JSON.stringify(knowledge, null, 2));
    }
}

check();
