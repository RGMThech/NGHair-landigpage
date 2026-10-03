ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'campo-belo';
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS published_at timestamptz;
GRANT SELECT ON public.google_reviews TO anon, authenticated;
GRANT ALL ON public.google_reviews TO service_role;