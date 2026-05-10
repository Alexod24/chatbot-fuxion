const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env manually
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.+?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.+?)"/)[1];

const s = createClient(url, key);

async function check() {
    const { data, error } = await s.from('profiles').select('id, email');
    console.log(JSON.stringify({ data, error }, null, 2));
}

check();
