DROP POLICY IF EXISTS "Allow anonymous uploads on obra-nghair" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads on obra-nghair" ON storage.objects;

CREATE POLICY "Authenticated uploads on obra-nghair"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'obra-nghair');

CREATE POLICY "Authenticated reads on obra-nghair"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'obra-nghair');