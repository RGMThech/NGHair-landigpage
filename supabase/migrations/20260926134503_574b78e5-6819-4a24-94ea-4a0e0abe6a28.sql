CREATE POLICY "Users can delete own vertice profile" ON public.vertice_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);