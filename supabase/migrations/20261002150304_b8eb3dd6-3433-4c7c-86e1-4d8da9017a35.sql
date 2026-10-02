CREATE TABLE public.esmaltes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etiqueta integer,
  marca text,
  serie text,
  cor text,
  validade date,
  data_cadastro date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Prateleira',
  motivo text,
  data_removido date,
  unidade text NOT NULL DEFAULT 'Campo Belo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esmaltes TO authenticated;
GRANT ALL ON public.esmaltes TO service_role;
ALTER TABLE public.esmaltes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam esmaltes" ON public.esmaltes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_esmaltes_updated_at BEFORE UPDATE ON public.esmaltes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX esmaltes_unidade_status_idx ON public.esmaltes(unidade, status);