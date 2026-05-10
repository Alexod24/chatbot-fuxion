import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ID de respaldo para desarrollo (Debe existir en la tabla public.profiles)
const DEFAULT_UUID = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';
const LEGACY_UUID = '00000000-0000-0000-0000-000000000000';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const finalUserId = (!userId || userId === 'default' || userId === LEGACY_UUID) ? DEFAULT_UUID : userId;

    try {
        const { data, error } = await supabase
            .from('bot_configs')
            .select('*')
            .eq('user_id', finalUserId)
            .single();
        
        // Si no existe, devolvemos una config básica en lugar de error
        if (!data) {
            return NextResponse.json({ expert_prompt: 'Eres un asesor experto de Fuxion.' });
        }
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}


export async function POST(req) {
    try {
        const { userId, expert_prompt, welcome_message } = await req.json();
        const finalUserId = (!userId || userId === 'default' || userId === LEGACY_UUID) ? DEFAULT_UUID : userId;

        const { data, error } = await supabase
            .from('bot_configs')
            .upsert({ 
                user_id: finalUserId, 
                expert_prompt: (expert_prompt || '').trim(), 
                welcome_message,
                updated_at: new Date().toISOString() 
            })
            .select();

        if (error) {
            console.error("Supabase Save Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Critical Save Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}




