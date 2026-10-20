import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/logo.jpg";

export type AppSettings = {
  id: string;
  company_name: string;
  app_name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  tax_number: string;
  logo_url: string | null;
  brand_color: string;
  currency: string;
  invoice_prefix: string;
  low_stock_threshold: number;
  credit_warnings_enabled: boolean;
  offline_mode_enabled: boolean;
  require_signup_approval: boolean;
  reps_can_see_purchase_price: boolean;
  sheets_enabled: boolean;
  sheets_spreadsheet_id: string;
  sheets_orders_tab: string;
  sheets_customers_tab: string;
  sheets_products_tab: string;
  sheets_payments_tab: string;
  sheets_auto_sync_minutes: number;
};

export const defaultSettings: AppSettings = {
  id: "",
  company_name: "RSS Razeen Secure Solutions",
  app_name: "RSS Sales Manager",
  tagline: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  tax_number: "",
  logo_url: null,
  brand_color: "#0B1F3A",
  currency: "Rs.",
  invoice_prefix: "INV",
  low_stock_threshold: 5,
  credit_warnings_enabled: true,
  offline_mode_enabled: true,
  require_signup_approval: true,
  reps_can_see_purchase_price: false,
  sheets_enabled: false,
  sheets_spreadsheet_id: "",
  sheets_orders_tab: "Orders",
  sheets_customers_tab: "Customers",
  sheets_products_tab: "Products",
  sheets_payments_tab: "Payments",
  sheets_auto_sync_minutes: 15,
};

export const appSettingsQueryKey = ["app-settings"] as const;

export function useAppSettings() {
  const query = useQuery({
    queryKey: appSettingsQueryKey,
    staleTime: 60_000,
    queryFn: async (): Promise<AppSettings> => {
      // Admins get the full settings row; everyone else (and signed-out
      // visitors) falls back to the branding-only SECURITY DEFINER function.
      let data: Partial<AppSettings> | null = null;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const res = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
        if (!res.error) data = res.data;
      }
      if (!data) {
        const { data: branding, error } = await supabase.rpc("get_app_branding");
        if (error) throw error;
        data = branding?.[0] ?? null;
      }
      return { ...defaultSettings, ...((data ?? {}) as Partial<AppSettings>) };
    },
  });

  const settings = query.data ?? defaultSettings;
  return { settings, logo: settings.logo_url || logoUrl, isLoading: query.isLoading };
}

/** Keeps favicon, apple touch icon and theme colour in sync with the admin logo. */
export function useBrandingSync() {
  const { settings, logo } = useAppSettings();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    setLink("icon", logo);
    setLink("apple-touch-icon", logo);

    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (theme) theme.content = settings.brand_color;
    if (settings.app_name) document.title = document.title.replace(/RSS Sales Manager/g, settings.app_name);
  }, [logo, settings.brand_color, settings.app_name]);
}
