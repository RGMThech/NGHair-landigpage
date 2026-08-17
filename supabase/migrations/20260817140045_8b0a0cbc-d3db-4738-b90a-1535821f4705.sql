REVOKE ALL ON FUNCTION public.eurofarma_dashboard_entries() FROM anon;
REVOKE ALL ON FUNCTION public.can_access_eurofarma_dashboard(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.normalize_re(text) FROM anon;