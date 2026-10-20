import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create sales rep account — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Register a new RSS Razeen Secure Solutions sales representative account. Admin approval is required before field access is granted.",
      },
      { property: "og:title", content: "Create sales rep account — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Sales rep registration with admin approval for RSS Sales Manager.",
      },
    ],
  }),
  component: SignupPage,
});

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-navy-foreground placeholder:text-navy-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-foreground/60";

function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    phone: "",
    territory: "",
    email: "",
    password: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (form.fullName.trim().length < 3) {
      toast.error("Enter your full name");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: form.fullName.trim().slice(0, 100),
          employee_id: form.employeeId.trim().slice(0, 30),
          phone: form.phone.trim().slice(0, 30),
          territory: form.territory.trim().slice(0, 80),
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-6 text-navy-foreground">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/20 text-success">
            <UserPlus className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Account requested</h1>
          <p className="mt-2 text-sm text-navy-foreground/70">
            Confirm your email address, then wait for an administrator to approve your sales rep
            account. You will be able to sign in once approved.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-navy-foreground">
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <button
          onClick={() => void navigate({ to: "/login" })}
          className="text-xs font-semibold uppercase tracking-wide text-navy-foreground/60"
        >
          ← Sign in
        </button>
        <h1 className="mt-4 text-3xl font-bold">Create sales rep account</h1>
        <p className="mt-1.5 text-sm text-navy-foreground/70">
          New accounts start as pending and need admin approval.
        </p>

        <form className="mt-7 space-y-3" onSubmit={onSubmit}>
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full name
            </label>
            <input
              id="fullName"
              required
              maxLength={100}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Imran Razeen"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employeeId" className={labelClass}>
                Employee ID
              </label>
              <input
                id="employeeId"
                maxLength={30}
                value={form.employeeId}
                onChange={(e) => set("employeeId", e.target.value)}
                placeholder="REP-014"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Mobile
              </label>
              <input
                id="phone"
                maxLength={30}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+94 77 412 8890"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="territory" className={labelClass}>
              Territory
            </label>
            <input
              id="territory"
              maxLength={80}
              value={form.territory}
              onChange={(e) => set("territory", e.target.value)}
              placeholder="Colombo North / Wattala"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              maxLength={255}
              autoComplete="username"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@razeensecure.lk"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} CREATE ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}
