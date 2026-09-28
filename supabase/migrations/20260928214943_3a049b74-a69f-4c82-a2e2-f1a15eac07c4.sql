CREATE TABLE public.vertice_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_ref text NOT NULL,
  data date,
  hora text,
  profissional text,
  servico text,
  cliente text,
  email text NOT NULL,
  valor numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vertice_entries_email_idx ON public.vertice_entries (lower(trim(email)), month_ref);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vertice_entries TO authenticated;
GRANT ALL ON public.vertice_entries TO service_role;
ALTER TABLE public.vertice_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage vertice entries" ON public.vertice_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users see own vertice entries" ON public.vertice_entries FOR SELECT TO authenticated
  USING (lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));