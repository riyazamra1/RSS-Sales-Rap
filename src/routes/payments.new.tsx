import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionTitle } from "@/components/AppShell";
import { money } from "@/lib/format";

export const Route = createFileRoute("/payments/new")({
  head: () => ({
    meta: [
      { title: "Collect payment — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Record a customer payment against outstanding bills without creating a new order — cash, bank transfer, cheque or card receipts.",
      },
      { property: "og:title", content: "Collect payment — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Standalone payment collection against outstanding invoices for RSS field reps.",
      },
    ],
  }),
  component: CollectPaymentPage,
});

const methods = ["Cash", "Bank Transfer", "Card", "Cheque", "Other"] as const;

function CollectPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading, session, user } = useAuth();

  const [customerId, setCustomerId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof methods)[number]>("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers")
        .select("id, shop_name, contact_person, phone, category, credit_limit, area")
        .order("shop_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const customer = (customersQuery.data ?? []).find((c) => c.id === customerId);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in");
      if (!customer) throw new Error("Select a customer");
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid amount");
      const { data, error } = await supabase
        .from("payment_receipts")
        .insert({
          customer_id: customer.id,
          customer_name: customer.shop_name,
          invoice_no: invoiceNo || null,
          amount: value,
          method,
          reference: reference.trim().slice(0, 80) || null,
          note: note.trim().slice(0, 300) || null,
          collected_by: user.id,
        })
        .select("receipt_no")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Payment recorded — ${data.receipt_no}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "receipts"] });
      setAmount("");
      setReference("");
      setNote("");
      setInvoiceNo("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-xl font-bold">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment collection is linked to your rep account.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const selectClass =
    "h-12 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/" })}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              No new order required
            </p>
            <h1 className="truncate text-xl font-bold">Collect payment</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <SectionTitle>Customer</SectionTitle>
        <select
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setInvoiceNo("");
          }}
          className={selectClass}
        >
          <option value="">Select a customer…</option>
          {(customersQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.shop_name} — {c.category}
            </option>
          ))}
        </select>

        {customer ? (
          <div className="surface-card mt-3 p-3.5">
            <p className="truncate text-sm font-semibold">{customer.shop_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[customer.contact_person, customer.phone, customer.area].filter(Boolean).join(" · ")}
            </p>
          </div>
        ) : null}
        {customerId ? (
          <>
            <SectionTitle>Invoice reference</SectionTitle>
            <p className="text-xs text-muted-foreground">Enter the actual invoice number if this receipt is for a specific invoice. No sample bills are shown.</p>
          </>
        ) : null}

        <SectionTitle>Payment details</SectionTitle>
        <div className="space-y-3">
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Amount received (Rs.)
            </label>
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="num h-14 w-full rounded-xl border border-border bg-card px-3.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="method" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Method
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as (typeof methods)[number])}
              className={selectClass}
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reference" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Reference (cheque / transfer no.)
            </label>
            <input
              id="reference"
              maxLength={80}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
              className={selectClass}
            />
          </div>
          <div>
            <label htmlFor="note" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Note
            </label>
            <textarea
              id="note"
              maxLength={300}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">Receipt total</p>
            <p className="num truncate text-lg font-bold">{money(Number(amount) || 0)}</p>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !customerId || !amount}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="h-4 w-4" />
            )}
            Record payment
          </button>
        </div>
      </div>
    </div>
  );
}
