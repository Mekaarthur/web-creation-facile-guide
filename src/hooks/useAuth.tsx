import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'client' | 'provider' | 'admin' | 'moderator' | 'user';

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
      // Récupérer tous les rôles de l'utilisateur
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

      // Déterminer le rôle principal (priorité: admin > provider > client > moderator > user)
      const rolePriority: Record<UserRole, number> = {
        admin: 1,
        provider: 2,
        client: 3,
        moderator: 4,
        user: 5,
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

    // 1) Installer le listener EN PREMIER (recommandation Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch roles when user logs in
      if (session?.user && event === 'SIGNED_IN') {
        setTimeout(() => {
          fetchUserRoles(session.user.id);
        }, 0);
      }

      // Clear roles on sign out
      if (event === 'SIGNED_OUT') {
        setRoles([]);
        setPrimaryRole(null);
      }
    });

    // 2) Puis récupérer la session existante
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
        }
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch roles for existing session
        if (session?.user) {
          fetchUserRoles(session.user.id);
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
      // Clear all user data
      setUser(null);
      setSession(null);
      setRoles([]);
      setPrimaryRole(null);
      
      // Clear any cached data from localStorage
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