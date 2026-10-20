import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MessageCircle, ChevronRight, Plus, Wallet, UserPlus } from "lucide-react";
import { AppShell, Pill, StatCard, SectionTitle, EmptyState } from "@/components/AppShell";
import { customers, type CustomerType } from "@/lib/mock-data";
import { money, initials } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Customers — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Manage CCTV and networking customers, credit limits and outstanding balances in the field with RSS Sales Manager.",
      },
      { property: "og:title", content: "Customers — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Field sales customer book with balances, credit limits and bill history.",
      },
    ],
  }),
  component: CustomersPage,
});

const filters: ("All" | CustomerType | "Outstanding")[] = [
  "All",
  "Outstanding",
  "Retail",
  "Wholesale",
  "Dealer",
  "Corporate",
];

function CustomersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const { session } = useAuth();

  const savedCustomers = useQuery({
    queryKey: ["customers"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, shop_name, contact_person, phone, whatsapp, area, category, credit_limit")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saved = savedCustomers.data ?? [];


  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) =>
        q
          ? [c.name, c.company, c.phone, c.id].some((f) => f.toLowerCase().includes(q))
          : true,
      )
      .filter((c) => {
        if (filter === "All") return true;
        if (filter === "Outstanding") return c.outstanding > 0;
        return c.type === filter;
      })
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [query, filter]);

  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const overLimit = customers.filter((c) => c.outstanding > c.creditLimit).length;

  return (
    <AppShell
      title="Customers"
      subtitle={`${customers.length} assigned accounts`}
      action={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, phone, ID"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-9 pr-3 text-sm text-navy-foreground placeholder:text-navy-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Outstanding"
          value={money(totalOutstanding)}
          hint="Across all accounts"
          tone="danger"
        />
        <StatCard
          label="Over Credit Limit"
          value={String(overLimit)}
          hint="Needs approval"
          tone="warning"
        />
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Link
        to="/customers/new"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-sm font-bold text-primary"
      >
        <UserPlus className="h-4 w-4" /> Add new customer
      </Link>

      {saved.length > 0 ? (
        <>
          <SectionTitle
            right={<span className="text-xs text-muted-foreground">{saved.length}</span>}
          >
            Customers you added
          </SectionTitle>
          <ul className="space-y-3">
            {saved.map((c) => (
              <li key={c.id} className="surface-card flex items-center gap-3 p-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {initials(c.shop_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{c.shop_name}</p>
                    <Pill>{c.category ?? "Shop"}</Pill>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.contact_person, c.area, c.phone].filter(Boolean).join(" · ")}
                  </p>
                  <p className="num mt-0.5 text-xs text-muted-foreground">
                    Credit limit {money(Number(c.credit_limit ?? 0))}
                  </p>
                  <Link to="/customers/$customerId" params={{ customerId: c.id }} className="mt-1 inline-block text-xs font-semibold text-primary">Open customer profile</Link>
                </div>
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
                    aria-label={`Call ${c.shop_name}`}
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <SectionTitle right={<span className="text-xs text-muted-foreground">{list.length} shown</span>}>
        Customer list
      </SectionTitle>


      {list.length === 0 ? (
        <EmptyState title="No customers found" hint="Try a different search or filter." />
      ) : (
        <ul className="space-y-3">
          {list.map((c) => {
            const over = c.outstanding > c.creditLimit;
            return (
              <li key={c.id}>
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: c.id }}
                  className="surface-card flex items-center gap-3 p-3.5 active:scale-[0.995]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                    {initials(c.company)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{c.company}</p>
                      <Pill tone={c.status === "Active" ? "success" : c.status === "Blocked" ? "danger" : "neutral"}>
                        {c.status}
                      </Pill>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.id} · {c.type} · {c.city}
                    </p>
                    <p
                      className={`num mt-1 text-sm font-semibold ${over ? "text-destructive" : "text-foreground"}`}
                    >
                      {money(c.outstanding)}
                      <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                        outstanding
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
                <div className="mt-1.5 flex gap-2 px-1">
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    <Phone className="h-3 w-3" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success-foreground"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        <Link
          to="/payments/new"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-success px-4 text-sm font-bold text-success-foreground shadow-lg"
        >
          <Wallet className="h-4.5 w-4.5" /> Collect Payment
        </Link>
        <Link
          to="/orders/new"
          className="inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg"
        >
          <Plus className="h-5 w-5" /> New Order
        </Link>
      </div>
    </AppShell>
  );
}
