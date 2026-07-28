CREATE OR REPLACE FUNCTION public.normalize_re(_re text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(LTRIM(LOWER(TRIM(COALESCE(_re, ''))), '0'), ''), '0')
$$;

GRANT EXECUTE ON FUNCTION public.normalize_re(text) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "Users see only their own RE entries" ON public.eurofarma_entries;
DROP POLICY IF EXISTS "Users can insert own RE entries" ON public.eurofarma_entries;
DROP POLICY IF EXISTS "Users can delete own RE entries" ON public.eurofarma_entries;

CREATE POLICY "Users see only their own RE entries"
ON public.eurofarma_entries FOR SELECT TO authenticated
USING (public.normalize_re(re) = (
  SELECT public.normalize_re(p.re) FROM public.eurofarma_profiles p
  WHERE p.user_id = auth.uid() LIMIT 1
));

CREATE POLICY "Users can insert own RE entries"
ON public.eurofarma_entries FOR INSERT TO authenticated
WITH CHECK (public.normalize_re(re) = (
  SELECT public.normalize_re(p.re) FROM public.eurofarma_profiles p
  WHERE p.user_id = auth.uid() LIMIT 1
));

CREATE POLICY "Users can delete own RE entries"
ON public.eurofarma_entries FOR DELETE TO authenticated
USING (public.normalize_re(re) = (
  SELECT public.normalize_re(p.re) FROM public.eurofarma_profiles p
  WHERE p.user_id = auth.uid() LIMIT 1
));