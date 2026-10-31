import { useRef, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ForgotPassword({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const emailInput = useRef<HTMLInputElement>(null);

  async function sendResetLink() {
    if (busy || sent) return;
    if (!emailInput.current?.reportValidity()) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your account email address.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const redirectTo = new URL(`${import.meta.env.BASE_URL}reset-password`, window.location.origin).toString();
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (requestError) throw requestError;
      setSent(true);
    } catch (err) {
      console.error("[PasswordRecovery] Reset request failed:", err);
      setError(err instanceof Error ? err.message : "Could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return <div className="mt-5 text-sm"><button type="button" onClick={() => { setEmail(""); setError(""); setSent(false); setOpen(true); }} className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">Forgot password?</button></div>;
  }

  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4" aria-label="Password recovery">
      <h2 className="text-base font-semibold">Reset your password</h2>
      <p className="mt-1 text-sm text-navy-foreground/70">{isAdmin ? "Enter your administrator account email." : "Enter your account email to receive a reset link."}</p>
      {sent ? (
        <p role="status" aria-live="polite" className="mt-4 text-sm leading-6">If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label htmlFor={isAdmin ? "admin-recovery-email" : "recovery-email"} className="block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60">Account email</label>
          <input ref={emailInput} id={isAdmin ? "admin-recovery-email" : "recovery-email"} type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void sendResetLink(); } }} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground placeholder:text-navy-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary" />
          {error && <p role="alert" aria-live="assertive" className="text-sm text-red-300">{error}</p>}
          <button type="button" onClick={() => void sendResetLink()} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{busy ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      )}
      <button type="button" onClick={() => setOpen(false)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-foreground/80 hover:text-primary"><ArrowLeft className="h-4 w-4" />Back to {isAdmin ? "Admin Login" : "Sign In"}</button>
    </section>
  );
}