import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Validar si es un UUID válido (formato de Supabase)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!userId || !uuidRegex.test(userId)) {
            console.warn(`⚠️ Invalid or missing UUID: ${userId}. Returning empty prospects.`);
            return NextResponse.json([]);
        }

        const { data, error } = await supabase
            .from('prospects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Prospects Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

