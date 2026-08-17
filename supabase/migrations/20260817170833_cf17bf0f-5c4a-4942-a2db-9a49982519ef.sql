DROP FUNCTION IF EXISTS public.eurofarma_dashboard_entries();

CREATE FUNCTION public.eurofarma_dashboard_entries()
 RETURNS TABLE(month_ref text, data date, profissional text, servico text, cliente text, re text, valor numeric, rubrica text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_access_eurofarma_dashboard(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
    SELECT e.month_ref, e.data, e.profissional, e.servico, e.cliente, e.re, e.valor, e.rubrica
    FROM public.eurofarma_entries e;
END;
$function$;