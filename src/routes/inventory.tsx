import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { products, stockStatus } from "@/lib/mock-data";
import { money } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — RSS Sales Manager" },
      {
        name: "description",
        content:
          "CCTV, networking and computer hardware stock levels, wholesale and retail pricing at a glance.",
      },
      { property: "og:title", content: "Inventory — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Live stock levels, low-stock alerts and price lists for the field team.",
      },
    ],
  }),
  component: InventoryPage,
});

const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const { session } = useAuth();

  const savedQuery = useQuery({
    queryKey: ["products"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, brand, model, unit, stock, min_stock, sales_price")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const savedItems = savedQuery.data ?? [];


  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) =>
        q ? [p.name, p.sku, p.barcode, p.model, p.brand].some((f) => f.toLowerCase().includes(q)) : true,
      )
      .filter((p) => (category === "All" ? true : p.category === category));
  }, [query, category]);

  const lowStock = products.filter((p) => stockStatus(p) === "LOW STOCK").length;
  const outOfStock = products.filter((p) => stockStatus(p) === "OUT OF STOCK").length;
  const stockValue = products.reduce((s, p) => s + p.stock * p.salesPrice, 0);

  return (
    <AppShell
      title="Inventory"
      subtitle={`${products.length} active products`}
      action={
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, SKU, barcode, model"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-9 pr-3 text-sm text-navy-foreground placeholder:text-navy-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Scan barcode">
            <ScanLine className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Stock Value" value={money(stockValue, { compact: true })} />
        <StatCard label="Low Stock" value={String(lowStock)} tone="warning" />
        <StatCard label="Out of Stock" value={String(outOfStock)} tone="danger" />
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              category === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {savedItems.length > 0 ? (
        <>
          <SectionTitle
            right={<span className="text-xs text-muted-foreground">{savedItems.length}</span>}
          >
            Catalogue items
          </SectionTitle>
          <ul className="space-y-3">
            {savedItems.map((p) => (
              <li key={p.id} className="surface-card flex items-start gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    <Pill tone={p.stock > p.min_stock ? "success" : p.stock > 0 ? "warning" : "danger"}>
                      {p.stock} {p.unit}
                    </Pill>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.sku, p.brand, p.model].filter(Boolean).join(" · ")}
                  </p>
                  <p className="num mt-1 text-sm font-semibold">{money(Number(p.sales_price))}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <SectionTitle right={<span className="text-xs text-muted-foreground">{list.length} shown</span>}>
        Products
      </SectionTitle>


      {list.length === 0 ? (
        <EmptyState title="Product not found." hint="Check the SKU or scan the barcode again." />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const status = stockStatus(p);
            const open = openId === p.id;
            return (
              <li key={p.id} className="surface-card overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="flex w-full items-start gap-3 p-3.5 text-left"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-[10px] font-bold uppercase text-muted-foreground">
                    {p.brand.slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold">{p.name}</span>
                      <Pill
                        tone={
                          status === "IN STOCK" ? "success" : status === "LOW STOCK" ? "warning" : "danger"
                        }
                      >
                        {status}
                      </Pill>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {p.sku} · {p.model} · {p.brand}
                    </span>
                    <span className="num mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                      <span className="font-bold text-foreground">{money(p.salesPrice)}</span>
                      <span className="text-muted-foreground">W/S {money(p.wholesalePrice)}</span>
                      <span className="text-muted-foreground">
                        Stock {p.stock} {p.unit.toLowerCase()}
                      </span>
                    </span>
                  </span>
                </button>

                {open ? (
                  <div className="border-t border-border bg-secondary/40 px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <dl className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {[
                        ["Barcode", p.barcode],
                        ["Category", p.category],
                        ["Unit", p.unit],
                        ["Minimum stock", String(p.minStock)],
                        ["Supplier", p.supplier],
                        ["Warranty", p.warranty],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="truncate font-medium">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 rounded-lg bg-card px-3 py-2 text-[11px] text-muted-foreground">
                      Purchase price is hidden for your role.
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
