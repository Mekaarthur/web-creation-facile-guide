import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProtectedProviderRouteProps {
  children: ReactNode;
}

const ProtectedProviderRoute = ({ children }: ProtectedProviderRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [isProvider, setIsProvider] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Vérifier d'abord si l'utilisateur existe dans la table providers
        const { data: providerData, error: providerError } = await supabase
          .from('providers')
          .select('id, is_verified')
          .eq('user_id', user.id)
          .maybeSingle();

        if (providerError) {
          console.error('Error checking provider data:', providerError);
        }

        setIsProvider(!!providerData?.is_verified);
      } catch (error) {
        console.error('Error in checkProviderStatus:', error);
        setIsProvider(false);
      } finally {
        setLoading(false);
      }
    };

    checkProviderStatus();
  }, [user]);

  if (authLoading || loading) {
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
    return <Navigate to="/auth" replace />;
  }

  if (isProvider === false) {
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

  return <>{children}</>;
};

export default ProtectedProviderRoute;
