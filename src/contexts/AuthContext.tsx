import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "owner" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  viewMode: AppRole | null;
  setViewMode: (mode: AppRole) => void;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, viewAs?: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [viewMode, setViewMode] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    const roles = (data ?? []).map((r) => r.role as AppRole);
    if (roles.includes("owner")) return "owner";
    if (roles.includes("user")) return "user";
    return null;
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    let mounted = true;

    const hydrateFromSession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setRole(null);
      setProfile(null);

      if (!nextSession?.user) {
        setLoading(false);
        return;
      }

      const userId = nextSession.user.id;
      const [userRole, userProfile] = await Promise.all([
        fetchUserRole(userId),
        fetchProfile(userId),
      ]);

      if (!mounted) return;
      setRole(userRole);
      setProfile(userProfile);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Defer backend calls to avoid potential auth callback deadlocks
      setTimeout(() => {
        void hydrateFromSession(nextSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void hydrateFromSession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string, viewAs?: AppRole) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && viewAs) {
      setViewMode(viewAs);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setViewMode(null);
    setProfile(null);
  };

  const updateProfile = async (data: { full_name?: string; phone?: string; avatar_url?: string }) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...data } : null);
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        viewMode,
        setViewMode,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
