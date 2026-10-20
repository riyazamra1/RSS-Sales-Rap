-- Only privileged staff can change a submitted order to an invoiced status.
DROP POLICY IF EXISTS "Sales staff update own drafts or privileged" ON public.sales_orders;
CREATE POLICY "Sales staff update own drafts or privileged" ON public.sales_orders
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND status IN ('Draft','Pending'))
    OR private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'accountant')
  )
  WITH CHECK (
    (created_by = auth.uid() AND status IN ('Draft','Pending'))
    OR private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'accountant')
  );

-- Post stock exactly once when an order first becomes INVOICED.
CREATE OR REPLACE FUNCTION public.post_sales_order_stock_on_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  item record;
BEGIN
  IF NEW.status = 'INVOICED' AND OLD.status IS DISTINCT FROM 'INVOICED' THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.sales_order_items
      WHERE order_id = NEW.id
    LOOP
      UPDATE public.products
      SET stock = stock - item.quantity
      WHERE id = item.product_id AND stock >= item.quantity;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %; invoice was not posted', item.product_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_sales_order_stock_on_invoice ON public.sales_orders;
CREATE TRIGGER post_sales_order_stock_on_invoice
BEFORE UPDATE OF status ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.post_sales_order_stock_on_invoice();
