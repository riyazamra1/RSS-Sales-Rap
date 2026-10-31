import { useState } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function ForgotPassword({ initialEmail = "" }: { initialEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) throw requestError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <Button variant="link" className="mt-2 px-0" onClick={() => { setEmail(initialEmail); setOpen(true); }}>Forgot password?</Button>;

  return (
    <section className="mt-5 border-t border-navy-foreground/20 pt-5">
      <h2 className="text-lg font-semibold">Reset your password</h2>
      {sent ? (
        <p role="status" className="mt-3 text-sm text-navy-foreground/80">If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <label htmlFor="recovery-email" className="block text-sm">Account email</label>
          <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-md border border-navy-foreground/20 bg-navy-foreground/10 px-3 text-sm text-navy-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          {error && <p role="alert" className="text-sm text-navy-foreground">{error}</p>}
          <Button type="submit" disabled={busy} className="h-12 w-full">{busy ? <Loader2 className="animate-spin" /> : <Mail />} Send reset link</Button>
        </form>
      )}
      <Button variant="ghost" className="mt-3 text-navy-foreground" disabled={busy} onClick={() => { setOpen(false); setSent(false); setError(""); }}><ArrowLeft /> Back to sign in</Button>
    </section>
  );
}