import { NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const messageId = searchParams.get('messageId');

        if (!userId || !messageId) {
            return new NextResponse("Faltan parámetros", { status: 400 });
        }

        const targetUserId = (userId === 'default') ? 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a' : userId;
        
        // Obtener el cliente de WhatsApp activo
        const client = whatsappManager.getClient(targetUserId);
        
        if (!client) {
            return new NextResponse("El bot de WhatsApp no está conectado o inicializado para este usuario", { status: 503 });
        }

        // Buscar el mensaje original en WhatsApp
        const msg = await client.getMessageById(messageId);
        
        if (!msg) {
            return new NextResponse("Mensaje original no encontrado en WhatsApp", { status: 404 });
        }

        // Descargar la media del mensaje
        const media = await msg.downloadMedia();
        
        if (!media || !media.data) {
            return new NextResponse("No se pudo descargar el audio o no contiene media", { status: 404 });
        }

        // Convertir base64 a Buffer
        const audioBuffer = Buffer.from(media.data, 'base64');

        // Retornar la respuesta con el tipo MIME correcto (usualmente audio/ogg; codecs=opus)
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': media.mimetype || 'audio/ogg',
                'Cache-Control': 'public, max-age=86400', // Cache por 1 día
            }
        });

    } catch (error) {
        console.error("Error reproduciendo audio:", error);
        return new NextResponse(`Error interno: ${error.message}`, { status: 500 });
    }
}
