import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Route protégée pour les administrateurs uniquement
 * Redirige les non-admins vers leur espace approprié
 * Sécurité maximale avec vérification des rôles via RLS
 */
const AdminRoute = ({ children, redirectTo = '/admin/login' }: AdminRouteProps) => {
  const { user, loading, hasRole, primaryRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Vérification des autorisations...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Vérifier si l'utilisateur est admin ou moderator
  const isAuthorized = hasRole('admin') || hasRole('moderator');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-center text-destructive">
              Accès Refusé
            </CardTitle>
            <CardDescription className="text-center">
              Vous n'avez pas les permissions nécessaires pour accéder à l'espace administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                Cette section est réservée aux administrateurs de la plateforme Bikawo.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {primaryRole === 'provider' && (
                <Link to="/espace-prestataire" className="w-full">
                  <Button className="w-full" variant="default">
                    Accéder à mon espace prestataire
                  </Button>
                </Link>
              )}
              {(primaryRole === 'client' || primaryRole === 'user') && (
                <Link to="/espace-personnel" className="w-full">
                  <Button className="w-full" variant="default">
                    Accéder à mon espace personnel
                  </Button>
                </Link>
              )}
              <Link to="/" className="w-full">
                <Button className="w-full" variant="outline">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Si vous pensez qu'il s'agit d'une erreur, contactez le support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;