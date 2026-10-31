import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Phone, Plus } from "lucide-react";
import { AppShell, Pill, SectionTitle, StatCard, EmptyState } from "@/components/AppShell";
import { billsByCustomer, customers, payments } from "@/lib/mock-data";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Profile — RSS Sales Manager" },
      {
        name: "description",
        content: "Customer profile with balance, credit limit, bill history and payment records.",
      },
      { property: "og:title", content: "Customer Profile — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Balance, credit limit, bill history and payments for a single account.",
      },
    ],
  }),
  loader: ({ params }) => {
    const customer = customers.find((c) => c.id === params.customerId);
    if (!customer) throw notFound();
    return { customer };
  },
  notFoundComponent: () => <EmptyState title="Customer not found" />,
  errorComponent: () => <EmptyState title="Could not load this customer" />,
  component: CustomerDetail,
});

function CustomerDetail() {
  const { customer: c } = Route.useLoaderData();
  const bills = billsByCustomer[c.id] ?? [];
  const custPayments = payments.filter((p) => p.customerId === c.id);
  const available = c.creditLimit - c.outstanding;
  const over = available < 0;

  return (
    <AppShell title={c.company} subtitle={`${c.id} · ${c.type}`}>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      <div className={`surface-card p-4 ${over ? "border-destructive/40" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Customer balance
          </h2>
          <Pill tone={over ? "danger" : "success"}>{over ? "Limit exceeded" : "Within limit"}</Pill>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Previous Outstanding</p>
            <p className="num mt-1 text-base font-bold text-destructive">{money(c.outstanding)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Credit Limit</p>
            <p className="num mt-1 text-base font-bold">{money(c.creditLimit)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Available Credit</p>
            <p className={`num mt-1 text-base font-bold ${over ? "text-destructive" : "text-success"}`}>
              {money(available)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${c.phone.replace(/\s/g, "")}`}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          <Phone className="h-4 w-4" /> Call
        </a>
        <a
          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-success/15 text-sm font-semibold text-success-foreground"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <Link
          to="/orders/new"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Order
        </Link>
      </div>

      <SectionTitle>Bill history</SectionTitle>
      {bills.length === 0 ? (
        <EmptyState title="No bills yet" hint="Invoices will appear here after the first order." />
      ) : (
        <ul className="space-y-2">
          {bills.map((b) => (
            <li key={b.invoiceNo} className="surface-card p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.invoiceNo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shortDate(b.date)} · {b.orderNo}
                  </p>
                </div>
                <Pill tone={b.status === "PAID" ? "success" : b.status === "PARTIAL" ? "warning" : "danger"}>
                  {b.status}
                </Pill>
              </div>
              <div className="num mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{money(b.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-success">{money(b.paid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold text-destructive">{money(b.total - b.paid)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Payments</SectionTitle>
      {custPayments.length === 0 ? (
        <EmptyState title="No payments recorded" />
      ) : (
        <ul className="space-y-2">
          {custPayments.map((p) => (
            <li key={p.id} className="surface-card flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.id}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {shortDate(p.date)} · {p.method} · {p.reference}
                </p>
              </div>
              <p className="num shrink-0 text-sm font-bold text-success">{money(p.amount)}</p>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Profile</SectionTitle>
      <dl className="surface-card divide-y divide-border">
        {[
          ["Contact person", c.contactPerson],
          ["Mobile", c.phone],
          ["WhatsApp", c.whatsapp],
          ["Email", c.email],
          ["Address", `${c.address}, ${c.city}`],
          ["Payment terms", c.paymentTerms],
          ["Assigned rep", c.rep],
          ["Opening balance", money(c.openingBalance)],
          ["Total purchases", money(c.totalPurchases)],
          ["Total payments", money(c.totalPayments)],
          ["Last order", shortDate(c.lastOrderDate)],
          ["Last payment", shortDate(c.lastPaymentDate)],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5">
            <dt className="truncate text-xs text-muted-foreground">{k}</dt>
            <dd className="num truncate text-right text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <StatCard label="Customer statement" value="PDF · Print · WhatsApp" hint="Available in phase 2" />
    </AppShell>
  );
}
