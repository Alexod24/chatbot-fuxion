import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        
        if (body.id && body.updates) {
            // Update existing profile
            const { data, error } = await supabase
                .from('profiles')
                .update(body.updates)
                .eq('id', body.id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            // Create new client (Supabase Auth + Profile)
            const { name, email, password = 'Password123!', payment } = body;

            // 1. Create User in Supabase Auth (using service role)
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (authError) throw authError;

            // Note: The trigger in supabase_production_schema.sql will automatically 
            // create the profile and bot_config. If not, we could do it here.
            
            return NextResponse.json({ 
                message: 'Client created successfully', 
                user: authData.user 
            });
        }
    } catch (error) {
        console.error('API Clients Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

