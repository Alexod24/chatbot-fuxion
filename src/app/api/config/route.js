import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const configPath = path.join(process.cwd(), 'bot_config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const newConfig = await req.json();
        const configPath = path.join(process.cwd(), 'bot_config.json');
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
