import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PasswordRecoveryPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const emailInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendResetLink() {
    if (busy || sent) return;
    const input = emailInput.current;
    if (!input?.reportValidity()) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your account email address.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: new URL(`${import.meta.env.BASE_URL}reset-password`, window.location.origin).toString(),
      });
      if (requestError) throw requestError;
      setSent(true);
    } catch (err) {
      console.error("[PasswordRecovery] Reset request failed:", err);
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
            <p role="status" aria-live="polite" className="text-sm leading-6">
              If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="recovery-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60">
                Account email
              </label>
              <input
                ref={emailInput}
                id="recovery-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sendResetLink();
                  }
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p role="alert" aria-live="assertive" className="text-sm text-red-300">{error}</p>}
            <button
              type="button"
              onClick={() => void sendResetLink()}
              disabled={busy || !email.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        )}

        <Link to={loginPath} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-foreground/80 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to {isAdmin ? "Admin Login" : "Sign In"}
        </Link>
      </section>
    </main>
  );
}
