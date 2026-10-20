-- Replace permissive USING (true) SELECT policies with real role predicates.

-- products: only signed-in team members with an assigned role can view
DROP POLICY IF EXISTS "Team can view products" ON public.products;
CREATE POLICY "Team can view products"
  ON public.products FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'sales_rep'::app_role)
    OR private.has_role(auth.uid(), 'accountant'::app_role)
  );

-- app_settings: full row (contact details, tax number, Sheets config) is admin-only
DROP POLICY IF EXISTS "Authenticated can view app settings" ON public.app_settings;
CREATE POLICY "Admins can view app settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- anon no longer reads the settings table directly; branding is served by a
-- SECURITY DEFINER function that returns only the non-sensitive branding columns.
DROP POLICY IF EXISTS "Anon can read branding columns" ON public.app_settings;
REVOKE SELECT ON public.app_settings FROM anon;

CREATE OR REPLACE FUNCTION public.get_app_branding()
RETURNS TABLE (
  id uuid,
  company_name text,
  app_name text,
  tagline text,
  logo_url text,
  brand_color text,
  currency text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, company_name, app_name, tagline, logo_url, brand_color, currency
  FROM public.app_settings
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_app_branding() TO anon, authenticated;
