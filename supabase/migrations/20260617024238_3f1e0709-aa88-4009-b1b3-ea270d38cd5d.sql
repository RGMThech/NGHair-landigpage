
-- 1. Explicit service-role-only policies for eurofarma_password_resets.
--    RLS is enabled but had no policies. This documents intent and ensures
--    only the backend (service_role) can read/write tokens via the API.
DROP POLICY IF EXISTS "Service role manages password resets" ON public.eurofarma_password_resets;
CREATE POLICY "Service role manages password resets"
  ON public.eurofarma_password_resets
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Revoke API access from anon/authenticated; keep service_role only.
REVOKE ALL ON public.eurofarma_password_resets FROM anon, authenticated;
GRANT ALL ON public.eurofarma_password_resets TO service_role;

-- 2. Pin search_path on any remaining functions that lack it.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
