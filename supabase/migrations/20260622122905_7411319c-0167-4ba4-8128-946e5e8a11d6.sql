CREATE POLICY "Allow anonymous uploads on obra-nghair"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'obra-nghair');

CREATE POLICY "Allow anonymous reads on obra-nghair"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'obra-nghair');