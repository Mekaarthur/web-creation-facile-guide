import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { canAccessRoute, getHomeRouteForRole } from '@/lib/role-utils';
import { toast } from 'sonner';

/**
 * Hook pour surveiller et bloquer les accès non autorisés
 * Redirige automatiquement vers l'espace approprié si l'utilisateur
 * tente d'accéder à une page non autorisée
 */
export const useRoleAccess = () => {
  const { user, loading, roles, primaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading) return;

    // Si l'utilisateur n'est pas connecté, laisser le système de routes gérer
    if (!user) return;

    // Vérifier l'accès à la route actuelle
    const currentPath = location.pathname;
    const hasAccess = canAccessRoute(roles, currentPath);

    if (!hasAccess && primaryRole) {
      console.warn(`[useRoleAccess] Access denied to ${currentPath} for role ${primaryRole}`);
      
      // Afficher un message d'erreur
      toast.error('Accès refusé', {
        description: `Vous n'avez pas les permissions pour accéder à cette page.`,
      });

      // Rediriger vers l'espace approprié
      const homeRoute = getHomeRouteForRole(primaryRole);
      navigate(homeRoute, { replace: true });
    }
  }, [user, loading, roles, primaryRole, location.pathname, navigate]);

  return {
    canAccess: (route: string) => canAccessRoute(roles, route),
    homeRoute: getHomeRouteForRole(primaryRole),
  };
};

/**
 * Hook pour vérifier un rôle spécifique côté serveur
 * Utilise l'edge function pour une vérification sécurisée
 */
export const useServerRoleCheck = async (role: UserRole): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
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