CREATE TABLE public.cliente_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  trinks_cliente_id bigint,
  full_name text,
  email text NOT NULL,
  phone text,
  birth_date date,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cliente_profiles TO authenticated;
GRANT ALL ON public.cliente_profiles TO service_role;
ALTER TABLE public.cliente_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes veem o próprio perfil" ON public.cliente_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Clientes criam o próprio perfil" ON public.cliente_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clientes atualizam o próprio perfil" ON public.cliente_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_cliente_profiles_updated_at BEFORE UPDATE ON public.cliente_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cliente_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cliente_login_codes TO service_role;
ALTER TABLE public.cliente_login_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX cliente_login_codes_email_idx ON public.cliente_login_codes (lower(email), created_at DESC);