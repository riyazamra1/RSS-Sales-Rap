import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Loader2, RefreshCw } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders — RSS Sales Manager" }] }),
  component: OrdersPage,
});

type OrderRow = {
  id: string; order_no: string; invoice_no: string | null; customer_name: string;
  status: string; total: number; payment_received: number; created_at: string;
};

function OrdersPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders")
        .select("id, order_no, invoice_no, customer_name, status, total, payment_received, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ordersQuery.data ?? []).filter(o =>
      (status === "All" || o.status === status) &&
      (!q || [o.order_no, o.invoice_no ?? "", o.customer_name, o.status].some(v => v.toLowerCase().includes(q)))
    );
  }, [ordersQuery.data, query, status]);
  const rows = ordersQuery.data ?? [];
  const total = rows.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pending = rows.filter(o => ["Pending", "Draft"].includes(o.status)).length;
  const collected = rows.reduce((sum, o) => sum + Number(o.payment_received || 0), 0);
  const statuses = ["All", "Draft", "Pending", "Confirmed", "Processing", "Completed", "Cancelled", "Returned", "INVOICED"];
  const tone = (value: string) => ["Completed", "Confirmed", "INVOICED"].includes(value) ? "success" : ["Cancelled", "Returned"].includes(value) ? "danger" : value === "Draft" ? "neutral" : "warning";

  if (!session) return <AppShell title="Orders"><div className="surface-card p-4">Sign in to view your saved orders. <Link to="/login" className="text-primary underline">Sign in</Link></div></AppShell>;

  return <AppShell title="Orders" subtitle="Live orders saved in your account" action={<Link to="/orders/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> New order</Link>}>
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Saved orders" value={String(rows.length)} />
      <StatCard label="Order value" value={money(total)} />
      <StatCard label="Pending / drafts" value={String(pending)} tone="warning" />
      <StatCard label="Payments received" value={money(collected)} tone="success" />
    </div>
    <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order, invoice or customer" className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm" /></div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{statuses.map(s=><button key={s} onClick={()=>setStatus(s)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status===s?"border-primary bg-primary text-primary-foreground":"border-border bg-card text-muted-foreground"}`}>{s}</button>)}</div>
    <SectionTitle right={<button onClick={()=>void ordersQuery.refetch()} className="text-xs text-primary"><RefreshCw className="mr-1 inline h-3 w-3" />Refresh</button>}>Saved orders <span className="ml-1 text-xs font-normal text-muted-foreground">{list.length}</span></SectionTitle>
    {ordersQuery.isLoading ? <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : ordersQuery.error ? <div className="surface-card p-4 text-sm text-destructive">Could not load orders: {(ordersQuery.error as Error).message}</div> : list.length===0 ? <EmptyState title="No saved orders" hint="Orders you create will appear here. No example orders are shown." /> : <ul className="space-y-3">{list.map(o=><li key={o.id} className="surface-card p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{o.customer_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{o.order_no} · {shortDate(o.created_at)}</p>{o.invoice_no?<p className="text-xs text-muted-foreground">Invoice {o.invoice_no}</p>:null}</div><Pill tone={tone(o.status)}>{o.status}</Pill></div>
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3"><div><p className="text-xs text-muted-foreground">Received {money(Number(o.payment_received||0))}</p><p className="text-xs text-muted-foreground">Balance {money(Math.max(0,Number(o.total||0)-Number(o.payment_received||0)))}</p></div><p className="num text-lg font-bold">{money(Number(o.total||0))}</p></div>
    </li>)}</ul>}
  </AppShell>;
}
