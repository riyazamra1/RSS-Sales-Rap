import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — RSS Sales Manager" },
    { name: "description", content: "Securely reset your RSS Sales Manager password." },
    { property: "og:title", content: "Reset password — RSS Sales Manager" },
    { property: "og:description", content: "Password recovery for RSS Razeen Secure Solutions staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const recovery = params.get("type") === "recovery" && !params.has("error") && !params.has("error_code");
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) setReady(true);
      if (active && event === "SIGNED_OUT") setReady(false);
    });
    if (recovery) void supabase.auth.getUser().then(({ data, error }) => {
      if (active && !error && data.user) setReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !ready) return;
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) throw new Error("Your reset link has expired. Request a new link.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true); setPassword(""); setConfirm("");
      await supabase.auth.signOut();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update your password. Try again."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen flex-col bg-navy text-navy-foreground">
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <span className="grid h-14 w-14 place-items-center rounded-md bg-primary text-primary-foreground"><KeyRound /></span>
      <h1 className="mt-5 text-3xl font-bold">Reset password</h1>
      <p className="mt-2 text-sm text-navy-foreground/70">RSS Sales Manager</p>
      {done ? <p role="status" className="mt-6">Your password has been updated. You can now sign in.</p> : !ready ? <p role="alert" className="mt-6 text-sm">Open your latest password reset email link on this device. If it is missing or expired, request a new link from the sign-in page.</p> : <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="new-password" className="mb-2 block text-sm">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-md border border-navy-foreground/20 bg-navy-foreground/10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label htmlFor="confirm-password" className="mb-2 block text-sm">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 w-full rounded-md border border-navy-foreground/20 bg-navy-foreground/10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        {error && <p role="alert" className="text-sm">{error}</p>}
        <Button type="submit" disabled={busy} className="h-12 w-full">{busy && <Loader2 className="animate-spin" />}Save new password</Button>
      </form>}
      <Button asChild className="mt-6 w-full"><Link to="/admin/login">Admin sign in</Link></Button>
      <Button asChild variant="link" className="mt-2 w-full"><Link to="/login">Sales rep sign in</Link></Button>
    </div>
  </main>;
}
