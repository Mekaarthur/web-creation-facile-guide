import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from './useAuth';
import { canAccessRoute, getHomeRouteForRole } from './role-utils';
import { toast } from 'sonner';

export const useRoleAccess = () => {
  const { user, loading, roles, primaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const currentPath = location.pathname;
    const hasAccess = canAccessRoute(roles, currentPath);

    if (!hasAccess && primaryRole) {
      console.warn(`[useRoleAccess] Access denied to ${currentPath} for role ${primaryRole}`);

      toast.error('Accès refusé', {
        description: `Vous n'avez pas les permissions pour accéder à cette page.`,
      });

      const homeRoute = getHomeRouteForRole(primaryRole);
      navigate(homeRoute, { replace: true });
    }
  }, [user, loading, roles, primaryRole, location.pathname, navigate]);

  return {
    canAccess: (route: string) => canAccessRoute(roles, route),
    homeRoute: getHomeRouteForRole(primaryRole),
  };
};

export const useServerRoleCheck = async (role: UserRole): Promise<boolean> => {
  try {
    const { supabase } = await import('../integrations/supabase/client');

    const { data, error } = await supabase.functions.invoke('verify-user-role', {
      body: { role },
    });

    if (error) {
      console.error('[useServerRoleCheck] Error:', error);
      return false;
    }

    return data?.hasRole === true;
  } catch (error) {
    console.error('[useServerRoleCheck] Unexpected error:', error);
    return false;
  }
};
