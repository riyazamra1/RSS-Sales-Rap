import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PasswordRecoveryPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
      });
      if (requestError) throw requestError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const loginPath = isAdmin ? "/admin/login" : "/login";

  return (
    <main className="flex min-h-screen flex-col justify-center bg-navy px-6 py-12 text-navy-foreground">
      <section className="mx-auto w-full max-w-md">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-primary">
          {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <Mail className="h-7 w-7" />}
        </span>
        <h1 className="mt-5 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-navy-foreground/70">
          {isAdmin ? "Administrator account recovery" : "RSS Sales Manager account recovery"}
        </p>

        {sent ? (
          <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4">
            <p role="status" className="text-sm leading-6">
              If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="recovery-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60">
                Account email
              </label>
              <input
                id="recovery-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Reset Link
            </button>
          </form>
        )}

        <Link to={loginPath} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-foreground/80 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to {isAdmin ? "Admin Login" : "Sign In"}
        </Link>
      </section>
    </main>
  );
}
