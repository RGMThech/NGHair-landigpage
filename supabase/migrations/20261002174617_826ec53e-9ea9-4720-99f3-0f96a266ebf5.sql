CREATE TABLE public.api_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api text NOT NULL,
  endpoint text,
  metodo text,
  unidade text,
  status integer,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_call_log TO authenticated;
GRANT ALL ON public.api_call_log TO service_role;
ALTER TABLE public.api_call_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem consumo de API" ON public.api_call_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX api_call_log_created_idx ON public.api_call_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.api_consumo_diario(_inicio date, _fim date)
RETURNS TABLE(dia date, api text, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
    SELECT (l.created_at AT TIME ZONE 'America/Sao_Paulo')::date, l.api, count(*)
    FROM public.api_call_log l
    WHERE (l.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _inicio AND _fim
    GROUP BY 1, 2 ORDER BY 1 DESC, 2;
END; $$;
GRANT EXECUTE ON FUNCTION public.api_consumo_diario(date, date) TO authenticated;