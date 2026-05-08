import { NextResponse } from 'next/server';
import { getClients, updateClient, addClient } from '@/lib/clients';

export async function GET() {
    return NextResponse.json(getClients());
}

export async function POST(req) {
    const data = await req.json();
    if (data.id) {
        // Actualizar
        const success = updateClient(data.id, data.updates);
        return NextResponse.json({ success });
    } else {
        // Crear
        const newClient = addClient(data);
        return NextResponse.json(newClient);
    }
}
