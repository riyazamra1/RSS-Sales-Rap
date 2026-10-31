import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Boxes, ChartNoAxesCombined, ChevronRight, LayoutDashboard, ReceiptText, Settings2, ShieldCheck, Users, UserRound } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useAppSettings } from "@/hooks/useAppSettings";

const navigation = [
  { to: "/", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/account", label: "Account & settings", icon: UserRound },
] as const;

export function AppShell({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  const { settings, logo } = useAppSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="rss-app min-h-screen bg-background text-foreground">
      <aside className="rss-sidebar">
        <Link to="/" className="rss-brand">
          <img src={logo} alt={`${settings.company_name} logo`} className="rss-brand-logo" />
          <span className="min-w-0"><span className="block truncate text-sm font-extrabold tracking-tight">{settings.app_name}</span><span className="mt-0.5 block truncate text-[10px] text-sidebar-foreground/60">{settings.company_name}</span></span>
        </Link>
        <div className="rss-sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="rss-sidebar-nav">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return <Link key={to} to={to} className={`rss-sidebar-link ${active ? "is-active" : ""}`}><Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.8} /><span>{label}</span>{active ? <span className="rss-nav-indicator" /> : null}</Link>;
          })}
        </nav>
        <div className="rss-sidebar-bottom"><div className="rss-secure-note"><ShieldCheck className="h-4 w-4" /><span>Secure workspace</span></div><div className="rss-sidebar-company">{settings.company_name}</div><div className="rss-sidebar-version">RSS SALES MANAGER</div></div>
      </aside>
      <div className="rss-main-column">
        <header className="rss-topbar">
          <div className="min-w-0"><div className="rss-breadcrumb"><LayoutDashboard className="h-3.5 w-3.5" /> Workspace <ChevronRight className="h-3 w-3" /> {title}</div><h1 className="rss-page-title">{title}</h1>{subtitle ? <p className="rss-page-subtitle">{subtitle}</p> : null}</div>
          <div className="flex shrink-0 items-center gap-2">{action ? <div className="rss-header-action">{action}</div> : null}<Link to="/account" aria-label="Account and notifications" className="rss-topbar-icon"><Bell className="h-[18px] w-[18px]" /></Link><Link to="/account" aria-label="Settings" className="rss-topbar-icon rss-settings-shortcut"><Settings2 className="h-[18px] w-[18px]" /></Link></div>
        </header>
        <main className="rss-page-content">{children}</main>
        <footer className="rss-footer"><span>© {new Date().getFullYear()} {settings.company_name}</span><span>RSS Sales Manager</span></footer>
      </div>
      <BottomNav />
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="mb-3 mt-7 flex items-center justify-between gap-3 first:mt-0"><h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{children}</h2>{right}</div>;
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-destructive" : "text-foreground";
  return <div className="rss-stat-card"><p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className={`num mt-2 text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>{hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}</div>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const map = { neutral: "bg-secondary text-secondary-foreground", success: "bg-success/15 text-success-foreground", warning: "bg-warning/20 text-warning-foreground", danger: "bg-destructive/12 text-destructive", info: "bg-accent text-accent-foreground" } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${map[tone]}`}>{children}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return <div className="rss-empty-state"><span className="rss-empty-icon"><Boxes className="h-6 w-6" /></span><p className="font-bold">{title}</p>{hint ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p> : null}</div>;
}
