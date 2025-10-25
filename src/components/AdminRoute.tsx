import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminRoute = ({ children, redirectTo = '/auth' }: AdminRouteProps) => {
  const { user, loading: authLoading, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || !session) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        // 1) Vérification via edge function (source de vérité)
        const { data, error } = await supabase.functions.invoke('get-user-role', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.warn('[AdminRoute] get-user-role error, fallback user_roles:', error);
          // 2) Fallback direct sur user_roles (RLS contrôlé)
          const { data: adminRow, error: adminError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (adminError && adminError.code !== 'PGRST116') {
            console.error('[AdminRoute] user_roles fallback error:', adminError);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!adminRow);
          }
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (err) {
        console.error('[AdminRoute] Unexpected error:', err);
        // Dernier fallback défensif
        try {
          const { data: adminRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();
          setIsAdmin(!!adminRow);
        } catch (_) {
          setIsAdmin(false);
        }
      } finally {
        setChecking(false);
      }
    };

    checkAdminRole();
  }, [user, session]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Vérification des autorisations...</span>
        </div>
      </div>
    );
  }

  if (!user || isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 p-8 border border-destructive/20 rounded-lg bg-destructive/5">
          <Shield className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Accès Refusé</h2>
            <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
          <Navigate to={redirectTo} replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
