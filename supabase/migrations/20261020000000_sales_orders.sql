-- Real sales-order persistence. No seeded/demo rows are created by this migration.
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE DEFAULT ('ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  invoice_no text UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  customer_name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft','Pending','Confirmed','Processing','Completed','Cancelled','Returned','INVOICED')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  other_charges numeric(14,2) NOT NULL DEFAULT 0 CHECK (other_charges >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_received numeric(14,2) NOT NULL DEFAULT 0 CHECK (payment_received >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO authenticated;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sales staff view own orders or privileged" ON public.sales_orders;
CREATE POLICY "Sales staff view own orders or privileged" ON public.sales_orders
  FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant')
  );
DROP POLICY IF EXISTS "Sales staff create own orders" ON public.sales_orders;
CREATE POLICY "Sales staff create own orders" ON public.sales_orders
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Sales staff update own drafts or privileged" ON public.sales_orders;
CREATE POLICY "Sales staff update own drafts or privileged" ON public.sales_orders
  FOR UPDATE TO authenticated USING (
    (created_by = auth.uid() AND status = 'Draft') OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant')
  ) WITH CHECK (
    (created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant')
  );
DROP POLICY IF EXISTS "Users manage items on visible orders" ON public.sales_order_items;
CREATE POLICY "Users manage items on visible orders" ON public.sales_order_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sales_orders o WHERE o.id = order_id AND (
      o.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant')
    ))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales_orders o WHERE o.id = order_id AND (
      o.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'accountant')
    ))
  );
CREATE INDEX IF NOT EXISTS sales_orders_created_by_created_at_idx ON public.sales_orders(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_order_items_order_id_idx ON public.sales_order_items(order_id);
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Users delete own draft orders" ON public.sales_orders;
CREATE POLICY "Users delete own draft orders" ON public.sales_orders
  FOR DELETE TO authenticated USING (created_by = auth.uid() AND status = 'Draft');
