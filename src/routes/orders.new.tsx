import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, SectionTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { money } from "@/lib/format";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New Order — RSS Sales Manager" }] }),
  component: NewOrderPage,
});

type CustomerRow = {
  id: string; shop_name: string; contact_person: string; phone: string;
  category: string; credit_limit: number; area: string | null;
};
type ProductRow = {
  id: string; name: string; sku: string; barcode: string | null; brand: string;
  model: string; category: string; unit: string; wholesale_price: number;
  sales_price: number; stock: number; min_stock: number; is_active: boolean;
};
type Line = { product: ProductRow; quantity: number; unitPrice: number; discount: number };

function NewOrderPage() {
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("0");
  const [charges, setCharges] = useState("0");
  const [payment, setPayment] = useState("0");
  const [note, setNote] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers")
        .select("id, shop_name, contact_person, phone, category, credit_limit, area")
        .order("shop_name");
      if (error) throw error;
      return (data ?? []) as CustomerRow[];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["products"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("id, name, sku, barcode, brand, model, category, unit, wholesale_price, sales_price, stock, min_stock, is_active")
        .eq("is_active", true).order("name");
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const selectedCustomer = customersQuery.data?.find(c => c.id === customerId);
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (customersQuery.data ?? []).filter(c =>
      !q || [c.shop_name, c.contact_person, c.phone, c.area ?? ""].some(v => v.toLowerCase().includes(q))
    );
  }, [customersQuery.data, search]);
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return (productsQuery.data ?? []).filter(p =>
      !q || [p.name, p.sku, p.barcode ?? "", p.brand, p.model].some(v => v.toLowerCase().includes(q))
    );
  }, [productsQuery.data, productSearch]);

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice - line.discount, 0);
  const orderDiscount = Math.max(0, Number(discount) || 0);
  const otherCharges = Math.max(0, Number(charges) || 0);
  const total = Math.max(0, subtotal - orderDiscount + otherCharges);
  const received = Math.max(0, Number(payment) || 0);

  function addProduct(product: ProductRow) {
    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }
    setLines(old => {
      const found = old.find(line => line.product.id === product.id);
      if (found) return old.map(line => line.product.id === product.id
        ? { ...line, quantity: Math.min(product.stock, line.quantity + 1) } : line);
      const wholesale = ["Wholesale", "Dealer"].includes(selectedCustomer?.category ?? "");
      return [...old, { product, quantity: 1, unitPrice: Number(wholesale ? product.wholesale_price : product.sales_price), discount: 0 }];
    });
  }
  function updateLine(id: string, patch: Partial<Pick<Line, "quantity" | "unitPrice" | "discount">>) {
    setLines(old => old.map(line => line.product.id === id ? { ...line, ...patch } : line));
  }

  const saveOrder = useMutation({
    mutationFn: async (status: "Draft" | "Pending") => {
      if (!user) throw new Error("Sign in to create an order.");
      if (!selectedCustomer) throw new Error("Choose a customer.");
      if (!lines.length) throw new Error("Add at least one product.");
      if (lines.some(l => l.quantity < 1 || l.quantity > l.product.stock)) throw new Error("Order quantity exceeds available stock.");
      if (lines.some(l => l.discount < 0 || l.discount > l.quantity * l.unitPrice)) throw new Error("Check line discounts.");
      if (orderDiscount > subtotal) throw new Error("Order discount cannot exceed subtotal.");
      if (received > total) throw new Error("Payment cannot exceed the order total.");
      const { data: order, error: orderError } = await supabase.from("sales_orders").insert({
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.shop_name,
        created_by: user.id,
        status: "Draft",
        subtotal,
        discount: orderDiscount,
        other_charges: otherCharges,
        total,
        payment_received: received,
        note: note.trim() || null,
      }).select("id, order_no").single();
      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from("sales_order_items").insert(
        lines.map(line => ({
          order_id: order.id,
          product_id: line.product.id,
          product_name: line.product.name,
          sku: line.product.sku,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          discount: line.discount,
          line_total: line.quantity * line.unitPrice - line.discount,
        }))
      );
      if (itemError) {
        await supabase.from("sales_orders").delete().eq("id", order.id);
        throw itemError;
      }
      if (status === "Pending") {
        const { error } = await supabase.from("sales_orders").update({ status: "Pending" }).eq("id", order.id);
        if (error) throw error;
      }
      return { ...order, status };
    },
    onSuccess: (order) => {
      toast.success(order.status === "Draft" ? "Draft saved" : "Order submitted", {
        description: order.order_no,
      });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void navigate({ to: "/orders" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!session) return <AppShell title="New Order"><div className="surface-card p-4">Sign in to create an order. <Link to="/login" className="text-primary underline">Sign in</Link></div></AppShell>;

  const field = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <AppShell title="New Order" subtitle="Create a real order from your live catalogue" action={<Link to="/orders" className="inline-flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Orders</Link>}>
      <section className="surface-card space-y-3 p-4">
        <SectionTitle>1. Customer</SectionTitle>
        <input className={field} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, contact or phone" />
        {customersQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : customersQuery.error ? <p className="text-sm text-destructive">Could not load customers: {(customersQuery.error as Error).message}</p> : filteredCustomers.length === 0 ? <EmptyState title="No customers available" hint="Add a real customer before creating an order." /> : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredCustomers.map(c => <button key={c.id} onClick={() => setCustomerId(c.id)} className={`w-full rounded-xl border p-3 text-left ${customerId === c.id ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex justify-between gap-2"><span className="font-semibold">{c.shop_name}</span><span className="text-xs text-muted-foreground">{c.category}</span></div>
              <p className="text-xs text-muted-foreground">{[c.contact_person, c.phone, c.area].filter(Boolean).join(" · ")}</p>
              <p className="text-xs">Credit limit: {money(Number(c.credit_limit || 0))}</p>
            </button>)}
          </div>
        )}
      </section>

      <section className="surface-card mt-4 space-y-3 p-4">
        <SectionTitle>2. Products and quantities</SectionTitle>
        <input className={field} value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search live catalogue by name, SKU or barcode" />
        {productsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : productsQuery.error ? <p className="text-sm text-destructive">Could not load products: {(productsQuery.error as Error).message}</p> : filteredProducts.length === 0 ? <EmptyState title="No products found" hint="Add products in Admin → Manage items." /> : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {filteredProducts.map(p => <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku} · Stock {p.stock} {p.unit}</p><p className="num text-xs">{money(Number(p.sales_price))} <span className="text-muted-foreground">wholesale {money(Number(p.wholesale_price))}</span></p></div>
              <button disabled={p.stock <= 0} onClick={() => addProduct(p)} className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40" aria-label={`Add ${p.name}`}><Plus className="h-4 w-4" /></button>
            </div>)}
          </div>
        )}
        <SectionTitle>Order items ({lines.length})</SectionTitle>
        {lines.length === 0 ? <EmptyState title="No products added" hint="Choose products above to build the order." /> : <div className="space-y-3">
          {lines.map(line => <div key={line.product.id} className="rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{line.product.name}</p><p className="text-xs text-muted-foreground">{line.product.sku}</p></div><button onClick={() => setLines(old => old.filter(l => l.product.id !== line.product.id))} aria-label="Remove item" className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <label className="text-xs text-muted-foreground">Quantity<input className={field+" mt-1"} type="number" min="1" max={line.product.stock} value={line.quantity} onChange={e => updateLine(line.product.id,{quantity:Math.min(line.product.stock,Math.max(1,Number(e.target.value)||1))})} /></label>
              <label className="text-xs text-muted-foreground">Unit price<input className={field+" mt-1"} type="number" min="0" value={line.unitPrice} onChange={e => updateLine(line.product.id,{unitPrice:Math.max(0,Number(e.target.value)||0)})} /></label>
              <label className="text-xs text-muted-foreground">Discount<input className={field+" mt-1"} type="number" min="0" max={line.quantity*line.unitPrice} value={line.discount} onChange={e => updateLine(line.product.id,{discount:Math.max(0,Number(e.target.value)||0)})} /></label>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="text-xs text-muted-foreground">Line total</span><strong className="num">{money(line.quantity*line.unitPrice-line.discount)}</strong></div>
            <div className="mt-2 flex gap-2"><button className="rounded-lg bg-secondary px-3 py-1.5 text-xs" onClick={() => updateLine(line.product.id,{quantity:Math.max(1,line.quantity-1)})}><Minus className="inline h-3 w-3" /> Qty</button><button className="rounded-lg bg-secondary px-3 py-1.5 text-xs" onClick={() => updateLine(line.product.id,{quantity:Math.min(line.product.stock,line.quantity+1)})}><Plus className="inline h-3 w-3" /> Qty</button></div>
          </div>)}
        </div>}
      </section>

      <section className="surface-card mt-4 space-y-3 p-4">
        <SectionTitle>3. Totals and payment</SectionTitle>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="num">{money(subtotal)}</span></div>
        <label className="block text-sm">Order discount<input className={field+" mt-1"} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} /></label>
        <label className="block text-sm">Other charges<input className={field+" mt-1"} type="number" min="0" value={charges} onChange={e => setCharges(e.target.value)} /></label>
        <label className="block text-sm">Payment collected now<input className={field+" mt-1"} type="number" min="0" value={payment} onChange={e => setPayment(e.target.value)} /></label>
        <label className="block text-sm">Order note<textarea className="mt-1 min-h-20 w-full rounded-xl border border-input bg-card p-3 text-sm" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional delivery or order notes" /></label>
        <div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><span>Total</span><span className="num">{money(total)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Balance due</span><span className="num">{money(Math.max(0,total-received))}</span></div>
        {selectedCustomer ? <p className="text-xs text-muted-foreground">Customer: {selectedCustomer.shop_name} · {selectedCustomer.category}</p> : <p className="text-xs text-destructive">Select a customer to continue.</p>}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button disabled={saveOrder.isPending || !selectedCustomer || !lines.length} onClick={() => saveOrder.mutate("Draft")} className="h-12 rounded-xl bg-secondary font-bold disabled:opacity-40">{saveOrder.isPending ? "Saving…" : "Save draft"}</button>
          <button disabled={saveOrder.isPending || !selectedCustomer || !lines.length} onClick={() => saveOrder.mutate("Pending")} className="h-12 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-40"><ShoppingCart className="mr-1 inline h-4 w-4" />{saveOrder.isPending ? "Submitting…" : "Submit order"}</button>
        </div>
        <p className="text-xs text-muted-foreground">Submitted orders are saved with status Pending for admin review. Stock is deducted when the admin marks the order INVOICED.</p>
      </section>
    </AppShell>
  );
}
