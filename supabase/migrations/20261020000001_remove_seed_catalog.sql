-- Remove only the exact example SKUs inserted by the old sample-catalog migration.
-- Preserve any item already referenced by a saved sales order.
DELETE FROM public.products p
WHERE p.sku IN (
  'HIK-2CD1027','HIK-4CD2143','DAH-HFW1500','HIK-DVR8CH','HIK-NVR8P',
  'SEA-SKY2TB','SEA-SKY4TB','TPL-SG1008P','TPL-C6','CBL-CAT6-305',
  'CBL-RG59-305','ACC-BNC100','ACC-PSU12V5A','APC-BX650','KST-8GDDR4',
  'KST-A400480','LOG-K120','LOG-B100','HIK-DS-KIS204','ZKT-K40'
)
AND NOT EXISTS (
  SELECT 1 FROM public.sales_order_items soi WHERE soi.product_id = p.id
);
