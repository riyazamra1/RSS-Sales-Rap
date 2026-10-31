import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pill, SectionTitle } from "@/components/AppShell";
import { billsByCustomer, customers } from "@/lib/mock-data";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

  const customer = useMemo(() => customers.find((c) => c.id === customerId), [customerId]);
  const openBills = useMemo(
    () => (customerId ? (billsByCustomer[customerId] ?? []).filter((b) => b.status !== "PAID") : []),
    [customerId],
  );

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
          customer_name: customer.company,
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
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company} — {money(c.outstanding)} due
            </option>
          ))}
        </select>

        {customer ? (
          <div className="surface-card mt-3 flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{customer.company}</p>
              <p className="truncate text-xs text-muted-foreground">
                {customer.id} · {customer.paymentTerms}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="num text-sm font-bold text-destructive">
                {money(customer.outstanding)}
              </p>
              <p className="text-[11px] text-muted-foreground">outstanding</p>
            </div>
          </div>
        ) : null}

        {customerId ? (
          <>
            <SectionTitle>Allocate to bill</SectionTitle>
            <div className="space-y-2">
              <button
                onClick={() => setInvoiceNo("")}
                className={`surface-card flex w-full items-center justify-between gap-3 p-3.5 text-left ${
                  invoiceNo === "" ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="text-sm font-medium">Advance / general receipt</span>
                <Pill tone="info">No bill</Pill>
              </button>
              {openBills.map((b) => (
                <button
                  key={b.invoiceNo}
                  onClick={() => {
                    setInvoiceNo(b.invoiceNo);
                    setAmount(String(b.total - b.paid));
                  }}
                  className={`surface-card flex w-full items-center justify-between gap-3 p-3.5 text-left ${
                    invoiceNo === b.invoiceNo ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{b.invoiceNo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {b.date} · {money(b.total)} billed
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block text-sm font-semibold text-destructive">
                      {money(b.total - b.paid)}
                    </span>
                    <Pill tone={b.status === "PARTIAL" ? "warning" : "danger"}>{b.status}</Pill>
                  </span>
                </button>
              ))}
            </div>
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
