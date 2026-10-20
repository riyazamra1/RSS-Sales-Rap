import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Globe,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  Sheet,
  ShieldCheck,
} from "lucide-react";
import { AppShell, Pill, SectionTitle, StatCard } from "@/components/AppShell";
import { company, currentUser, notifications } from "@/lib/mock-data";
import { money, initials } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";


export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Sales rep profile, targets and commission, sync status, notifications and security settings.",
      },
      { property: "og:title", content: "Account — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Profile, performance, settings and session security for RSS field reps.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { session, profile, isAdmin, signOut } = useAuth();
  const { settings } = useAppSettings();

  const achievement = currentUser.target > 0 ? Math.round((currentUser.achieved / currentUser.target) * 100) : 0;
  const commission = Math.round((currentUser.achieved * currentUser.commissionRate) / 100);

  const displayName = profile?.full_name || currentUser.name;
  const displayRole = isAdmin ? "Administrator" : currentUser.role;

  return (
    <AppShell title="Account" subtitle={displayRole}>
      <div className="surface-card flex items-center gap-3 p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-navy text-lg font-bold text-navy-foreground">
          {initials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {(profile?.employee_id || currentUser.employeeId)} ·{" "}
            {profile?.territory || currentUser.territory}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.email || session?.user?.email || currentUser.email}
          </p>
        </div>
        <Pill
          tone={
            profile && profile.status !== "active" && !isAdmin
              ? "warning"
              : session
                ? "success"
                : "info"
          }
        >
          {!session ? "Guest" : isAdmin ? "Admin" : (profile?.status ?? "pending")}
        </Pill>
      </div>

      <SectionTitle>Performance</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Sales Target" value={money(currentUser.target)} />
        <StatCard label="Current Sales" value={money(currentUser.achieved)} />
        <StatCard
          label="Achievement"
          value={`${achievement}%`}
          tone={achievement >= 100 ? "success" : "warning"}
        />
        <StatCard
          label="Commission"
          value={money(commission)}
          hint={`${currentUser.commissionRate}% of sales`}
          tone="success"
        />
      </div>

      <SectionTitle>Sync status</SectionTitle>
      <div className="surface-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Google Sheets integration</p>
            <p className="truncate text-xs text-muted-foreground">Last sync 06 Aug 2026, 09:41</p>
          </div>
          <Pill tone="success">Connected</Pill>
        </div>
        <div className="num mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Synced</p>
            <p className="font-semibold text-success">124</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pending</p>
            <p className="font-semibold text-warning-foreground">2</p>
          </div>
          <div>
            <p className="text-muted-foreground">Failed</p>
            <p className="font-semibold text-destructive">0</p>
          </div>
        </div>
        <button className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
          <RefreshCw className="h-4 w-4" /> Sync now
        </button>
      </div>

      <SectionTitle>Notifications</SectionTitle>
      <ul className="surface-card divide-y divide-border">
        {notifications.map((n) => (
          <li key={n.id} className="flex items-start gap-3 px-3.5 py-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{n.text}</p>
              <p className="text-[11px] text-muted-foreground">{n.time}</p>
            </div>
          </li>
        ))}
      </ul>

      <SectionTitle>Settings</SectionTitle>
      <ul className="surface-card divide-y divide-border">
        {[
          { icon: Bell, label: "Notification preferences" },
          { icon: Globe, label: "Language — English" },
          { icon: MonitorSmartphone, label: "Theme — System" },
          { icon: KeyRound, label: "Change password" },
          { icon: Sheet, label: "Google Sheets setup" },
          { icon: ShieldCheck, label: "Session management" },
        ].map(({ icon: Icon, label }) => (
          <li key={label}>
            <button className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <Link
        to="/install"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
      >
        <MonitorSmartphone className="h-4 w-4" /> Install app on this phone
      </Link>

      {isAdmin ? (
        <>
          <Link
            to="/admin"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-navy-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Open admin panel
          </Link>
          <Link
            to="/admin/items"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            <Sheet className="h-4 w-4" /> Manage inventory items
          </Link>
          <Link
            to="/admin/settings"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            <Sheet className="h-4 w-4" /> App settings, logo &amp; Google Sheets
          </Link>
        </>

      ) : null}


      {session ? (
        <button
          onClick={async () => {
            await signOut();
            void navigate({ to: "/login", replace: true });
          }}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      ) : (
        <Link
          to="/login"
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign in
        </Link>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
        {settings.company_name || company.name}
        <br />
        {settings.address || company.address}
        <br />
        {(settings.phone || company.phone) + " · " + (settings.email || company.email)}
        {settings.tax_number ? (
          <>
            <br />
            {settings.tax_number}
          </>
        ) : null}
      </p>

    </AppShell>
  );
}
