
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a'; // Tu ID de administrador

const knowledgeBase = [
    {
        keyword: 'DIGESTION',
        content: `Línea de Limpieza y Desintoxicación:
- Prunex 1: Té herbal para tránsito lento y estreñimiento. S/ 76.00 (28 sticks) | S/ 21.00 (7 sticks).
- Flora Liv: 10 mil millones de probióticos para flora y defensas. S/ 154.00 (28 sticks).
- Liquid Fiber: Fibra prebiótica para regularidad. S/ 105.00 (28 sticks).
- Rexet: Desintoxicación de hígado. S/ 129.50 (28 sticks) | S/ 36.50 (7 sticks).
- Alpha Balance: Vegetales alcalinizantes para pH. S/ 129.50.
- Berry Balance: Protección urinaria y retención de líquidos. S/ 169.00.
- Pack Detox 5 Días: Programa de purificación completo. S/ 175.00.`
    },
    {
        keyword: 'PESO',
        content: `Línea de Control de Peso:
- Thermo T3: Quemador de grasa (té). S/ 129.50 (28 sticks) | S/ 36.50 (7 sticks).
- NoCarb-T: Inhibe absorción de carbohidratos/azúcar. S/ 129.50.
- Chocolate Fit: Bebida saciante, acelera metabolismo. S/ 92.50.
- Biopro+ Fit: Proteína para eliminar grasa y tonificar. S/ 108.00.
- Protein Active Fit: Proteína vegetal para medidas. S/ 149.50.
- Café Fit / Cappuccino Fit: Control de apetito y medidas. S/ 159.50 / S/ 109.50.
- Pack 5/14 (Keto/Mito): Programa 14 días para bajar 5% peso. S/ 399.00 | S/ 435.00.`
    },
    {
        keyword: 'ENERGIA',
        content: `Línea de Energía y Revitalización:
- Vita Xtra T+: Energizante físico y mental con maíz morado. S/ 129.50 (28 sticks) | S/ 36.50 (7 sticks).
- Nutraday: Micronutrientes para niños. S/ 129.50.
- Vitaenergia: Multivitamínico contra fatiga. S/ 129.50.
- Xpeed: Energizante natural gasificado (lata). S/ 39.50 (pack x4).`
    },
    {
        keyword: 'PRUNEX',
        content: 'Prunex 1: Té herbal de guindón y anís para tránsito intestinal lento y estreñimiento. Limpieza profunda de colon. Precios: Caja 28 sticks S/ 76.00 | Caja 7 sticks S/ 21.00.'
    },
    {
        keyword: 'THERMO',
        content: 'Thermo T3: Té quemador de grasa con Té Verde, Rojo y Negro. Transforma reservas de grasa en energía. Precios: Caja 28 sticks S/ 129.50 | Caja 7 sticks S/ 36.50.'
    },
    {
        keyword: 'VITA',
        content: 'Vita Xtra T+: Bebida energizante con Guayusa, Té Verde y Acai Berry. Da energía duradera sin efecto rebote. Precios: Caja 28 sticks S/ 129.50 | Caja 7 sticks S/ 36.50.'
    },
    {
        keyword: 'FLORA',
        content: 'Flora Liv: Cultivos probióticos (10 mil millones), fibra prebiótica y aguaymanto. Regenera flora intestinal. Precio: Caja 28 sticks S/ 154.00.'
    },
    {
        keyword: 'NOCARB',
        content: 'NoCarb-T: Té de canela y manzana que ayuda a reducir la asimilación de azúcares y carbohidratos en la sangre. Precio: Caja 28 sticks S/ 129.50.'
    },
    {
        keyword: 'ON',
        content: 'ON: Refresco de té verde y aminoácidos para enfoque mental y memoria. Precios: Caja 28 sticks S/ 105.00 | Caja 7 sticks S/ 29.00.'
    }
];

async function seedKnowledge() {
    console.log('Iniciando carga de conocimientos...');
    
    for (const item of knowledgeBase) {
        const { error } = await supabase
            .from('bot_knowledge')
            .upsert({
                user_id: userId,
                keyword: item.keyword,
                content: item.content
            }, { onConflict: 'user_id, keyword' });
            
        if (error) {
            console.error(`Error cargando ${item.keyword}:`, error.message);
        } else {
            console.log(`✅ ${item.keyword} cargado correctamente.`);
        }
    }
    
    console.log('¡Carga completada!');
}

seedKnowledge();
