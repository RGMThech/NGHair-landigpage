
DROP POLICY IF EXISTS "Authenticated can insert entries" ON public.eurofarma_entries;
DROP POLICY IF EXISTS "Authenticated can delete entries" ON public.eurofarma_entries;

CREATE POLICY "Users can insert own RE entries"
ON public.eurofarma_entries
FOR INSERT
TO authenticated
WITH CHECK (re = (SELECT re FROM public.eurofarma_profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can delete own RE entries"
ON public.eurofarma_entries
FOR DELETE
TO authenticated
USING (re = (SELECT re FROM public.eurofarma_profiles WHERE user_id = auth.uid() LIMIT 1));
