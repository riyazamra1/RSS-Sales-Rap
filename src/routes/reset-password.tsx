import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — RSS Sales Manager" },
      { name: "description", content: "Set a new password for your RSS Sales Manager account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setReady(!error && !!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setReady(true);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
    toast.success("Password updated. You can now sign in.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold">Reset password</h1>
        <p className="mt-1.5 text-sm text-navy-foreground/70">
          Choose a new password for your RSS Sales Manager account.
        </p>
        {done ? (
          <div className="mt-7 space-y-4">
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">Your password has been updated successfully.</p>
            <Link to="/login" className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">Back to sign in</Link>
            <Link to="/admin/login" className="block text-center text-sm font-semibold text-navy-foreground/80">Admin login</Link>
          </div>
        ) : !ready ? (
          <div className="mt-7 space-y-4">
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-navy-foreground/75">
              Open the latest password-reset link from your email on this device. If it has expired, request a new link from the login page.
            </p>
            <Link to="/login" className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">Back to sign in</Link>
          </div>
        ) : (
          <form className="mt-7 space-y-3" onSubmit={onSubmit}>
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60">New password</label>
              <input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="At least 8 characters" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60">Confirm new password</label>
              <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Re-enter new password" />
            </div>
            <button type="submit" disabled={busy} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} UPDATE PASSWORD
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
