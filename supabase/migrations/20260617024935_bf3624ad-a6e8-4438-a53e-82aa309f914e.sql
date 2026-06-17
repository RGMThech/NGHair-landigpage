
-- Create admin role infrastructure
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Seed sole admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('b9074cb7-791f-4f17-8382-d0e165966dee', 'admin');

-- Tighten gallery_images: admin-only mutations
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Authenticated users can update gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON public.gallery_images;

CREATE POLICY "Admins can insert gallery images" ON public.gallery_images
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gallery images" ON public.gallery_images
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery images" ON public.gallery_images
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tighten storage gallery mutations to admin only
DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON storage.objects;

CREATE POLICY "Admins can upload gallery storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

-- Restrict public bucket LISTING (public URLs keep working since buckets are public)
DROP POLICY IF EXISTS "Gallery images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
