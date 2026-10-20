import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SheetsSyncResult } from "./sheets.functions";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

type Client = SupabaseClient<Database>;
type Row = (string | number)[];

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error(
      "Google Sheets is not connected yet. Link the Google Sheets connector, then try again.",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

async function gateway(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers: headers() });
  const body = await res.text();
  if (!res.ok) {
    console.error(`[Sheets] ${path} failed [${res.status}]: ${body}`);
    throw new Error(`Google Sheets request failed [${res.status}]: ${body}`);
  }
  return body ? JSON.parse(body) : {};
}

async function ensureTabs(spreadsheetId: string, tabs: string[]) {
  const meta = await gateway(`/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`);
  const existing: string[] = (meta.sheets ?? []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title ?? "",
  );
  const missing = tabs.filter((t) => t && !existing.includes(t));
  if (!missing.length) return;
  await gateway(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });
}

async function writeTab(spreadsheetId: string, tab: string, rows: Row[]) {
  await gateway(`/spreadsheets/${spreadsheetId}/values/${tab}!A1:Z10000:clear`, {
    method: "POST",
    body: "{}",
  });
  await gateway(
    `/spreadsheets/${spreadsheetId}/values/${tab}!A1?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: rows }) },
  );
}

async function readTab(spreadsheetId: string, tab: string): Promise<unknown[][]> {
  const result = await gateway(`/spreadsheets/${spreadsheetId}/values/${tab}!A1:Z10000`);
  return Array.isArray(result.values) ? result.values : [];
}

export async function runSheetsSync(supabase: Client, userId: string): Promise<SheetsSyncResult> {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "admin")) {
    throw new Error("Only administrators can run the Google Sheets sync.");
  }

  const { data: settings, error: settingsError } = await supabase
    .from("app_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (settingsError) throw settingsError;
  if (!settings?.sheets_enabled) throw new Error("Google Sheets sync is turned off in App settings.");

  const spreadsheetId = (settings.sheets_spreadsheet_id ?? "").trim();
  if (!spreadsheetId) throw new Error("Add a spreadsheet ID in App settings first.");

  // Read manager edits before exporting, otherwise a full-sheet refresh could erase them.
  const ordersTab = settings.sheets_orders_tab || "Orders";
  await ensureTabs(spreadsheetId, [ordersTab]);
  const sheetRows = await readTab(spreadsheetId, ordersTab);
  if (sheetRows.length > 1) {
    const header = (sheetRows[0] ?? []).map(value => String(value ?? "").trim());
    const orderNoIndex = header.indexOf("Order no");
    const invoiceIndex = header.indexOf("Invoice no");
    const statusIndex = header.indexOf("Status");
    if (orderNoIndex >= 0 && statusIndex >= 0) {
      const { data: knownOrders, error: knownOrdersError } = await supabase
        .from("sales_orders").select("id, order_no, invoice_no, status");
      if (knownOrdersError) throw knownOrdersError;
      const byOrderNo = new Map((knownOrders ?? []).map(order => [order.order_no, order]));
      const allowedStatuses = new Set(["Draft", "Pending", "Confirmed", "Processing", "Completed", "Cancelled", "Returned", "INVOICED"]);
      for (const row of sheetRows.slice(1)) {
        const orderNo = String(row[orderNoIndex] ?? "").trim();
        const status = String(row[statusIndex] ?? "").trim();
        const existing = byOrderNo.get(orderNo);
        if (!existing || !allowedStatuses.has(status)) continue;
        const patch: { status: string; invoice_no?: string | null } = { status };
        if (status === "INVOICED") {
          const sheetInvoice = invoiceIndex >= 0 ? String(row[invoiceIndex] ?? "").trim() : "";
          patch.invoice_no = sheetInvoice || existing.invoice_no || orderNo.replace(/^ORD-/, "INV-");
        }
        if (existing.status !== patch.status || (patch.invoice_no !== undefined && existing.invoice_no !== patch.invoice_no)) {
          const { error } = await supabase.from("sales_orders").update(patch).eq("id", existing.id);
          if (error) throw error;
        }
      }
    }
  }

  const [customers, products, payments, orders] = await Promise.all([
    supabase.from("customers").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("name"),
    supabase.from("payment_receipts").select("*").order("paid_at", { ascending: false }),
    supabase.from("sales_orders").select("*").order("created_at", { ascending: false }),
  ]);
  if (customers.error) throw customers.error;
  if (products.error) throw products.error;
  if (payments.error) throw payments.error;
  if (orders.error) throw orders.error;

  const orderIds = (orders.data ?? []).map(o => o.id);
  const orderItems = orderIds.length
    ? await supabase.from("sales_order_items").select("*").in("order_id", orderIds)
    : { data: [], error: null };
  if (orderItems.error) throw orderItems.error;
  const itemsByOrder = new Map<string, typeof orderItems.data>();
  for (const item of orderItems.data ?? []) {
    itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]);
  }

  const { data: costs } = await supabase.from("product_costs").select("product_id, purchase_price");
  const costMap = new Map<string, number>((costs ?? []).map((c) => [c.product_id, Number(c.purchase_price)]));

  const jobs: { tab: string; rows: Row[] }[] = [
    {
      tab: settings.sheets_customers_tab || "Customers",
      rows: [
        ["ID", "Shop name", "Contact", "Phone", "WhatsApp", "Area", "Category", "Credit limit", "Address", "Created"],
        ...(customers.data ?? []).map((c): Row => [
          c.id, c.shop_name, c.contact_person, c.phone, c.whatsapp ?? "", c.area ?? "",
          c.category, c.credit_limit, c.address ?? "", c.created_at,
        ]),
      ],
    },
    {
      tab: settings.sheets_products_tab || "Products",
      rows: [
        ["ID", "Name", "SKU", "Barcode", "Brand", "Model", "Category", "Unit", "Purchase", "Wholesale", "Sales", "Stock", "Min stock", "Active"],
        ...(products.data ?? []).map((p): Row => [
          p.id, p.name, p.sku, p.barcode ?? "", p.brand, p.model, p.category, p.unit,
          costMap.get(p.id) ?? 0, p.wholesale_price, p.sales_price, p.stock, p.min_stock,
          p.is_active ? "Yes" : "No",
        ]),
      ],
    },
    {
      tab: settings.sheets_orders_tab || "Orders",
      rows: [
        ["Order no", "Invoice no", "Order date", "Customer ID", "Customer", "Status", "Subtotal", "Discount", "Other charges", "Total", "Payment received", "Balance", "Created by", "SKU", "Product", "Quantity", "Unit price", "Line discount", "Line total", "Note"],
        ...(orders.data ?? []).flatMap((o): Row[] => {
          const items = itemsByOrder.get(o.id) ?? [];
          const base = [o.order_no, o.invoice_no ?? "", o.created_at, o.customer_id, o.customer_name, o.status, o.subtotal, o.discount, o.other_charges, o.total, o.payment_received, Math.max(0, Number(o.total) - Number(o.payment_received)), o.created_by];
          return items.length
            ? items.map((item): Row => [...base, item.sku, item.product_name, item.quantity, item.unit_price, item.discount, item.line_total])
            : [[...base, "", "", "", "", "", "", o.note ?? ""]];
        }),
      ],
    },
    {
      tab: settings.sheets_payments_tab || "Payments",
      rows: [
        ["Receipt no", "Customer", "Invoice", "Amount", "Method", "Reference", "Note", "Paid at"],
        ...(payments.data ?? []).map((p): Row => [
          p.receipt_no, p.customer_name, p.invoice_no ?? "", p.amount, p.method,
          p.reference ?? "", p.note ?? "", p.paid_at,
        ]),
      ],
    },
  ];

  await ensureTabs(spreadsheetId, jobs.map((j) => j.tab));

  const tabs: SheetsSyncResult["tabs"] = [];
  for (const job of jobs) {
    try {
      await writeTab(spreadsheetId, job.tab, job.rows);
      tabs.push({ tab: job.tab, rows: Math.max(job.rows.length - 1, 0), status: "synced" });
    } catch (e) {
      tabs.push({ tab: job.tab, rows: 0, status: "failed", error: (e as Error).message });
    }
  }

  const failed = tabs.filter((t) => t.status === "failed").length;
  return {
    ok: failed === 0,
    syncedAt: new Date().toISOString(),
    tabs,
    pending: failed ? tabs.filter((t) => t.status === "failed").reduce((n) => n + 1, 0) : 0,
    failed,
  };
}
