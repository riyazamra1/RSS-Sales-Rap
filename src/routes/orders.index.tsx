import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, CloudOff, CloudUpload, CheckCircle2 } from "lucide-react";
import { AppShell, EmptyState, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { orders, type OrderStatus } from "@/lib/mock-data";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Create and track sales orders, invoices, payments and sync status from the field on any device.",
      },
      { property: "og:title", content: "Orders — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Order pipeline with totals, payments, balances and sync status.",
      },
    ],
  }),
  component: OrdersPage,
});

const statuses: ("All" | OrderStatus)[] = [
  "All",
  "Draft",
  "Pending",
  "Confirmed",
  "Processing",
  "Completed",
  "Cancelled",
];

const statusTone = (s: OrderStatus) =>
  s === "Completed" || s === "Confirmed"
    ? "success"
    : s === "Cancelled" || s === "Returned"
      ? "danger"
      : s === "Draft"
        ? "neutral"
        : "warning";

function OrdersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) =>
        q ? [o.id, o.invoiceId, o.customerName, o.date].some((f) => f.toLowerCase().includes(q)) : true,
      )
      .filter((o) => (status === "All" ? true : o.status === status))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [query, status]);

  const pendingSync = orders.filter((o) => o.sync !== "SYNCED").length;
  const monthTotal = orders
    .filter((o) => o.status !== "Cancelled" && o.status !== "Draft")
    .reduce((s, o) => s + o.netTotal, 0);

  return (
    <AppShell
      title="Orders"
      subtitle={`${orders.length} orders this month`}
      action={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order no, invoice, customer"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-9 pr-3 text-sm text-navy-foreground placeholder:text-navy-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Month Sales" value={money(monthTotal)} hint="Confirmed & completed" />
        <StatCard
          label="Waiting to sync"
          value={`${pendingSync} orders`}
          hint={pendingSync ? "Will sync automatically" : "All data synchronized."}
          tone={pendingSync ? "warning" : "success"}
        />
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <SectionTitle right={<span className="text-xs text-muted-foreground">{list.length} shown</span>}>
        Order list
      </SectionTitle>

      {list.length === 0 ? (
        <EmptyState title="No orders match" hint="Adjust the filters or search term." />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const balance = o.netTotal - o.payment;
            const SyncIcon =
              o.sync === "SYNCED" ? CheckCircle2 : o.sync === "PENDING SYNC" ? CloudUpload : CloudOff;
            return (
              <li key={o.id} className="surface-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{o.id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {shortDate(o.date)} · {o.customerName}
                    </p>
                  </div>
                  <Pill tone={statusTone(o.status)}>{o.status}</Pill>
                </div>

                <div className="num mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">{money(o.netTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p className="font-semibold text-success">{money(o.payment)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-semibold text-destructive">{money(balance)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <SyncIcon
                      className={`h-3.5 w-3.5 ${o.sync === "SYNCED" ? "text-success" : "text-warning"}`}
                    />
                    {o.sync}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{o.invoiceId}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/orders/new"
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg"
      >
        <Plus className="h-5 w-5" /> New Order
      </Link>
    </AppShell>
  );
}
