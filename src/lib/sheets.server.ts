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

  const [customers, products, payments] = await Promise.all([
    supabase.from("customers").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("name"),
    supabase.from("payment_receipts").select("*").order("paid_at", { ascending: false }),
  ]);

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
