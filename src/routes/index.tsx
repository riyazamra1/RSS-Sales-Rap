import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MessageCircle, Plus, Loader2 } from "lucide-react";
import { AppShell, Pill, StatCard, SectionTitle, EmptyState } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money, initials } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Customers — RSS Sales Manager" },
    { name: "description", content: "Live customer accounts and credit limits for RSS Sales Manager." },
  ] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const { session } = useAuth();
  const customersQuery = useQuery({
    queryKey: ["customers"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers")
        .select("id, shop_name, contact_person, phone, whatsapp, area, address, category, credit_limit, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const customers = customersQuery.data ?? [];
  const categories = ["All", ...Array.from(new Set(customers.map(c => c.category).filter(Boolean)))];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(c =>
      (filter === "All" || c.category === filter) &&
      (!q || [c.shop_name, c.contact_person, c.phone, c.area ?? "", c.address ?? ""].some(v => v.toLowerCase().includes(q)))
    );
  }, [customers, query, filter]);
  const creditLimit = customers.reduce((sum,c)=>sum+Number(c.credit_limit||0),0);

  if (!session) return <AppShell title="Customers" subtitle="Customer accounts"><div className="surface-card p-4 text-sm">Sign in to view customer records. <Link to="/login" className="font-semibold text-primary underline">Sign in</Link></div></AppShell>;

  return <AppShell title="Customers" subtitle="Live customer records" action={<Link to="/customers/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Add customer</Link>}>
    <div className="grid grid-cols-2 gap-3"><StatCard label="Saved customers" value={String(customers.length)} hint="Database records" /><StatCard label="Combined credit limits" value={money(creditLimit)} hint="All saved accounts" /></div>
    <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shop, contact, phone or area" className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{categories.map(category=><button key={category} onClick={()=>setFilter(category)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${filter===category?"border-primary bg-primary text-primary-foreground":"border-border bg-card text-muted-foreground"}`}>{category}</button>)}</div>
    <SectionTitle right={<span className="text-xs text-muted-foreground">{list.length} shown</span>}>Customer list</SectionTitle>
    {customersQuery.isLoading ? <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : customersQuery.error ? <div className="surface-card p-4 text-sm text-destructive">Could not load customers: {(customersQuery.error as Error).message}</div> : list.length===0 ? <EmptyState title="No saved customers" hint="Add your real customer records. No demo customers are included." /> : <ul className="space-y-3">{list.map(c=><li key={c.id} className="surface-card p-3.5">
      <Link to="/customers/$customerId" params={{customerId:c.id}} className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">{initials(c.shop_name)}</span>
        <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate font-semibold">{c.shop_name}</span><Pill>{c.category}</Pill></span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{[c.contact_person,c.area,c.phone].filter(Boolean).join(" · ")||"No contact details"}</span><span className="mt-1 block text-xs text-muted-foreground">Credit limit {money(Number(c.credit_limit||0))}</span></span>
      </Link>
      <div className="mt-3 flex gap-2">{c.phone?<a href={`tel:${c.phone.replace(/\s/g,"")}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary text-xs font-semibold"><Phone className="h-3.5 w-3.5" /> Call</a>:null}{(c.whatsapp||c.phone)?<a href={`https://wa.me/${(c.whatsapp||c.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/10 text-xs font-semibold text-success"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>:null}</div>
    </li>)}</ul>}
  </AppShell>;
}
