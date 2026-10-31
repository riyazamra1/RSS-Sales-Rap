import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/customers/new")({
  head: () => ({
    meta: [
      { title: "New customer — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Sales reps can register a new shop or dealer account with contact details, area and credit limit.",
      },
      { property: "og:title", content: "New customer — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Register a new customer account from the field in seconds.",
      },
    ],
  }),
  component: NewCustomerPage,
});

const categories = ["Retail", "Wholesale", "Dealer", "Corporate"];

function NewCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useAuth();

  const [form, setForm] = useState({
    shop_name: "",
    contact_person: "",
    phone: "",
    whatsapp: "",
    address: "",
    area: "",
    category: "Retail",
    credit_limit: "",
    note: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error("Please sign in first.");
      if (!form.shop_name.trim()) throw new Error("Shop name is required.");
      const { error } = await supabase.from("customers").insert({
        shop_name: form.shop_name.trim(),
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        address: form.address.trim() || null,
        area: form.area.trim() || null,
        category: form.category,
        credit_limit: Number(form.credit_limit || 0),
        note: form.note.trim() || null,
        created_by: session.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer added");
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/" })}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              Customer book
            </p>
            <h1 className="truncate text-xl font-bold">New customer</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {!loading && !session ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            Sign in to add customers.
          </p>
        ) : null}

        <div className="surface-card space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Store className="h-4 w-4 text-primary" /> Shop details
          </div>
          <input
            className={field}
            placeholder="Shop / company name *"
            value={form.shop_name}
            onChange={(e) => set("shop_name", e.target.value)}
          />
          <input
            className={field}
            placeholder="Contact person"
            value={form.contact_person}
            onChange={(e) => set("contact_person", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={field}
              placeholder="Phone"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <input
              className={field}
              placeholder="WhatsApp"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </div>
          <input
            className={field}
            placeholder="Address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={field}
              placeholder="Area / city"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
            />
            <input
              className={field}
              placeholder="Credit limit"
              inputMode="decimal"
              value={form.credit_limit}
              onChange={(e) => set("credit_limit", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => set("category", c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                  form.category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <textarea
            className="min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !session}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save customer
        </button>
      </main>
    </div>
  );
}
