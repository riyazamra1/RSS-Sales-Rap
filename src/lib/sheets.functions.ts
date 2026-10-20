import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SheetsSyncResult = {
  ok: boolean;
  syncedAt: string;
  tabs: { tab: string; rows: number; status: "synced" | "failed"; error?: string }[];
  pending: number;
  failed: number;
};

export const syncSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SheetsSyncResult> => {
    const { runSheetsSync } = await import("./sheets.server");
    return runSheetsSync(context.supabase, context.userId);
  });
