import { NextResponse } from 'next/server';
const { whatsappManager } = require('@/lib/whatsapp');

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        await whatsappManager.initializeClient(userId);
        
        return NextResponse.json({ message: `Initializing WhatsApp for user ${userId}` });
    } catch (error) {
        console.error('Init WhatsApp Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
