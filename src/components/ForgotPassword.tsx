import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ForgotPassword({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
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

  return (
    <section className="mt-5 w-full">
      <a
        href="#forgot-password-form"
        className="inline-flex min-h-10 items-center font-semibold text-primary underline decoration-1 underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Forgot password?
      </a>
      <div id="forgot-password-form" className="mt-4 scroll-mt-6 border-t border-navy-foreground/20 pt-5">
        <h2 className="text-lg font-semibold">Reset your password</h2>
        {sent ? (
          <p role="status" className="mt-3 text-sm text-navy-foreground/80">
            If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <label htmlFor="recovery-email" className="block text-sm">Account email</label>
            <input
              id="recovery-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-md border border-navy-foreground/20 bg-navy-foreground/10 px-3 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p role="alert" className="text-sm text-navy-foreground">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send reset link
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
