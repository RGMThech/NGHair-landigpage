INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role FROM public.cliente_profiles p
WHERE lower(p.email) LIKE '%@nghair.com.br'
ON CONFLICT (user_id, role) DO NOTHING;