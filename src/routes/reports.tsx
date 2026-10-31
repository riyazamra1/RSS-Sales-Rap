import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { currentUser, orders, payments, products, salesByCategory, salesByDay, stockStatus, topProducts } from "@/lib/mock-data";
import { money } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly sales, collections, inventory value and target achievement for the RSS field team.",
      },
      { property: "og:title", content: "Reports — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Sales, collections, inventory and profit reporting for reps and management.",
      },
    ],
  }),
  component: ReportsPage,
});

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ReportsPage() {
  const [view, setView] = useState<"Rep" | "Admin">("Rep");

  const todaySales = 187_500;
  const weekSales = salesByDay.reduce((s, d) => s + d.sales, 0);
  const monthSales = currentUser.achieved;
  const achievement = Math.round((currentUser.achieved / currentUser.target) * 100);
  const collections = payments.reduce((s, p) => s + p.amount, 0);
  const stockValue = products.reduce((s, p) => s + p.stock * p.salesPrice, 0);
  const cogs = 1_744_000;
  const grossProfit = monthSales - cogs - 42_500;

  return (
    <AppShell
      title="Reports"
      subtitle={view === "Rep" ? "Your performance" : "Company overview"}
      action={
        <div className="flex rounded-xl bg-white/10 p-1">
          {(["Rep", "Admin"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-9 flex-1 rounded-lg text-xs font-bold ${
                view === v ? "bg-primary text-primary-foreground" : "text-navy-foreground/70"
              }`}
            >
              {v === "Rep" ? "My dashboard" : "Admin dashboard"}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today's Sales" value={money(todaySales)} hint="2 orders" />
        <StatCard label="Today's Collections" value={money(50_000)} hint="1 payment" tone="success" />
        <StatCard label="Weekly Sales" value={money(weekSales)} />
        <StatCard label="Monthly Sales" value={money(monthSales)} />
      </div>

      {view === "Rep" ? (
        <>
          <SectionTitle>Monthly target</SectionTitle>
          <div className="surface-card p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="num text-2xl font-bold">{achievement}%</p>
                <p className="text-xs text-muted-foreground">
                  {money(currentUser.achieved)} of {money(currentUser.target)}
                </p>
              </div>
              <Pill tone={achievement >= 100 ? "success" : achievement >= 70 ? "warning" : "danger"}>
                {achievement >= 100 ? "Target met" : "In progress"}
              </Pill>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, achievement)}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Company totals</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Outstanding Receivables" value={money(995_400)} tone="danger" />
            <StatCard label="Payments Collected" value={money(collections)} tone="success" />
            <StatCard label="Inventory Value" value={money(stockValue)} />
            <StatCard label="Gross Profit" value={money(grossProfit)} tone="success" hint="Revenue − COGS − discounts" />
          </div>
        </>
      )}

      <SectionTitle>Sales by day</SectionTitle>
      <div className="surface-card p-3 pr-4">
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={salesByDay} margin={{ top: 6, right: 0, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis
              tickFormatter={(v: number) => `${v / 1000}K`}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              formatter={(v: number) => money(v)}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="sales" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Sales by category</SectionTitle>
      <div className="surface-card flex items-center gap-3 p-3">
        <ResponsiveContainer width="45%" height={150}>
          <PieChart>
            <Pie data={salesByCategory} dataKey="value" nameKey="category" innerRadius={34} outerRadius={60} paddingAngle={2}>
              {salesByCategory.map((_, i) => (
                <Cell key={i} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => money(v)}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex-1 space-y-1.5">
          {salesByCategory.map((c, i) => (
            <li key={c.category} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: chartColors[i % chartColors.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{c.category}</span>
              <span className="num font-semibold">{money(c.value, { compact: true })}</span>
            </li>
          ))}
        </ul>
      </div>

      <SectionTitle>Top products</SectionTitle>
      <ul className="surface-card divide-y divide-border">
        {topProducts.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="num text-xs text-muted-foreground">{p.units} units</p>
            </div>
            <p className="num shrink-0 text-sm font-semibold">{money(p.value)}</p>
          </li>
        ))}
      </ul>

      <SectionTitle>Inventory alerts</SectionTitle>
      <ul className="space-y-2">
        {products
          .filter((p) => stockStatus(p) !== "IN STOCK")
          .map((p) => (
            <li key={p.id} className="surface-card flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Stock {p.stock} · Min {p.minStock}
                </p>
              </div>
              <Pill tone={stockStatus(p) === "LOW STOCK" ? "warning" : "danger"}>{stockStatus(p)}</Pill>
            </li>
          ))}
      </ul>

      <SectionTitle>Orders</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total orders" value={String(orders.length)} />
        <StatCard
          label="Confirmed"
          value={String(orders.filter((o) => o.status === "Confirmed").length)}
          tone="success"
        />
        <StatCard
          label="Pending / Draft"
          value={String(orders.filter((o) => o.status === "Draft" || o.status === "Pending").length)}
          tone="warning"
        />
        <StatCard
          label="Cancelled"
          value={String(orders.filter((o) => o.status === "Cancelled").length)}
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Export as Excel, CSV or PDF — respects your role permissions.
      </p>
    </AppShell>
  );
}
