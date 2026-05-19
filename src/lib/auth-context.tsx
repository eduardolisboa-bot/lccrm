import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserTipo = "master" | "interno" | "parceiro";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  tipo_usuario: UserTipo;
  parceiro_id: string | null;
  status: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_user_id", uid)
      .maybeSingle();
    const nextProfile = (data as UserProfile) ?? null;
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    let alive = true;
    let profileTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (alive) setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!alive) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setLoading(true);
        if (profileTimer) clearTimeout(profileTimer);
        profileTimer = setTimeout(() => {
          loadProfile(sess.user.id).catch(() => setProfile(null)).finally(finish);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id).catch(() => setProfile(null)).finally(finish);
      else setLoading(false);
    });
    return () => {
      alive = false;
      if (profileTimer) clearTimeout(profileTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user,
    session,
    profile,
    loading,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) await loadProfile(data.user.id);
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (user) await loadProfile(user.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
