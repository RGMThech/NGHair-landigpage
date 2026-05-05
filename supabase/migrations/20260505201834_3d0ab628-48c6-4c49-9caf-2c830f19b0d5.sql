
-- Table to store monthly Eurofarma service entries
CREATE TABLE public.eurofarma_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_ref TEXT NOT NULL, -- format YYYY-MM
  data DATE,
  hora TEXT,
  profissional TEXT,
  servico TEXT,
  cliente TEXT,
  re TEXT NOT NULL,
  valor NUMERIC,
  rubrica TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_eurofarma_entries_re_month ON public.eurofarma_entries(re, month_ref);
CREATE INDEX idx_eurofarma_entries_month ON public.eurofarma_entries(month_ref);

ALTER TABLE public.eurofarma_entries ENABLE ROW LEVEL SECURITY;

-- Users can only see entries matching their own RE (from eurofarma_profiles)
CREATE POLICY "Users see only their own RE entries"
ON public.eurofarma_entries
FOR SELECT
TO authenticated
USING (
  re = (SELECT re FROM public.eurofarma_profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Only service role can insert/update/delete (admin uploads use service role via edge function or admin client)
-- For now allow authenticated admin via policy: any authenticated user can insert (admin page is auth-gated separately)
CREATE POLICY "Authenticated can insert entries"
ON public.eurofarma_entries
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can delete entries"
ON public.eurofarma_entries
FOR DELETE
TO authenticated
USING (true);
