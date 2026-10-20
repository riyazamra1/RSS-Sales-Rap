DROP POLICY IF EXISTS "Anon can read branding columns" ON public.app_settings;
REVOKE ALL ON public.app_settings FROM anon;
ALTER VIEW public.app_branding SET (security_invoker = off);
GRANT SELECT ON public.app_branding TO anon, authenticated;