import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Boxes, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pill, SectionTitle } from "@/components/AppShell";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/items")({
  head: () => ({
    meta: [
      { title: "Manage items — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Admins add and manage CCTV, networking and hardware items with pricing, stock levels and suppliers.",
      },
      { property: "og:title", content: "Manage items — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Create and maintain the product catalogue used by the field sales team.",
      },
    ],
  }),
  component: AdminItemsPage,
});

const empty = {
  name: "",
  sku: "",
  barcode: "",
  brand: "",
  model: "",
  category: "",
  unit: "PCS",
  purchase_price: "",
  wholesale_price: "",
  sales_price: "",
  stock: "",
  min_stock: "",
  supplier: "",
  warranty: "",
  description: "",
};

function AdminItemsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading, session, isAdmin } = useAuth();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) void navigate({ to: "/admin/login", replace: true });
  }, [loading, session, isAdmin, navigate]);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const itemsQuery = useQuery({
    queryKey: ["products"],
    enabled: !!session && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.sku.trim()) throw new Error("Name and SKU are required.");
      const { data: created, error } = await supabase.from("products").insert({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        barcode: form.barcode.trim() || null,
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category.trim() || "General",
        unit: form.unit.trim() || "PCS",
        wholesale_price: Number(form.wholesale_price || 0),
        sales_price: Number(form.sales_price || 0),
        stock: Number(form.stock || 0),
        min_stock: Number(form.min_stock || 0),
        supplier: form.supplier.trim() || null,
        warranty: form.warranty.trim() || null,
        description: form.description.trim() || null,
        created_by: session?.user.id ?? null,
      }).select("id").single();
      if (error) throw error;
      const cost = Number(form.purchase_price || 0);
      if (created && cost > 0) {
        const { error: costError } = await supabase
          .from("product_costs")
          .upsert({ product_id: created.id, purchase_price: cost });
        if (costError) throw costError;
      }
    },
    onSuccess: () => {
      toast.success("Item added");
      setForm(empty);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removed");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
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

  const field =
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const items = itemsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/admin" })}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              Admin panel
            </p>
            <h1 className="truncate text-xl font-bold">Manage items</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="surface-card space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="h-4 w-4 text-primary" /> New item
          </div>
          <input
            className={field}
            placeholder="Item name *"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={field}
              placeholder="SKU *"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
            <input
              className={field}
              placeholder="Barcode"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
            />
            <input
              className={field}
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <input
              className={field}
              placeholder="Model"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
            <input
              className={field}
              placeholder="Category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
            <input
              className={field}
              placeholder="Unit (PCS)"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
            <input
              className={field}
              placeholder="Purchase price"
              inputMode="decimal"
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
            />
            <input
              className={field}
              placeholder="Wholesale price"
              inputMode="decimal"
              value={form.wholesale_price}
              onChange={(e) => set("wholesale_price", e.target.value)}
            />
            <input
              className={field}
              placeholder="Sales price"
              inputMode="decimal"
              value={form.sales_price}
              onChange={(e) => set("sales_price", e.target.value)}
            />
            <input
              className={field}
              placeholder="Stock qty"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
            <input
              className={field}
              placeholder="Minimum stock"
              inputMode="numeric"
              value={form.min_stock}
              onChange={(e) => set("min_stock", e.target.value)}
            />
            <input
              className={field}
              placeholder="Warranty"
              value={form.warranty}
              onChange={(e) => set("warranty", e.target.value)}
            />
          </div>
          <input
            className={field}
            placeholder="Supplier"
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
          />
          <textarea
            className="min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add item
          </button>
        </div>

        <SectionTitle right={<span className="text-xs text-muted-foreground">{items.length}</span>}>
          Catalogue
        </SectionTitle>

        {itemsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading items…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet. Add your first product above.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => (
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
                  <p className="num mt-1 text-sm font-semibold">
                    {money(Number(p.sales_price))}
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                      W/S {money(Number(p.wholesale_price))}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => remove.mutate(p.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
