
-- Extend eurofarma_profiles with profile fields
ALTER TABLE public.eurofarma_profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE UNIQUE INDEX IF NOT EXISTS eurofarma_profiles_personal_email_key
  ON public.eurofarma_profiles (lower(personal_email))
  WHERE personal_email IS NOT NULL;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_eurofarma_profiles_updated_at ON public.eurofarma_profiles;
CREATE TRIGGER update_eurofarma_profiles_updated_at
BEFORE UPDATE ON public.eurofarma_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars: each user manages their own folder (user_id/...)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Password reset tokens table (custom flow: RE login + personal email)
CREATE TABLE IF NOT EXISTS public.eurofarma_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eurofarma_password_resets_token_hash_idx
  ON public.eurofarma_password_resets (token_hash);

ALTER TABLE public.eurofarma_password_resets ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (edge functions) accesses this table.
