import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Phone, MessageCircle } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({ meta: [{ title: "Customer Profile — RSS Sales Manager" }] }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { customerId } = Route.useParams();
  const { session } = useAuth();
  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    enabled: !!session && !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).single();
      if (error) throw error;
      return data;
    },
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", "customer", customerId],
    enabled: !!session && !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders")
        .select("id, order_no, invoice_no, status, total, payment_received, created_at")
        .eq("customer_id", customerId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const receiptsQuery = useQuery({
    queryKey: ["receipts", "customer", customerId],
    enabled: !!session && !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_receipts")
        .select("id, receipt_no, invoice_no, amount, method, paid_at")
        .eq("customer_id", customerId).order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!session) return <AppShell title="Customer"><div className="surface-card p-4">Sign in to view customer records. <Link to="/login" className="text-primary underline">Sign in</Link></div></AppShell>;
  if (customerQuery.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (customerQuery.error || !customerQuery.data) return <AppShell title="Customer"><EmptyState title="Customer not found" hint={(customerQuery.error as Error | null)?.message ?? "This customer may have been removed or you may not have access."} /></AppShell>;

  const c = customerQuery.data;
  const orders = ordersQuery.data ?? [];
  const receipts = receiptsQuery.data ?? [];
  const orderBalance = orders.reduce((sum,o)=>sum+Math.max(0,Number(o.total||0)-Number(o.payment_received||0)),0);
  const totalReceipts = receipts.reduce((sum,r)=>sum+Number(r.amount||0),0);
  const creditLimit = Number(c.credit_limit||0);
  const available = creditLimit-orderBalance;
  const phone = c.phone ?? "";
  const whatsapp = c.whatsapp ?? phone;
  return <AppShell title={c.shop_name} subtitle={[c.category,c.area].filter(Boolean).join(" · ")} action={<Link to="/" className="inline-flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Customers</Link>}>
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{c.contact_person || "No contact person"}</p><p className="mt-1 text-sm text-muted-foreground">{phone || "No phone number"}</p><p className="text-sm text-muted-foreground">{c.address || c.area || "No address saved"}</p></div><Pill>{c.category}</Pill></div>
      <div className="mt-4 flex gap-2">{phone?<a href={`tel:${phone.replace(/\s/g,"")}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold"><Phone className="h-4 w-4" /> Call</a>:null}{whatsapp?<a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-success/10 text-sm font-semibold text-success"><MessageCircle className="h-4 w-4" /> WhatsApp</a>:null}</div>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3"><StatCard label="Credit limit" value={money(creditLimit)} /><StatCard label="Order balance" value={money(orderBalance)} tone={orderBalance>creditLimit?"danger":"warning"} /><StatCard label="Available credit" value={money(available)} tone={available<0?"danger":"success"} /><StatCard label="Receipts recorded" value={money(totalReceipts)} tone="success" /></div>
    <div className="mt-3 grid grid-cols-2 gap-3"><Link to="/orders/new" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">Create order</Link><Link to="/payments/new" className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary text-sm font-bold">Record payment</Link></div>
    <SectionTitle>Order history</SectionTitle>
    {ordersQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : ordersQuery.error ? <p className="text-sm text-destructive">{(ordersQuery.error as Error).message}</p> : orders.length===0 ? <EmptyState title="No orders yet" hint="Orders created for this customer will appear here." /> : <ul className="surface-card divide-y divide-border">{orders.map(o=><li key={o.id} className="flex items-center justify-between gap-3 p-3.5"><div className="min-w-0"><p className="font-semibold">{o.order_no}</p><p className="text-xs text-muted-foreground">{shortDate(o.created_at)} · {o.status}{o.invoice_no?` · ${o.invoice_no}`:""}</p></div><p className="num text-sm font-bold">{money(Number(o.total||0))}</p></li>)}</ul>}
    <SectionTitle>Payment receipts</SectionTitle>
    {receiptsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : receiptsQuery.error ? <p className="text-sm text-destructive">{(receiptsQuery.error as Error).message}</p> : receipts.length===0 ? <EmptyState title="No receipts yet" hint="Payments recorded for this customer will appear here." /> : <ul className="surface-card divide-y divide-border">{receipts.map(r=><li key={r.id} className="flex items-center justify-between gap-3 p-3.5"><div className="min-w-0"><p className="font-semibold">{r.receipt_no}</p><p className="text-xs text-muted-foreground">{shortDate(r.paid_at)} · {r.method}{r.invoice_no?` · ${r.invoice_no}`:""}</p></div><p className="num text-sm font-bold">{money(Number(r.amount||0))}</p></li>)}</ul>}
  </AppShell>;
}
