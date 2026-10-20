-- 1. Move has_role out of the exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Recreate all policies against private.has_role
DROP POLICY IF EXISTS "Admins insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
CREATE POLICY "Authenticated can view app settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert app settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update app settings" ON public.app_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.app_settings FROM anon;

DROP POLICY IF EXISTS "Admins delete customers" ON public.customers;
DROP POLICY IF EXISTS "Team can view customers" ON public.customers;
DROP POLICY IF EXISTS "Update own or admin" ON public.customers;
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "View own customers or privileged" ON public.customers FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant'));
CREATE POLICY "Update own or admin" ON public.customers FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Admins update receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "View own or all when privileged" ON public.payment_receipts;
CREATE POLICY "Admins delete receipts" ON public.payment_receipts FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update receipts" ON public.payment_receipts FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "View own or all when privileged" ON public.payment_receipts FOR SELECT TO authenticated
  USING (auth.uid() = collected_by OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant'));

DROP POLICY IF EXISTS "Admins delete products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = id OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins manage roles delete" ON public.user_roles FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles update" ON public.user_roles FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3. Public branding view (non-sensitive fields only)
CREATE OR REPLACE VIEW public.app_branding AS
  SELECT id, company_name, app_name, tagline, logo_url, brand_color, currency FROM public.app_settings;
GRANT SELECT ON public.app_branding TO anon, authenticated, service_role;

-- 4. Hide purchase_price from non-admins
REVOKE SELECT ON public.products FROM authenticated;
GRANT SELECT (id, name, sku, barcode, brand, model, category, unit, wholesale_price, sales_price,
  stock, min_stock, supplier, warranty, description, is_active, created_by, created_at, updated_at)
  ON public.products TO authenticated;

CREATE OR REPLACE VIEW public.products_admin AS
  SELECT * FROM public.products WHERE private.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.products_admin TO authenticated, service_role;

-- 5. Storage policies
CREATE POLICY "Staff manage own order form files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rss-order-form' AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin')));
CREATE POLICY "Staff upload order form files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rss-order-form' AND owner = auth.uid());
CREATE POLICY "Staff update own order form files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'rss-order-form' AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin')))
  WITH CHECK (bucket_id = 'rss-order-form' AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin')));
CREATE POLICY "Staff delete own order form files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'rss-order-form' AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins read export files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'database_export_11_08_26' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write export files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'database_export_11_08_26' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update export files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'database_export_11_08_26' AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'database_export_11_08_26' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete export files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'database_export_11_08_26' AND private.has_role(auth.uid(), 'admin'));