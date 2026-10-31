import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ForgotPassword } from "@/components/ForgotPassword";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Secure sign in for RSS Razeen Secure Solutions sales representatives, accountants and administrators.",
      },
      { property: "og:title", content: "Sign in — RSS Sales Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Role-based access for field reps, accountants and admins.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isRecovery } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session && !isRecovery) void navigate({ to: "/", replace: true });
  }, [session, isRecovery, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in");
      await navigate({ to: "/", replace: true });
    } catch (error) {
      console.error("[Auth] Sign-in request failed:", error);
      toast.error(error instanceof Error ? error.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
            RSS
          </span>
          <h1 className="mt-5 text-3xl font-bold">RSS Sales Manager</h1>
          <p className="mt-1.5 text-sm text-navy-foreground/70">
            RSS Razeen Secure Solutions — field order &amp; inventory management.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="imran@razeensecure.lk"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground placeholder:text-navy-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 pr-11 text-sm text-navy-foreground placeholder:text-navy-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-lg text-navy-foreground/60"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} SIGN IN
          </button>
        </form>
        <ForgotPassword />

        <p className="mt-5 text-center text-sm text-navy-foreground/70">
          New sales rep?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/admin/login" className="font-semibold text-navy-foreground/80">
            Admin panel login
          </Link>
        </p>

        <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-navy-foreground/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Role-based access · Admin, Sales Rep, Accountant
        </p>
      </div>
    </div>
  );
}
