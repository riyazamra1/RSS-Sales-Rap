import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ForgotPassword } from "@/components/ForgotPassword";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin login — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Administrator sign in for the RSS Sales Manager control panel: approve sales reps, manage roles and review collections.",
      },
      { property: "og:title", content: "Admin login — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Restricted administrator access to the RSS Sales Manager control panel.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message ?? "Sign in failed");
      return;
    }
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    setBusy(false);
    if (roleError || !isAdmin) {
      await supabase.auth.signOut();
      toast.error("This account does not have administrator access.");
      return;
    }
    toast.success("Welcome back, administrator");
    void navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold">Admin panel</h1>
        <p className="mt-1.5 text-sm text-navy-foreground/70">
          Restricted access — administrators only.
        </p>

        <form className="mt-7 space-y-3" onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60"
            >
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} ENTER ADMIN PANEL
          </button>
        </form>
        <ForgotPassword initialEmail={email} />

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-navy-foreground/80">
            Sales rep sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
