import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Composant de protection des routes basé sur les rôles
 * Redirige automatiquement vers l'espace approprié selon le rôle de l'utilisateur
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}: RoleBasedRouteProps) => {
  const { user, loading, primaryRole, hasRole, roles } = useAuth();
  const navigate = useNavigate();

  // Fonction pour obtenir l'URL de redirection selon le rôle
  const getRedirectUrl = (role: UserRole | null): string => {
    switch (role) {
      case 'admin':
        return '/modern-admin';
      case 'provider':
        return '/espace-prestataire';
      case 'client':
        return '/espace-personnel';
      default:
        return '/auth';
    }
  };

  useEffect(() => {
    // Si l'utilisateur est connecté mais n'a pas les droits requis
    if (!loading && user && primaryRole && !allowedRoles.some(role => hasRole(role))) {
      // Rediriger vers l'espace approprié selon son rôle principal
      const targetUrl = getRedirectUrl(primaryRole);
      console.log(`[RoleBasedRoute] Redirecting ${primaryRole} user to ${targetUrl}`);
      navigate(targetUrl, { replace: true });
    }
  }, [user, loading, primaryRole, allowedRoles, hasRole, navigate]);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification des accès...</span>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté
  if (!user) {
    return <Navigate to={redirectTo || '/auth'} replace />;
  }

  // Utilisateur sans rôles (situation anormale)
  if (roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Configuration de compte incomplète
            </CardTitle>
            <CardDescription>
              Votre compte n'a pas de rôle assigné. Veuillez contacter le support.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate('/auth')} variant="outline">
              Retour à la connexion
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Support: contact@bikawo.com | 06 09 08 53 90
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier les permissions
  const hasAccess = allowedRoles.some(role => hasRole(role));

  if (!hasAccess) {
    // L'utilisateur n'a pas les droits - redirection en cours via useEffect
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirection...</span>
        </div>
      </div>
    );
  }

  // Accès autorisé
  return <>{children}</>;
};

export default RoleBasedRoute;