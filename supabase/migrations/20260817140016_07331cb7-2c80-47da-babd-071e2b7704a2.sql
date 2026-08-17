CREATE TABLE public.eurofarma_dashboard_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  re text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX eurofarma_dashboard_access_re_idx ON public.eurofarma_dashboard_access (public.normalize_re(re));

GRANT SELECT, INSERT, DELETE ON public.eurofarma_dashboard_access TO authenticated;
GRANT ALL ON public.eurofarma_dashboard_access TO service_role;

ALTER TABLE public.eurofarma_dashboard_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_eurofarma_dashboard(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.eurofarma_profiles p
    JOIN public.eurofarma_dashboard_access a
      ON public.normalize_re(a.re) = public.normalize_re(p.re)
    WHERE p.user_id = _user_id
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE POLICY "Allowed users can view dashboard access list"
ON public.eurofarma_dashboard_access FOR SELECT TO authenticated
USING (public.can_access_eurofarma_dashboard(auth.uid()));

CREATE POLICY "Allowed users can add dashboard access"
ON public.eurofarma_dashboard_access FOR INSERT TO authenticated
WITH CHECK (public.can_access_eurofarma_dashboard(auth.uid()));

CREATE POLICY "Allowed users can remove dashboard access"
ON public.eurofarma_dashboard_access FOR DELETE TO authenticated
USING (public.can_access_eurofarma_dashboard(auth.uid()));

INSERT INTO public.eurofarma_dashboard_access (re, note) VALUES ('0000', 'Acesso inicial');

CREATE OR REPLACE FUNCTION public.eurofarma_dashboard_entries()
RETURNS TABLE(
  month_ref text,
  data date,
  profissional text,
  servico text,
  re text,
  valor numeric,
  rubrica text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_eurofarma_dashboard(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
    SELECT e.month_ref, e.data, e.profissional, e.servico, e.re, e.valor, e.rubrica
    FROM public.eurofarma_entries e;
END;
$$;

REVOKE ALL ON FUNCTION public.eurofarma_dashboard_entries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eurofarma_dashboard_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_eurofarma_dashboard(uuid) TO authenticated;