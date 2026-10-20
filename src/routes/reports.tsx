import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Wallet, Package, ShoppingBag } from "lucide-react";
import { AppShell, EmptyState, SectionTitle, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — RSS Sales Manager" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { session } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders")
        .select("id, order_no, customer_name, status, total, payment_received, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const receiptsQuery = useQuery({
    queryKey: ["receipts"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_receipts")
        .select("id, receipt_no, amount, paid_at, customer_name")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["products"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("id, name, sku, stock, sales_price, min_stock, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!session) return <AppShell title="Reports"><div className="surface-card p-4">Sign in to see reports based on your saved business records.</div></AppShell>;
  if (ordersQuery.isLoading || receiptsQuery.isLoading || productsQuery.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const error = ordersQuery.error ?? receiptsQuery.error ?? productsQuery.error;
  if (error) return <AppShell title="Reports"><div className="surface-card p-4 text-sm text-destructive">Report data could not be loaded: {(error as Error).message}</div></AppShell>;

  const orders = ordersQuery.data ?? [];
  const receipts = receiptsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const now = new Date();
  const today = now.toISOString().slice(0,10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate()-6);
  const weekStartText = weekStart.toISOString().slice(0,10);
  const activeOrders = orders.filter(o => !["Cancelled","Returned","Draft"].includes(o.status));
  const todayOrders = activeOrders.filter(o => o.created_at.slice(0,10)===today);
  const weekOrders = activeOrders.filter(o => o.created_at.slice(0,10)>=weekStartText);
  const todayReceipts = receipts.filter(r => r.paid_at.slice(0,10)===today);
  const sales = activeOrders.reduce((sum,o)=>sum+Number(o.total||0),0);
  const collected = receipts.reduce((sum,r)=>sum+Number(r.amount||0),0);
  const todayCollected = todayReceipts.reduce((sum,r)=>sum+Number(r.amount||0),0);
  const stockValue = products.reduce((sum,p)=>sum+Number(p.stock||0)*Number(p.sales_price||0),0);
  const lowStock = products.filter(p=>Number(p.stock||0)<=Number(p.min_stock||0));
  const balance = activeOrders.reduce((sum,o)=>sum+Math.max(0,Number(o.total||0)-Number(o.payment_received||0)),0);

  return <AppShell title="Reports" subtitle="Calculated from saved database records">
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Today's sales" value={money(todayOrders.reduce((s,o)=>s+Number(o.total||0),0))} hint={todayOrders.length+" orders"} />
      <StatCard label="Today's receipts" value={money(todayCollected)} hint={todayReceipts.length+" receipts"} tone="success" />
      <StatCard label="Last 7 days" value={money(weekOrders.reduce((s,o)=>s+Number(o.total||0),0))} hint={weekOrders.length+" orders"} />
      <StatCard label="All-time order value" value={money(sales)} hint={activeOrders.length+" orders"} />
      <StatCard label="Recorded receipts" value={money(collected)} hint={receipts.length+" receipts"} tone="success" />
      <StatCard label="Unpaid order balance" value={money(balance)} hint="Based on order payments recorded" tone={balance>0?"danger":"success"} />
      <StatCard label="Inventory value" value={money(stockValue)} hint={products.length+" active products"} />
      <StatCard label="Low / out of stock" value={String(lowStock.length)} tone={lowStock.length?"warning":"success"} />
    </div>
    <SectionTitle>Recent orders</SectionTitle>
    {orders.length===0 ? <EmptyState title="No sales data yet" hint="Create an order to start building accurate reports. Demo charts and example totals have been removed." /> : <ul className="surface-card divide-y divide-border">{orders.slice(0,10).map(o=><li key={o.id} className="flex items-center justify-between gap-3 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold">{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.order_no} · {shortDate(o.created_at)} · {o.status}</p></div><p className="num shrink-0 text-sm font-bold">{money(Number(o.total||0))}</p></li>)}</ul>}
    <SectionTitle>Inventory attention</SectionTitle>
    {lowStock.length===0 ? <EmptyState title="No low-stock alerts" hint="Alerts will appear when saved product quantities are at or below minimum stock." /> : <ul className="space-y-2">{lowStock.map(p=><li key={p.id} className="surface-card flex items-center justify-between gap-3 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku} · Minimum {p.min_stock}</p></div><p className="num text-sm font-bold">{p.stock} in stock</p></li>)}</ul>}
    <div className="surface-card mt-4 p-3 text-xs text-muted-foreground"><TrendingUp className="mr-1 inline h-4 w-4" /> Reports contain only saved records. Profit reporting is not shown until cost and invoice data can be reliably joined to real orders.</div>
  </AppShell>;
}
