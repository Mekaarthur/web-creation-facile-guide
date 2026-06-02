import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Route protégée pour les clients uniquement
 * Redirige les non-authentifiés vers /auth
 * Redirige les autres rôles vers leur espace approprié
 */
const ProtectedRoute = ({ children, redirectTo = '/auth' }: ProtectedRouteProps) => {
  const { user, loading, hasRole, primaryRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification des accès...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si l'utilisateur n'est pas client, rediriger vers son espace
  if (!hasRole('client') && !hasRole('user')) {
    if (primaryRole === 'admin' || primaryRole === 'moderator') {
      return <Navigate to="/modern-admin" replace />;
    }
    if (primaryRole === 'provider') {
      return <Navigate to="/espace-prestataire" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;