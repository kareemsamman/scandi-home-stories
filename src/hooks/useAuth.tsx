import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "worker" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoaded: boolean;
  profile: { first_name: string; last_name: string; phone: string; avatar_url: string } | null;
  isAdmin: boolean;
  isWorker: boolean;
  signUp: (data: { email: string; password: string; firstName: string; lastName: string; phone: string }) => Promise<{ error: Error | null }>;
  signIn: (data: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, avatar_url")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data);
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data) setRoles(data.map((r) => r.role));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  }, [user, fetchProfile, fetchRoles]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
          setRolesLoaded(false);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            if (session?.user) {
              fetchProfile(session.user.id);
              fetchRoles(session.user.id).then(() => setRolesLoaded(true));
            }
          }, 0);
        }
        // TOKEN_REFRESHED / INITIAL_SESSION: just update session/user, skip DB queries
        setLoading(false);
      }
    );

    // THEN get initial session — await roles before clearing loading
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchRoles(session.user.id)]);
        setRolesLoaded(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRoles]);

  const signUp = async ({ email, password, firstName, lastName, phone }: {
    email: string; password: string; firstName: string; lastName: string; phone: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, phone } },
    });
    if (!error && data.user) {
      // Ensure phone is saved to profiles (trigger may not include it on older DB versions)
      if (phone) {
        await (supabase as any)
          .from("profiles")
          .update({ phone })
          .eq("user_id", data.user.id);
      }
    }
    return { error: error as Error | null };
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setRolesLoaded(false);
    // Clear persisted user-specific data from localStorage
    localStorage.removeItem("amg-addresses");
    localStorage.removeItem("amg-profile");
    localStorage.removeItem("amg-orders");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        profile,
        isAdmin: roles.includes("admin"),
        isWorker: roles.includes("worker"),
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
