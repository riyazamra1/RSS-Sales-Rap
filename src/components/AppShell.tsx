import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Wifi } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useAppSettings } from "@/hooks/useAppSettings";


export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { settings, logo } = useAppSettings();
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-navy text-navy-foreground">
        <div className="mx-auto max-w-2xl px-4 pb-5 pt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={logo}
                alt={`${settings.company_name} logo`}
                className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-0.5"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
                  {settings.company_name}
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold">{title}</h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-sm text-navy-foreground/70">{subtitle}</p>
                ) : null}
              </div>
            </div>


            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium">
                <Wifi className="h-3.5 w-3.5 text-success" />
                Online
              </span>
              <Link
                to="/account"
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" />
              </Link>
            </div>
          </div>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between gap-3 first:mt-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="surface-card p-3.5">
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`num mt-1.5 text-lg font-bold ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const map = {
    neutral: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-accent text-accent-foreground",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="surface-card px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
