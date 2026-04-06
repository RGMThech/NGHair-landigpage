
CREATE TABLE public.google_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  review_text TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  relative_time TEXT DEFAULT '',
  profile_photo_url TEXT DEFAULT '',
  google_review_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Google reviews are publicly viewable"
ON public.google_reviews
FOR SELECT
TO public
USING (true);
