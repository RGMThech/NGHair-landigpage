GRANT SELECT, INSERT, UPDATE, DELETE ON public.eurofarma_entries TO authenticated;
GRANT ALL ON public.eurofarma_entries TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.eurofarma_profiles TO authenticated;
GRANT ALL ON public.eurofarma_profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;

GRANT SELECT ON public.google_reviews TO anon;
GRANT SELECT ON public.google_reviews TO authenticated;
GRANT ALL ON public.google_reviews TO service_role;

GRANT ALL ON public.email_send_log TO service_role;
GRANT ALL ON public.email_send_state TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
GRANT ALL ON public.suppressed_emails TO service_role;
GRANT ALL ON public.eurofarma_password_resets TO service_role;