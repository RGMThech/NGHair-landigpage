-- Códigos de login (OTP) do portal Vértice, enviados via SMTP pela edge function
-- vertice-login-code. Acesso apenas pelo service_role (sem policies para clientes).
CREATE TABLE public.vertice_login_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vertice_login_codes_email_idx ON public.vertice_login_codes (email, created_at DESC);

GRANT ALL ON public.vertice_login_codes TO service_role;
ALTER TABLE public.vertice_login_codes ENABLE ROW LEVEL SECURITY;
