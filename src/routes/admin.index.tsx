import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, CheckCircle2, Loader2, LogOut, Settings, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin panel — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Approve new sales reps, manage admin and accountant roles, and review payment collections for RSS Razeen Secure Solutions.",
      },
      { property: "og:title", content: "Admin panel — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "User approval, role management and collection oversight for RSS Sales Manager.",
      },
    ],
  }),
  component: AdminPanelPage,
});

type ProfileRow = {
  id: string;
  full_name: string;
  employee_id: string | null;
  phone: string | null;
  territory: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

function AdminPanelPage() {
  const navigate = useNavigate();
  const { loading, session, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) void navigate({ to: "/admin/login", replace: true });
  }, [loading, session, isAdmin, navigate]);

  const usersQuery = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: !!session && isAdmin,
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, employee_id, phone, territory, email, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const roleMap = new Map<string, AppRole[]>();
      for (const r of (roles.data ?? []) as { user_id: string; role: AppRole }[]) {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      }
      return ((profiles.data ?? []) as ProfileRow[]).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
      }));
    },
  });

  const receiptsQuery = useQuery({
    queryKey: ["admin", "receipts"],
    enabled: !!session && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_receipts")
        .select("id, receipt_no, customer_name, invoice_no, amount, method, paid_at")
        .order("paid_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRole = useMutation({
    mutationFn: async ({ id, role, has }: { id: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", id)
          .eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Roles updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || !session || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const pending = users.filter((u) => u.status === "pending");
  const collected = (receiptsQuery.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              RSS Razeen Secure Solutions
            </p>
            <h1 className="truncate text-xl font-bold">Admin panel</h1>
          </div>
          <button
            onClick={async () => {
              await signOut();
              void navigate({ to: "/admin/login", replace: true });
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total users" value={String(users.length)} />
          <StatCard
            label="Pending approval"
            value={String(pending.length)}
            tone={pending.length ? "warning" : "default"}
          />
          <StatCard label="Recent receipts" value={String(receiptsQuery.data?.length ?? 0)} />
          <StatCard label="Collected (recent)" value={money(collected)} tone="success" />
        </div>

        <Link
          to="/admin/items"
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          <Boxes className="h-4 w-4" /> Manage inventory items
        </Link>

        <Link
          to="/admin/settings"
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-navy-foreground"
        >
          <Settings className="h-4 w-4" /> App settings, logo &amp; company details
        </Link>



        <SectionTitle>Sales rep accounts</SectionTitle>
        {usersQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => {
              const isUserAdmin = u.roles.includes("admin");
              const isAccountant = u.roles.includes("accountant");
              return (
                <li key={u.id} className="surface-card p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{u.full_name || "Unnamed user"}</p>
                        <Pill
                          tone={
                            u.status === "active"
                              ? "success"
                              : u.status === "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {u.status}
                        </Pill>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[u.employee_id, u.territory, u.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {u.status !== "active" ? (
                      <button
                        onClick={() => setStatus.mutate({ id: u.id, status: "active" })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus.mutate({ id: u.id, status: "suspended" })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Suspend
                      </button>
                    )}
                    <button
                      onClick={() =>
                        toggleRole.mutate({ id: u.id, role: "admin", has: isUserAdmin })
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isUserAdmin
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() =>
                        toggleRole.mutate({ id: u.id, role: "accountant", has: isAccountant })
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isAccountant
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      Accountant
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <SectionTitle
          right={
            <Link to="/payments/new" className="text-xs font-semibold text-primary">
              Collect payment
            </Link>
          }
        >
          Recent payment receipts
        </SectionTitle>
        {(receiptsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ul className="surface-card divide-y divide-border">
            {(receiptsQuery.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.receipt_no} · {r.method}
                    {r.invoice_no ? ` · ${r.invoice_no}` : " · Advance"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-sm font-semibold text-success">
                    {money(Number(r.amount))}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{shortDate(r.paid_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
