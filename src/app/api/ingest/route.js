import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini';
import supabase from '@/lib/supabase';

export async function POST(request) {
    try {
        const { text, tenant_id } = await request.json();

        if (!text || !tenant_id) {
            return NextResponse.json({ error: "Missing text or tenant_id" }, { status: 400 });
        }

        // Generate embedding using Gemini
        const embedding = await generateEmbedding(text);

        // Store in Supabase
        const { data, error } = await supabase
            .from('documents')
            .insert({
                content: text,
                embedding: embedding,
                tenant_id: tenant_id
            });

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Ingested successfully" });
    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
