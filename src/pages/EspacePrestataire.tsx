import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedProviderDashboard from '@/components/EnhancedProviderDashboard';

import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

const EspacePrestataire = () => {
  const { t } = useTranslation();
  const { user, loading, hasRole, primaryRole } = useAuth();
  const navigate = useNavigate();

  // Rediriger les non-prestataires vers leur espace approprié
  useEffect(() => {
    if (!loading && user && primaryRole) {
      if (!hasRole('provider')) {
        if (primaryRole === 'admin' || primaryRole === 'moderator') {
          navigate('/modern-admin', { replace: true });
        } else if (primaryRole === 'client' || primaryRole === 'user') {
          navigate('/espace-personnel', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      }
    }
  }, [user, loading, primaryRole, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('providerSpace.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('providerSpace.accessRestricted')}</CardTitle>
            <CardDescription>
              {t('providerSpace.mustBeProvider')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">
                {t('personalSpace.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnhancedProviderDashboard />
    </div>
  );
};

export default EspacePrestataire;