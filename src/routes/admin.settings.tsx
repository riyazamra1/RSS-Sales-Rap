import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Sheet,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionTitle } from "@/components/AppShell";
import { syncSheets, type SheetsSyncResult } from "@/lib/sheets.functions";
import {
  appSettingsQueryKey,
  defaultSettings,
  useAppSettings,
  type AppSettings,
} from "@/hooks/useAppSettings";


export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "App settings — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Admin control centre: upload the company logo, edit company details and address, and configure Google Sheets sync and app-wide options.",
      },
      { property: "og:title", content: "App settings — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Branding, company details and Google Sheets configuration for RSS Sales Manager.",
      },
    ],
  }),
  component: AdminSettingsPage,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

async function fileToSquarePng(file: File, size = 256): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image"));
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return canvas.toDataURL("image/png");
}

function AdminSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading, session, isAdmin } = useAuth();
  const { settings, logo } = useAppSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) void navigate({ to: "/admin/login", replace: true });
  }, [loading, session, isAdmin, navigate]);

  useEffect(() => {
    if (!hydrated && settings.id) {
      setForm(settings);
      setHydrated(true);
    }
  }, [settings, hydrated]);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async (override?: AppSettings) => {
      const { id, ...rest } = override ?? form;
      const payload = { ...rest, updated_by: session?.user.id ?? null };
      if (id) {
        const { error } = await supabase.from("app_settings").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved — branding updated across the app");
      void queryClient.invalidateQueries({ queryKey: appSettingsQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runSync = useServerFn(syncSheets);
  const [syncResult, setSyncResult] = useState<SheetsSyncResult | null>(null);
  const sync = useMutation({
    mutationFn: async () => {
      if (form.id) await save.mutateAsync(undefined);
      return (await runSync({ data: undefined })) as SheetsSyncResult;
    },
    onSuccess: (res) => {
      setSyncResult(res);
      if (res.ok) toast.success("Google Sheets sync complete");
      else toast.error(`${res.failed} tab(s) failed to sync`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enableAllMutation = useMutation({
    mutationFn: async () => {
      const next: AppSettings = {
        ...form,
        sheets_enabled: true,
        credit_warnings_enabled: true,
        offline_mode_enabled: true,
        require_signup_approval: true,
        reps_can_see_purchase_price: true,
        low_stock_threshold: form.low_stock_threshold || defaultSettings.low_stock_threshold,
        sheets_orders_tab: form.sheets_orders_tab || defaultSettings.sheets_orders_tab,
        sheets_customers_tab: form.sheets_customers_tab || defaultSettings.sheets_customers_tab,
        sheets_products_tab: form.sheets_products_tab || defaultSettings.sheets_products_tab,
        sheets_payments_tab: form.sheets_payments_tab || defaultSettings.sheets_payments_tab,
        sheets_auto_sync_minutes:
          form.sheets_auto_sync_minutes || defaultSettings.sheets_auto_sync_minutes,
      };
      setForm(next);
      await save.mutateAsync(next);
    },
    onError: (e: Error) => toast.error(e.message),
  });




  async function onPickLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const png = await fileToSquarePng(file);
      set("logo_url", png);
      toast.success("Logo ready — press Save to apply everywhere");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading || !session || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/admin" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              Admin control
            </p>
            <h1 className="truncate text-xl font-bold">App settings</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <button
          type="button"
          onClick={() => enableAllMutation.mutate()}
          disabled={enableAllMutation.isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-success text-sm font-bold text-success-foreground disabled:opacity-60"
        >
          {enableAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Enable all settings
        </button>

        <SectionTitle>Branding &amp; logo</SectionTitle>

        <div className="surface-card p-3.5">
          <div className="flex items-center gap-4">
            <img
              src={form.logo_url || logo}
              alt="Current app logo"
              className="h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Company logo</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Applies to the splash screen, header, favicon and home-screen icon.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickLogo(e.target.files?.[0])}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload logo
                </button>
                {form.logo_url ? (
                  <button
                    type="button"
                    onClick={() => set("logo_url", null)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Reset
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="App name" value={form.app_name} onChange={(v) => set("app_name", v)} />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Brand colour</span>
              <input
                type="color"
                value={form.brand_color}
                onChange={(e) => set("brand_color", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-2"
              />
            </label>
            <Field label="Currency symbol" value={form.currency} onChange={(v) => set("currency", v)} />
          </div>
        </div>

        <SectionTitle>Company details</SectionTitle>
        <div className="surface-card grid gap-3 p-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Company name"
              value={form.company_name}
              onChange={(v) => set("company_name", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Address</span>
              <textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                rows={3}
                placeholder="Street, city, country"
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="Website" value={form.website} onChange={(v) => set("website", v)} />
          <Field label="Tax / Reg. number" value={form.tax_number} onChange={(v) => set("tax_number", v)} />
          <Field
            label="Invoice prefix"
            value={form.invoice_prefix}
            onChange={(v) => set("invoice_prefix", v)}
          />
        </div>

        <SectionTitle>Google Sheets</SectionTitle>
        <div className="surface-card">
          <Toggle
            label="Enable Google Sheets sync"
            hint="Mirror orders, customers, products and payments to a spreadsheet"
            checked={form.sheets_enabled}
            onChange={(v) => set("sheets_enabled", v)}
          />
          {form.sheets_enabled ? (
            <div className="grid gap-3 border-t border-border p-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Spreadsheet ID or URL"
                  value={form.sheets_spreadsheet_id}
                  onChange={(v) =>
                    set(
                      "sheets_spreadsheet_id",
                      v.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? v.trim(),
                    )
                  }
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                />
              </div>
              <Field
                label="Orders tab"
                value={form.sheets_orders_tab}
                onChange={(v) => set("sheets_orders_tab", v)}
              />
              <Field
                label="Customers tab"
                value={form.sheets_customers_tab}
                onChange={(v) => set("sheets_customers_tab", v)}
              />
              <Field
                label="Products tab"
                value={form.sheets_products_tab}
                onChange={(v) => set("sheets_products_tab", v)}
              />
              <Field
                label="Payments tab"
                value={form.sheets_payments_tab}
                onChange={(v) => set("sheets_payments_tab", v)}
              />
              <Field
                label="Auto-sync every (minutes)"
                type="number"
                value={form.sheets_auto_sync_minutes}
                onChange={(v) => set("sheets_auto_sync_minutes", Number(v) || 0)}
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => sync.mutate()}
                  disabled={sync.isPending}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-navy-foreground disabled:opacity-60"
                >
                  {sync.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync now
                </button>
              </div>
              {syncResult ? (
                <ul className="divide-y divide-border rounded-xl border border-border sm:col-span-2">
                  {syncResult.tabs.map((t) => (
                    <li key={t.tab} className="flex items-start gap-2 px-3 py-2 text-[11px]">
                      {t.status === "synced" ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-success" />
                      ) : (
                        <Sheet className="mt-0.5 h-3.5 w-3.5 text-destructive" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">{t.tab}</span>
                        {t.status === "synced" ? (
                          <span className="text-muted-foreground"> — {t.rows} rows pushed</span>
                        ) : (
                          <span className="block break-words text-destructive">{t.error}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">
                <Sheet className="mr-1 inline h-3.5 w-3.5" />
                Your Google Sheets account is connected. Share the spreadsheet with edit access;
                Sync now pushes customers, products and payments to the tabs above.
              </p>

            </div>
          ) : null}
        </div>

        <SectionTitle>App controls</SectionTitle>
        <ul className="surface-card divide-y divide-border">
          <li>
            <Toggle
              label="Credit limit warnings"
              hint="Warn reps when an order exceeds the customer credit limit"
              checked={form.credit_warnings_enabled}
              onChange={(v) => set("credit_warnings_enabled", v)}
            />
          </li>
          <li>
            <Toggle
              label="Offline mode"
              hint="Queue orders and payments while the device is offline"
              checked={form.offline_mode_enabled}
              onChange={(v) => set("offline_mode_enabled", v)}
            />
          </li>
          <li>
            <Toggle
              label="Require admin approval for signups"
              hint="New sales reps stay pending until approved"
              checked={form.require_signup_approval}
              onChange={(v) => set("require_signup_approval", v)}
            />
          </li>
          <li>
            <Toggle
              label="Reps can see purchase price"
              hint="Show cost price in the inventory tab"
              checked={form.reps_can_see_purchase_price}
              onChange={(v) => set("reps_can_see_purchase_price", v)}
            />
          </li>
          <li className="p-3.5">
            <Field
              label="Low stock threshold"
              type="number"
              value={form.low_stock_threshold}
              onChange={(v) => set("low_stock_threshold", Number(v) || 0)}
            />
          </li>
        </ul>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => save.mutate(undefined)}
            disabled={save.isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
