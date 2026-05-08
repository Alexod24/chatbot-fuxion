import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Access via global to avoid resolution issues
        const status = global.whatsappStatus || { state: 'DISCONNECTED', qr: null };
        return NextResponse.json(status);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
