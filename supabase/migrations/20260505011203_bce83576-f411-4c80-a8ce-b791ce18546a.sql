
CREATE TABLE public.eurofarma_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  re TEXT NOT NULL UNIQUE,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eurofarma_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own eurofarma profile"
  ON public.eurofarma_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own eurofarma profile"
  ON public.eurofarma_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own eurofarma profile"
  ON public.eurofarma_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_eurofarma_profiles_updated_at
BEFORE UPDATE ON public.eurofarma_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
