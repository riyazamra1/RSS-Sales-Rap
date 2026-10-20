ALTER VIEW public.app_branding SET (security_invoker = on);
GRANT SELECT (id, company_name, app_name, tagline, logo_url, brand_color, currency) ON public.app_settings TO anon;
CREATE POLICY "Anon can read branding columns" ON public.app_settings FOR SELECT TO anon USING (true);