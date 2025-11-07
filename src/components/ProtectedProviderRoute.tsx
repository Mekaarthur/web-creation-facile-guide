import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProtectedProviderRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Route protégée pour les prestataires uniquement
 * Redirige les non-authentifiés vers /auth/provider
 * Redirige les autres rôles vers leur espace approprié
 */
const ProtectedProviderRoute = ({ children, redirectTo = '/auth/provider' }: ProtectedProviderRouteProps) => {
  const { user, loading, hasRole, primaryRole } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('providerSpace.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Vérifier si l'utilisateur a le rôle provider
  if (!hasRole('provider')) {
    // Rediriger selon le rôle principal
    if (primaryRole === 'admin' || primaryRole === 'moderator') {
      return <Navigate to="/modern-admin" replace />;
    }
    if (primaryRole === 'client' || primaryRole === 'user') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-center">{t('providerSpace.accessRestricted')}</CardTitle>
              <CardDescription className="text-center">
                {t('providerSpace.mustBeProvider')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  {t('providerSpace.notProvider')}
                </p>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  {t('providerSpace.contactAdmin')}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/nous-recrutons" className="w-full">
                  <Button className="w-full" variant="default">
                    Devenir prestataire
                  </Button>
                </Link>
                <Link to="/espace-personnel" className="w-full">
                  <Button className="w-full" variant="outline">
                    Retour à l'espace client
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedProviderRoute;