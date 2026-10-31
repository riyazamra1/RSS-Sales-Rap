import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
const SESSION_INIT_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isRecovery, setIsRecovery] = useState(false);
  const profileRequest = useRef(0);

  async function loadUserData(userId: string | undefined) {
    const requestId = ++profileRequest.current;
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, employee_id, phone, territory, email, status")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      // Ignore a slow response belonging to a user who has since signed out
      // or switched accounts.
      if (requestId !== profileRequest.current) return;

      if (profileRes.error) console.error("[Auth] Profile lookup failed:", profileRes.error);
      if (rolesRes.error) console.error("[Auth] Role lookup failed:", rolesRes.error);

      setProfile((profileRes.data as Profile | null) ?? null);
      setRoles(
        rolesRes.error
          ? []
          : ((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role),
      );
    } catch (error) {
      if (requestId !== profileRequest.current) return;
      console.error("[Auth] Could not load user profile and roles:", error);
      setProfile(null);
      setRoles([]);
    }
  }

  useEffect(() => {
    let active = true;
    if (isRecoveryHash(window.location.hash)) setIsRecovery(true);

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      if (event === "SIGNED_OUT") setIsRecovery(false);

      setSession(nextSession);
      // Authentication UI must not wait for profile/role database queries.
      setLoading(false);
      void loadUserData(nextSession?.user?.id);
    });

    void (async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_INIT_TIMEOUT_MS,
          "Supabase session initialization",
        );
        if (!active) return;

        setSession(data.session);
        // Release the app immediately after session restoration. Profile and
        // role lookups continue independently and cannot hold the app splash.
        setLoading(false);
        void loadUserData(data.session?.user?.id);
      } catch (error) {
        if (!active) return;
        console.error("[Auth] Session initialization failed:", error);
        // Fail open to the sign-in experience instead of leaving the app
        // permanently covered by its loading screen. Auth events can still
        // restore a valid session later.
        setSession(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      profileRequest.current += 1;
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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        profileRequest.current += 1;
        setSession(null);
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
