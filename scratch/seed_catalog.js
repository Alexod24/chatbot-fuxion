require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const targetUserId = 'd6ad5552-f84f-4f5f-aa97-86fca5a5402a';

const catalog = [
  {
    "id": "prunex1",
    "nombre": "Prunex 1",
    "desc": "Té herbal laxante. Estimula el tránsito intestinal y limpia el colon profunda y eficazmente.",
    "precio": "Caja 28 sticks *S/ 76.00*, Pack 7 sticks *S/ 21.00*",
    "keywords": ["estreñimiento", "no puedo ir al baño", "estreñido", "limpieza de colon", "detox", "pesadez", "digestion lenta", "prunex", "prunes", "digestion"]
  },
  {
    "id": "floraliv",
    "nombre": "Flora Liv",
    "desc": "Bebida de granadilla con miles de millones de probióticos. Regenera flora intestinal y refuerza defensas.",
    "precio": "Caja 28 sticks *S/ 154.00*",
    "keywords": ["gastritis", "gases", "acidez", "reflujo", "flora intestinal", "probioticos", "diarrea", "indigestión", "flora liv", "floraliv", "digestion"]
  },
  {
    "id": "thermot3",
    "nombre": "Thermo T3",
    "desc": "Té termogénico (té verde, negro y rojo). Quema grasa, acelera metabolismo y transforma grasa en energía.",
    "precio": "Caja 28 sticks *S/ 129.50*, Pack 7 sticks *S/ 36.50*",
    "keywords": ["bajar de peso", "quemar grasa", "adelgazar", "reducir medidas", "termogenico", "grasa abdominal", "sudar", "thermo t3", "termo t3", "termo3", "peso"]
  },
  {
    "id": "nocarb_t",
    "nombre": "No Stress / NoCarb-T",
    "desc": "Té que inhibe la asimilación parcial de carbohidratos y azúcares. Regula la glucosa en sangre.",
    "precio": "Caja 28 sticks *S/ 129.50*",
    "keywords": ["diabetes", "azucar", "carbohidratos", "harinas", "dulces", "ansiedad por comer", "glucosa", "no carb", "nocarb", "no stress", "peso"]
  },
  {
    "id": "vitaxstrat",
    "nombre": "Vita Xtra T+",
    "desc": "Energizante natural con micelio de cordyceps y maca. Elimina la fatiga y mejora el ánimo diario.",
    "precio": "Caja 28 sticks *S/ 129.50*, Pack 7 sticks *S/ 36.50*",
    "keywords": ["energia", "cansancio", "sueño", "fatiga", "desanimado", "pereza", "rendimiento", "vita energia", "vita xtra", "vitalidad"]
  },
  {
    "id": "on",
    "nombre": "ON",
    "desc": "Bebida para activación neuronal con taurina y yerba mate. Mejora concentración, memoria y foco mental.",
    "precio": "Caja 28 sticks *S/ 105.00*, Pack 7 sticks *S/ 29.00*",
    "keywords": ["estudiar", "concentracion", "memoria", "foco", "mente", "distraido", "examen", "trabajar", "on", "energia"]
  },
  {
    "id": "off",
    "nombre": "OFF",
    "desc": "Bebida relajante a base de aminoácidos y magnesio. Reduce estrés, ansiedad e insomnio sin causar somnolencia.",
    "precio": "Caja 28 sticks *S/ 129.50*",
    "keywords": ["estres", "ansiedad", "insomnio", "dormir", "relajar", "nervios", "tension", "off"]
  },
  {
    "id": "cool_age",
    "nombre": "Cool Age / Beauty In",
    "desc": "Colágeno hidrolizado optimizado con coenzima Q10. Nutre piel, fortalece cabello y uñas.",
    "precio": "Caja 28 sticks *S/ 163.00*",
    "keywords": ["colageno", "arrugas", "piel", "cabello", "caida de cabello", "uñas", "envejecimiento", "cool age", "beauty"]
  },
  {
    "id": "golden_flx",
    "nombre": "Golden Flx",
    "desc": "Bebida de extracto de cúrcuma y jengibre. Desinflama y protege articulaciones y flexibilidad muscular.",
    "precio": "Caja 28 sticks *S/ 143.00*",
    "keywords": ["articulaciones", "dolor de rodilla", "huesos", "artritis", "artrosis", "inflamacion", "flexibilidad", "golden", "curcuma"]
  },
  {
    "id": "veramas",
    "nombre": "Veramás",
    "desc": "Té herbal con Wellmune y aloe vera. Refuerza el sistema inmunológico y previene alergias respiratorias.",
    "precio": "Caja 28 sticks *S/ 169.00*",
    "keywords": ["alergia", "gripe", "tos", "asma", "defensas bajas", "inmunidad", "sistema inmune", "resfriado", "veramas", "vera +"]
  },
  {
    "id": "ganomas",
    "nombre": "Ganó+ Cappuccino",
    "desc": "Café cappuccino con extracto de Ganoderma Lucidum. Eleva defensas corporales y previene daño oxidativo.",
    "precio": "Caja 28 sticks *S/ 92.50*",
    "keywords": ["cafe", "defensas", "antioxidante", "ganoderma", "longevidad", "hongo", "gano mas", "ganomas"]
  },
  {
    "id": "berry_balance",
    "nombre": "Berry Balance",
    "desc": "Bebida de cranberry y piña. Protege el tracto urinario, evita infecciones y elimina retención de líquidos.",
    "precio": "Caja 28 sticks *S/ 169.00*",
    "keywords": ["infeccion urinaria", "orinar", "riñones", "retencion de liquidos", "hinchazon", "cranberry", "berry balance", "berries"]
  },
  {
    "id": "rexet",
    "nombre": "Rexet",
    "desc": "Bebida efervescente depurativa para el hígado. Ideal para desintoxicar y aliviar la resaca.",
    "precio": "Caja 28 sticks *S/ 129.50*, Pack 7 sticks *S/ 36.50*",
    "keywords": ["resaca", "alcohol", "higado graso", "detox higado", "intoxicacion", "boda", "fiesta", "rexet", "reset", "digestion"]
  },
  {
    "id": "probix",
    "nombre": "Probix / Probal",
    "desc": "Bebida para el equilibrio glandular y hormonal. Protege próstata en hombres y alivia menopausia/cólicos en mujeres.",
    "precio": "Caja 28 sticks *S/ 162.50*",
    "keywords": ["hormonas", "colicos", "menopausia", "prostata", "menstruacion", "acne hormonal", "probal", "probix"]
  },
  {
    "id": "biopro_tect",
    "nombre": "BioPro Tect",
    "desc": "Batido proteico con calostro (BioProtein+). Regeneración celular máxima y potenciador inmunológico para toda la familia.",
    "precio": "Caja 14 sticks *S/ 139.50*",
    "keywords": ["proteina", "nutricion", "niños", "ancianos", "subir de peso", "defensas", "biopro", "tect"]
  },
  {
    "id": "pre_sport",
    "nombre": "Pre Sport",
    "desc": "Bebida hidratante con citrulina y creatina. Prepara los músculos, aporta energía y previene la fatiga durante el ejercicio.",
    "precio": "Caja 28 sticks *S/ 143.00*",
    "keywords": ["entrenar", "gimnasio", "antes de entrenar", "pre entreno", "ejercicio", "rendimiento deportivo", "pre sport", "energia"]
  },
  {
    "id": "post_sport",
    "nombre": "Post Sport",
    "desc": "Bebida recuperadora con glutamina y agua de coco. Rehidrata, evita calambres y repara las fibras musculares.",
    "precio": "Caja 28 sticks *S/ 143.00*",
    "keywords": ["recuperacion", "musculo", "dolor muscular", "calambres", "despues de entrenar", "post entreno", "post sport"]
  }
];

async function seed() {
    console.log("Sincronizando el catálogo de productos con Supabase...");

    const { data, error } = await supabase
        .from('bot_knowledge')
        .upsert({
            user_id: targetUserId,
            keyword: 'CATALOGO',
            content: JSON.stringify(catalog)
        }, { onConflict: 'user_id, keyword' });

    if (error) {
        console.error("Error al sincronizar catálogo:", error);
    } else {
        console.log("✅ Catálogo sincronizado con éxito. 17 productos listos.");
    }
    process.exit();
}

seed();
