CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  company_name text NOT NULL DEFAULT 'RSS Razeen Secure Solutions',
  app_name text NOT NULL DEFAULT 'RSS Sales Manager',
  tagline text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  tax_number text NOT NULL DEFAULT '',
  logo_url text,
  brand_color text NOT NULL DEFAULT '#0B1F3A',
  currency text NOT NULL DEFAULT 'Rs.',
  invoice_prefix text NOT NULL DEFAULT 'INV',
  low_stock_threshold integer NOT NULL DEFAULT 5,
  credit_warnings_enabled boolean NOT NULL DEFAULT true,
  offline_mode_enabled boolean NOT NULL DEFAULT true,
  require_signup_approval boolean NOT NULL DEFAULT true,
  reps_can_see_purchase_price boolean NOT NULL DEFAULT false,
  sheets_enabled boolean NOT NULL DEFAULT false,
  sheets_spreadsheet_id text NOT NULL DEFAULT '',
  sheets_orders_tab text NOT NULL DEFAULT 'Orders',
  sheets_customers_tab text NOT NULL DEFAULT 'Customers',
  sheets_products_tab text NOT NULL DEFAULT 'Products',
  sheets_payments_tab text NOT NULL DEFAULT 'Payments',
  sheets_auto_sync_minutes integer NOT NULL DEFAULT 15,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert app settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update app settings" ON public.app_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (singleton) VALUES (true);