import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Check, Minus, Plus, ScanLine, Search, Trash2 } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle } from "@/components/AppShell";
import { customers, products, type Customer, type Product } from "@/lib/mock-data";
import { money } from "@/lib/format";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "New Order — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Fast three-step order entry: pick the customer, add products, take payment and confirm on the spot.",
      },
      { property: "og:title", content: "New Order — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Field order entry with credit checks, price types and instant totals.",
      },
    ],
  }),
  component: NewOrderPage,
});

type PriceType = "Sales" | "Wholesale" | "Custom";
type Line = { product: Product; qty: number; unitPrice: number; priceType: PriceType; discount: number };

function NewOrderPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [payment, setPayment] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice - l.discount, 0);
  const netTotal = Math.max(0, subtotal - overallDiscount + otherCharges);
  const previousBalance = customer?.outstanding ?? 0;
  const newBalance = previousBalance + netTotal - payment;
  const creditExceeded = customer ? newBalance > customer.creditLimit : false;

  return (
    <AppShell title="New Order" subtitle={`Step ${step} of 3`}>
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Cancel and go back
      </Link>

      <ol className="mb-4 grid grid-cols-3 gap-2">
        {["Customer", "Products", "Payment"].map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = step > n;
          return (
            <li key={label}>
              <button
                onClick={() => (n === 1 || customer ? setStep(n) : null)}
                className={`w-full rounded-xl border px-2 py-2 text-xs font-semibold ${
                  step === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-success/40 bg-success/10 text-success-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? "✓ " : `${n}. `}
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <StepCustomer
          customer={customer}
          onSelect={(c) => {
            setCustomer(c);
            setStep(2);
          }}
        />
      ) : null}

      {step === 2 && customer ? (
        <StepProducts lines={lines} setLines={setLines} customerType={customer.type} />
      ) : null}

      {step === 3 && customer ? (
        <StepSummary
          customer={customer}
          lines={lines}
          subtotal={subtotal}
          overallDiscount={overallDiscount}
          setOverallDiscount={setOverallDiscount}
          otherCharges={otherCharges}
          setOtherCharges={setOtherCharges}
          payment={payment}
          setPayment={setPayment}
          netTotal={netTotal}
          previousBalance={previousBalance}
          newBalance={newBalance}
          creditExceeded={creditExceeded}
        />
      ) : null}

      {step > 1 ? (
        <div
          className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
          style={{ boxShadow: "var(--shadow-nav)" }}
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="num text-lg font-bold">{money(netTotal)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.success("Draft saved. Stock is not reduced for drafts.")}
                className="h-12 flex-1 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
              >
                SAVE DRAFT
              </button>
              {step === 2 ? (
                <button
                  disabled={lines.length === 0}
                  onClick={() => setStep(3)}
                  className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  CONTINUE
                </button>
              ) : (
                <button
                  disabled={lines.length === 0}
                  onClick={() => setConfirming(true)}
                  className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  CONFIRM ORDER
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {confirming && customer ? (
        <ConfirmDialog
          customerName={customer.company}
          netTotal={netTotal}
          payment={payment}
          newBalance={newBalance}
          creditExceeded={creditExceeded}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            toast.success("Order ORD-2026-001023 confirmed", {
              description: "Invoice INV-2026-001023 generated · stock updated · queued for sync.",
            });
          }}
        />
      ) : null}
    </AppShell>
  );
}

function StepCustomer({
  customer,
  onSelect,
}: {
  customer: Customer | null;
  onSelect: (c: Customer) => void;
}) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) =>
      q ? [c.name, c.company, c.phone, c.id].some((f) => f.toLowerCase().includes(q)) : true,
    );
  }, [query]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer name, company, phone, ID"
          className="h-12 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <SectionTitle>Select customer</SectionTitle>
      {list.length === 0 ? (
        <EmptyState title="No customer found" />
      ) : (
        <ul className="space-y-2">
          {list.map((c) => {
            const available = c.creditLimit - c.outstanding;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c)}
                  className={`surface-card w-full p-3.5 text-left ${
                    customer?.id === c.id ? "border-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.company}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.name} · {c.phone}
                      </p>
                    </div>
                    <Pill tone="info">{c.type}</Pill>
                  </div>
                  <div className="num mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Outstanding</p>
                      <p className="font-semibold text-destructive">{money(c.outstanding)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Credit limit</p>
                      <p className="font-semibold">{money(c.creditLimit)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className={`font-semibold ${available < 0 ? "text-destructive" : "text-success"}`}>
                        {money(available)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StepProducts({
  lines,
  setLines,
  customerType,
}: {
  lines: Line[];
  setLines: (l: Line[]) => void;
  customerType: Customer["type"];
}) {
  const [query, setQuery] = useState("");
  const defaultType: PriceType =
    customerType === "Wholesale" || customerType === "Dealer" ? "Wholesale" : "Sales";

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 4);
    return products.filter((p) =>
      [p.name, p.sku, p.barcode, p.model, p.brand].some((f) => f.toLowerCase().includes(q)),
    );
  }, [query]);

  function addProduct(p: Product) {
    if (p.stock === 0) {
      toast.error("Out of stock", { description: `${p.name} cannot be added.` });
      return;
    }
    const existing = lines.find((l) => l.product.id === p.id);
    if (existing) {
      setLines(lines.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l)));
      return;
    }
    setLines([
      ...lines,
      {
        product: p,
        qty: 1,
        unitPrice: defaultType === "Wholesale" ? p.wholesalePrice : p.salesPrice,
        priceType: defaultType,
        discount: 0,
      },
    ]);
  }

  function update(id: string, patch: Partial<Line>) {
    setLines(lines.map((l) => (l.product.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <div className="pb-36">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, SKU, model"
            className="h-12 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => toast.info("Camera scanner opens on device")}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
          aria-label="Scan barcode"
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>

      <SectionTitle>{query ? "Search results" : "Recently ordered"}</SectionTitle>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="surface-card flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.model} · Stock {p.stock}
              </p>
              <p className="num mt-0.5 text-xs">
                <span className="font-semibold">{money(p.salesPrice)}</span>
                <span className="ml-2 text-muted-foreground">W/S {money(p.wholesalePrice)}</span>
              </p>
            </div>
            <button
              onClick={() => addProduct(p)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
              disabled={p.stock === 0}
              aria-label={`Add ${p.name}`}
            >
              <Plus className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <SectionTitle>Order items ({lines.length})</SectionTitle>
      {lines.length === 0 ? (
        <EmptyState title="No products added" hint="Search or scan to add the first item." />
      ) : (
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.product.id} className="surface-card p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{l.product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.product.sku}</p>
                </div>
                <button
                  onClick={() => setLines(lines.filter((x) => x.product.id !== l.product.id))}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["Sales", "Wholesale", "Custom"] as PriceType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      update(l.product.id, {
                        priceType: t,
                        unitPrice:
                          t === "Sales"
                            ? l.product.salesPrice
                            : t === "Wholesale"
                              ? l.product.wholesalePrice
                              : l.unitPrice,
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      l.priceType === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {t} price
                  </button>
                ))}
              </div>
              {l.priceType === "Custom" ? (
                <p className="mt-2 text-[11px] text-warning-foreground">
                  Custom price requires manager approval before confirming.
                </p>
              ) : null}

              <div className="mt-3 grid grid-cols-[auto_1fr_1fr] items-end gap-2">
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">Qty</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => update(l.product.id, { qty: Math.max(1, l.qty - 1) })}
                      className="grid h-9 w-9 place-items-center rounded-lg bg-secondary"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="num w-9 text-center text-sm font-bold">{l.qty}</span>
                    <button
                      onClick={() =>
                        update(l.product.id, { qty: Math.min(l.product.stock, l.qty + 1) })
                      }
                      className="grid h-9 w-9 place-items-center rounded-lg bg-secondary"
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">Unit price</p>
                  <input
                    type="number"
                    min={0}
                    value={l.unitPrice}
                    onChange={(e) =>
                      update(l.product.id, {
                        unitPrice: Math.max(0, Number(e.target.value)),
                        priceType: "Custom",
                      })
                    }
                    className="num h-9 w-full rounded-lg border border-input bg-card px-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">Line discount</p>
                  <input
                    type="number"
                    min={0}
                    value={l.discount}
                    onChange={(e) => update(l.product.id, { discount: Math.max(0, Number(e.target.value)) })}
                    className="num h-9 w-full rounded-lg border border-input bg-card px-2 text-sm"
                  />
                </div>
              </div>

              <p className="num mt-3 border-t border-border pt-2 text-right text-sm font-bold">
                {money(l.qty * l.unitPrice - l.discount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepSummary(props: {
  customer: Customer;
  lines: Line[];
  subtotal: number;
  overallDiscount: number;
  setOverallDiscount: (n: number) => void;
  otherCharges: number;
  setOtherCharges: (n: number) => void;
  payment: number;
  setPayment: (n: number) => void;
  netTotal: number;
  previousBalance: number;
  newBalance: number;
  creditExceeded: boolean;
}) {
  const {
    customer,
    lines,
    subtotal,
    overallDiscount,
    setOverallDiscount,
    otherCharges,
    setOtherCharges,
    payment,
    setPayment,
    netTotal,
    previousBalance,
    newBalance,
    creditExceeded,
  } = props;

  return (
    <div className="space-y-3 pb-40">
      {creditExceeded ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/8 p-3.5">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" /> CREDIT LIMIT EXCEEDED
          </p>
          <div className="num mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <span className="text-muted-foreground">Current balance</span>
            <span className="text-right font-semibold">{money(previousBalance)}</span>
            <span className="text-muted-foreground">New order</span>
            <span className="text-right font-semibold">{money(netTotal)}</span>
            <span className="text-muted-foreground">Projected balance</span>
            <span className="text-right font-semibold text-destructive">{money(newBalance)}</span>
            <span className="text-muted-foreground">Credit limit</span>
            <span className="text-right font-semibold">{money(customer.creditLimit)}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Manager approval is required before this order can be confirmed.
          </p>
        </div>
      ) : null}

      <div className="surface-card p-3.5">
        <p className="text-sm font-semibold">{customer.company}</p>
        <p className="text-xs text-muted-foreground">
          {customer.id} · {customer.type} · {customer.phone}
        </p>
      </div>

      <div className="surface-card divide-y divide-border">
        {lines.map((l) => (
          <div key={l.product.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{l.product.name}</p>
              <p className="num text-xs text-muted-foreground">
                {l.qty} × {money(l.unitPrice)}
                {l.discount ? ` − ${money(l.discount)}` : ""}
              </p>
            </div>
            <p className="num shrink-0 text-sm font-semibold">
              {money(l.qty * l.unitPrice - l.discount)}
            </p>
          </div>
        ))}
      </div>

      <div className="surface-card space-y-2.5 p-3.5">
        <Row label="Subtotal" value={money(subtotal)} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Overall discount</span>
          <input
            type="number"
            min={0}
            value={overallDiscount}
            onChange={(e) => setOverallDiscount(Math.max(0, Number(e.target.value)))}
            className="num h-9 w-32 rounded-lg border border-input bg-card px-2 text-right text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Other charges</span>
          <input
            type="number"
            min={0}
            value={otherCharges}
            onChange={(e) => setOtherCharges(Math.max(0, Number(e.target.value)))}
            className="num h-9 w-32 rounded-lg border border-input bg-card px-2 text-right text-sm"
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <span className="text-sm font-semibold">Net order total</span>
          <span className="num text-lg font-bold">{money(netTotal)}</span>
        </div>
      </div>

      <div className="surface-card space-y-2.5 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Payment now</span>
          <input
            type="number"
            min={0}
            value={payment}
            onChange={(e) => setPayment(Math.max(0, Number(e.target.value)))}
            className="num h-9 w-32 rounded-lg border border-input bg-card px-2 text-right text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Cash", "Bank Transfer", "Card", "Cheque"].map((m, i) => (
            <span
              key={m}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {m}
            </span>
          ))}
        </div>
        <Row label="Previous balance" value={money(previousBalance)} />
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <span className="text-sm font-semibold">New outstanding balance</span>
          <span className={`num text-lg font-bold ${creditExceeded ? "text-destructive" : ""}`}>
            {money(newBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="num text-sm font-semibold">{value}</span>
    </div>
  );
}

function ConfirmDialog({
  customerName,
  netTotal,
  payment,
  newBalance,
  creditExceeded,
  onCancel,
  onConfirm,
}: {
  customerName: string;
  netTotal: number;
  payment: number;
  newBalance: number;
  creditExceeded: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <h3 className="text-lg font-bold">Confirm order</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Order number will be generated automatically.
        </p>
        <dl className="num mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="max-w-[60%] truncate font-semibold">{customerName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order total</dt>
            <dd className="font-semibold">{money(netTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="font-semibold text-success">{money(payment)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">New balance</dt>
            <dd className={`font-semibold ${creditExceeded ? "text-destructive" : ""}`}>
              {money(newBalance)}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            <Check className="h-4 w-4" /> CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
