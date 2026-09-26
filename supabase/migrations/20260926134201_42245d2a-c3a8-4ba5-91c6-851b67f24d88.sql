CREATE TABLE public.vertice_authorized_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX vertice_authorized_emails_email_key ON public.vertice_authorized_emails (lower(trim(email)));

GRANT SELECT ON public.vertice_authorized_emails TO authenticated;
GRANT ALL ON public.vertice_authorized_emails TO service_role;
ALTER TABLE public.vertice_authorized_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vertice authorized emails" ON public.vertice_authorized_emails
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert vertice authorized emails" ON public.vertice_authorized_emails
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete vertice authorized emails" ON public.vertice_authorized_emails
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.vertice_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  accepted_terms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX vertice_profiles_user_id_key ON public.vertice_profiles (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vertice_profiles TO authenticated;
GRANT ALL ON public.vertice_profiles TO service_role;
ALTER TABLE public.vertice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vertice profile" ON public.vertice_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vertice profile" ON public.vertice_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vertice profile" ON public.vertice_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vertice_profiles_updated_at
  BEFORE UPDATE ON public.vertice_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_vertice_authorized(email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vertice_authorized_emails
    WHERE lower(trim(email)) = lower(trim($1))
  ) OR EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE lower(trim(u.email)) = lower(trim($1))
      AND ur.role = 'admin'::app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_vertice_authorized(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_vertice_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.is_vertice_admin(uuid) TO authenticated;