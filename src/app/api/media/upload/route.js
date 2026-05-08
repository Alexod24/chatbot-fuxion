import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const fileName = formData.get('name'); // e.g., 'bienvenida'
        const userEmail = formData.get('email'); // Para la carpeta personal

        if (!file || !userEmail) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Crear carpeta del usuario si no existe
        const userDir = path.join(process.cwd(), 'public', 'audios', userEmail);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        // Guardar archivo (forzamos .ogg para WhatsApp)
        const filePath = path.join(userDir, `${fileName}.ogg`);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, path: `/audios/${userEmail}/${fileName}.ogg` });
    } catch (error) {
        console.error("Error en upload:", error);
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
    }
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) return NextResponse.json([]);

    const userDir = path.join(process.cwd(), 'public', 'audios', email);
    if (!fs.existsSync(userDir)) return NextResponse.json([]);

    const files = fs.readdirSync(userDir)
        .filter(f => f.endsWith('.ogg'))
        .map(f => f.replace('.ogg', ''));

    return NextResponse.json(files);
}
