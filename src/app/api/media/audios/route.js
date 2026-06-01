import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('bot_audios')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const audioName = searchParams.get('name');
        
        if (!userId || !audioName) {
            return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
        }

        const { error } = await supabase
            .from('bot_audios')
            .delete()
            .eq('user_id', userId)
            .eq('name', audioName);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
