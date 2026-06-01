const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.+?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.+?)"/)[1];

const s = createClient(url, key);

async function check() {
    const targetId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';
    const { data: config, error } = await s.from('bot_configs').select('expert_prompt').eq('user_id', targetId).single();
    if (error) {
        console.error("Error fetching config:", error);
    } else {
        console.log("=== EXPERT PROMPT ===");
        console.log(config.expert_prompt);
    }
}

check();
