import { NextResponse } from 'next/server';
const { whatsappManager } = require('@/lib/whatsapp');

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'default';
        
        const status = whatsappManager.getStatus(userId);
        return NextResponse.json(status);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

