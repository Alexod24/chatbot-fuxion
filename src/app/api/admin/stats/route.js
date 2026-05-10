import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Total de peticiones
        const { count: totalRequests, error: err1 } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true });

        if (err1) throw err1;

        // 2. Peticiones de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayRequests, error: err2 } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (err2) throw err2;

        // 3. Usuarios activos (con sesión de whatsapp)
        const { count: activeSessions, error: err3 } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .not('whatsapp_client_id', 'is', null);

        if (err3) throw err3;

        // 4. Calcular Gasto Total en Soles (PEN)
        const { data: usageData, error: err4 } = await supabase
            .from('usage_logs')
            .select('tokens_input, tokens_output');

        if (err4) throw err4;

        let totalInput = 0;
        let totalOutput = 0;
        usageData?.forEach(row => {
            totalInput += (row.tokens_input || 0);
            totalOutput += (row.tokens_output || 0);
        });

        // Precios Gemini 1.5 Flash 8B (USD por token)
        const priceInputUSD = 0.0375 / 1000000;
        const priceOutputUSD = 0.15 / 1000000;
        const exchangeRate = 3.75; // USD to PEN

        const totalCostUSD = (totalInput * priceInputUSD) + (totalOutput * priceOutputUSD);
        const totalCostPEN = totalCostUSD * exchangeRate;

        return NextResponse.json({
            totalRequests: totalRequests || 0,
            todayRequests: todayRequests || 0,
            activeSessions: activeSessions || 0,
            totalTokens: totalInput + totalOutput,
            totalCostPEN: totalCostPEN.toFixed(4) // 4 decimales para ver hasta el céntimo
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
