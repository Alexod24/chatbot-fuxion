
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAudioTable() {
    console.log("--- Configurando Tabla de Audios ---");
    
    // Intentar crear la tabla vía SQL (si el usuario tiene habilitado rpc o similar)
    // Pero como no podemos asegurar rpc, intentaremos insertar un registro de prueba
    // para ver si la tabla existe, y si no, daremos las instrucciones de SQL.
    
    const { error } = await supabase
        .from('bot_audios')
        .select('*')
        .limit(1);

    if (error && error.code === 'PGRST116' || error && error.message.includes('relation "bot_audios" does not exist')) {
        console.log("La tabla 'bot_audios' no existe. Por favor ejecuta este SQL en tu consola de Supabase:");
        console.log(`
            CREATE TABLE bot_audios (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                message_id TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, name)
            );
            
            ALTER TABLE bot_audios ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Users can manage their own audios" ON bot_audios
                FOR ALL USING (auth.uid() = user_id);
        `);
    } else {
        console.log("✅ La tabla 'bot_audios' ya está lista.");
    }
}

setupAudioTable();
