import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Boxes } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money } from "@/lib/format";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [
    { title: "Inventory — RSS Sales Manager" },
    { name: "description", content: "Live stock levels and product pricing from the RSS product catalogue." },
  ] }),
  component: InventoryPage,
});

type ProductRow = {
  id: string; name: string; sku: string; barcode: string | null; brand: string;
  model: string; category: string; unit: string; wholesale_price: number;
  sales_price: number; stock: number; min_stock: number; supplier: string | null;
  warranty: string | null; description: string | null; is_active: boolean;
};

function InventoryPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const productsQuery = useQuery({
    queryKey: ["products"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("id, name, sku, barcode, brand, model, category, unit, wholesale_price, sales_price, stock, min_stock, supplier, warranty, description, is_active")
        .eq("is_active", true).order("name");
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });
  const products = productsQuery.data ?? [];
  const categories = ["All", ...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p =>
      (category === "All" || p.category === category) &&
      (!q || [p.name,p.sku,p.barcode??"",p.brand,p.model,p.category].some(v=>v.toLowerCase().includes(q)))
    );
  }, [products, query, category]);
  const stockValue = products.reduce((sum,p)=>sum+Number(p.stock||0)*Number(p.sales_price||0),0);
  const lowStock = products.filter(p=>Number(p.stock)>0&&Number(p.stock)<=Number(p.min_stock));
  const outOfStock = products.filter(p=>Number(p.stock)<=0);

  if (!session) return <AppShell title="Inventory"><div className="surface-card p-4 text-sm">Sign in to view the live product catalogue.</div></AppShell>;
  return <AppShell title="Inventory" subtitle="Live product catalogue">
    <div className="grid grid-cols-3 gap-3"><StatCard label="Stock value" value={money(stockValue,{compact:true})} /><StatCard label="Low stock" value={String(lowStock.length)} tone="warning" /><StatCard label="Out of stock" value={String(outOfStock.length)} tone="danger" /></div>
    <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search product, SKU, barcode or model" className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm" /></div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{categories.map(cat=><button key={cat} onClick={()=>setCategory(cat)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${category===cat?"border-primary bg-primary text-primary-foreground":"border-border bg-card text-muted-foreground"}`}>{cat}</button>)}</div>
    <SectionTitle right={<span className="text-xs text-muted-foreground">{list.length} shown</span>}>Products</SectionTitle>
    {productsQuery.isLoading ? <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : productsQuery.error ? <div className="surface-card p-4 text-sm text-destructive">Could not load inventory: {(productsQuery.error as Error).message}</div> : list.length===0 ? <EmptyState title="No saved products" hint="Add your real products in Admin → Manage inventory items. Sample catalogue entries are excluded." /> : <ul className="space-y-3">{list.map(p=>{
      const stockState = Number(p.stock)<=0 ? "OUT OF STOCK" : Number(p.stock)<=Number(p.min_stock) ? "LOW STOCK" : "IN STOCK";
      const expanded = openId===p.id;
      return <li key={p.id} className="surface-card overflow-hidden">
        <button onClick={()=>setOpenId(expanded?null:p.id)} className="flex w-full items-start gap-3 p-3.5 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-xs font-bold text-muted-foreground">{p.brand.slice(0,3)||"SKU"}</span>
          <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="truncate text-sm font-semibold">{p.name}</span><Pill tone={stockState==="IN STOCK"?"success":stockState==="LOW STOCK"?"warning":"danger"}>{stockState}</Pill></span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{p.sku} · {p.model} · {p.brand}</span><span className="num mt-1.5 flex flex-wrap gap-x-3 text-xs"><span className="font-bold">{money(Number(p.sales_price))}</span><span className="text-muted-foreground">Wholesale {money(Number(p.wholesale_price))}</span><span className="text-muted-foreground">Stock {p.stock} {p.unit}</span></span></span>
        </button>
        {expanded?<div className="border-t border-border bg-secondary/40 px-3.5 py-3"><p className="text-xs text-muted-foreground">{p.description||"No description saved."}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Barcode</dt><dd className="font-medium">{p.barcode||"—"}</dd></div><div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{p.category}</dd></div><div><dt className="text-muted-foreground">Minimum stock</dt><dd className="font-medium">{p.min_stock}</dd></div><div><dt className="text-muted-foreground">Supplier</dt><dd className="font-medium">{p.supplier||"—"}</dd></div><div><dt className="text-muted-foreground">Warranty</dt><dd className="font-medium">{p.warranty||"—"}</dd></div></dl></div>:null}
      </li>;
    })}</ul>}
    <div className="surface-card mt-4 flex items-start gap-2 p-3 text-xs text-muted-foreground"><Boxes className="mt-0.5 h-4 w-4 shrink-0" /> Stock counts and prices are read from the saved product catalogue. Orders do not decrement stock until a stock-posting workflow is configured.</div>
  </AppShell>;
}
