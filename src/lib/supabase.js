const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si no hay URL (como en el build), creamos un Proxy para evitar crashes
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : new Proxy({}, {
      get: () => () => ({ 
        from: () => ({ 
          select: () => ({ 
            eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
            limit: () => Promise.resolve({ data: [], error: null })
          }) 
        }) 
      })
    });

module.exports = { supabase };
