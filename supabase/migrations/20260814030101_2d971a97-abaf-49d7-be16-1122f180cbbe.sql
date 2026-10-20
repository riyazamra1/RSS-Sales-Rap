-- Branding: invoker view + column-limited anon access
DROP VIEW IF EXISTS public.app_branding;
CREATE VIEW public.app_branding WITH (security_invoker = on) AS
  SELECT id, company_name, app_name, tagline, logo_url, brand_color, currency FROM public.app_settings;
GRANT SELECT ON public.app_branding TO anon, authenticated, service_role;
GRANT SELECT (id, company_name, app_name, tagline, logo_url, brand_color, currency) ON public.app_settings TO anon;
CREATE POLICY "Anon can read branding columns" ON public.app_settings FOR SELECT TO anon USING (true);

-- Product cost moved to admin-only table
DROP VIEW IF EXISTS public.products_admin;

CREATE TABLE public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  purchase_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product costs" ON public.product_costs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_product_costs_updated_at BEFORE UPDATE ON public.product_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.product_costs (product_id, purchase_price)
  SELECT id, purchase_price FROM public.products ON CONFLICT DO NOTHING;

ALTER TABLE public.products DROP COLUMN purchase_price;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;