import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

export type UserRole = 'client' | 'provider' | 'admin' | 'moderator' | 'user' | 'super_admin' | 'agent_operationnel' | 'comptable_partenaire' | 'support_client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  primaryRole: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  primaryRole: null,
  hasRole: () => false,
  signOut: async () => {},
  refreshRoles: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<UserRole | null>(null);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }

      const userRoles = rolesData?.map(r => r.role as UserRole) || [];
      setRoles(userRoles);

      const rolePriority: Record<UserRole, number> = {
        super_admin: 0,
        admin: 1,
        agent_operationnel: 2,
        comptable_partenaire: 3,
        support_client: 4,
        provider: 5,
        client: 6,
        moderator: 7,
        user: 8,
      };

      const sortedRoles = [...userRoles].sort((a, b) =>
        (rolePriority[a] || 999) - (rolePriority[b] || 999)
      );

      setPrimaryRole(sortedRoles[0] || null);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    }
  };

  const refreshRoles = async () => {
    if (user) {
      await fetchUserRoles(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && event === 'SIGNED_IN') {
        fetchUserRoles(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        setRoles([]);
        setPrimaryRole(null);
      }
    });

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
        }
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRoles(session.user.id);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      setUser(null);
      setSession(null);
      setRoles([]);
      setPrimaryRole(null);
      localStorage.removeItem('supabase.auth.token');
    }
  };

  const value = {
    user,
    session,
    loading,
    roles,
    primaryRole,
    hasRole,
    signOut,
    refreshRoles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
