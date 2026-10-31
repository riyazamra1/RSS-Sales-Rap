import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isRecoveryHash } from "@/lib/password-recovery";

export type AppRole = "admin" | "sales_rep" | "accountant";

export type Profile = {
  id: string;
  full_name: string;
  employee_id: string | null;
  phone: string | null;
  territory: string | null;
  email: string | null;
  status: string;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isApproved: boolean;
  isRecovery: boolean;
  finishRecovery: () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isRecovery, setIsRecovery] = useState(false);

  async function loadUserData(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, employee_id, phone, territory, email, status")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role));
  }

  useEffect(() => {
    let active = true;
    if (isRecoveryHash(window.location.hash)) setIsRecovery(true);

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      if (event === "SIGNED_OUT") setIsRecovery(false);
      setSession(nextSession);
      // Avoid awaiting supabase calls inside the callback.
      setTimeout(() => {
        void loadUserData(nextSession?.user?.id);
      }, 0);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadUserData(data.session?.user?.id);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => {
    const isAdmin = roles.includes("admin");
    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      isAdmin,
      isApproved: isAdmin || profile?.status === "active",
      isRecovery,
      finishRecovery: () => setIsRecovery(false),
      refresh: async () => {
        await loadUserData(session?.user?.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRoles([]);
      },
    };
  }, [loading, session, profile, roles, isRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
