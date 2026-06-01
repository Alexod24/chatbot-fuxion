-- TABLA DE PERFILES (Extensión de Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  is_active BOOLEAN DEFAULT true,
  whatsapp_client_id TEXT UNIQUE, -- ID para la sesión de whatsapp-web.js
  plan_end_date TIMESTAMP WITH TIME ZONE, -- Fecha límite del plan del cliente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los admins pueden ver todos los perfiles" 
ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TABLA DE CONFIGURACIÓN DEL BOT POR USUARIO
CREATE TABLE IF NOT EXISTS public.bot_configs (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_prompt TEXT NOT NULL,
  welcome_message TEXT,
  model_name TEXT DEFAULT 'gemini-1.5-flash',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden gestionar su propia config" 
ON public.bot_configs FOR ALL USING (auth.uid() = user_id);

-- TABLA DE PROSPECTOS (Migración de prospects.json)
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  name TEXT,
  last_message TEXT,
  status TEXT DEFAULT 'nuevo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios prospectos" 
ON public.prospects FOR SELECT USING (auth.uid() = user_id);

-- TABLA DE REGISTRO DE USO (Para facturación/control)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT DEFAULT 'chat',
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio uso" 
ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins ven todo el uso" 
ON public.usage_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan_end_date)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client', NULL);
  
  INSERT INTO public.bot_configs (user_id, expert_prompt)
  VALUES (new.id, 'Eres un asesor experto de ventas para Fuxion.');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER PARA NUEVOS USUARIOS
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
