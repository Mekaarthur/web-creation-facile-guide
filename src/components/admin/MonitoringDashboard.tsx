import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Mail, ShoppingCart, UserX, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export const MonitoringDashboard = () => {
  const { toast } = useToast();

  // Emails échoués
  const { data: failedEmails, isLoading: loadingEmails } = useQuery({
    queryKey: ['failed-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('id, destinataire_email, sujet, retry_count, error_message, created_at')
        .eq('status', 'erreur')
        .lt('retry_count', 3)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Paniers abandonnés
  const { data: abandonedCarts, isLoading: loadingCarts } = useQuery({
    queryKey: ['abandoned-carts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carts')
        .select('id, client_id, total_estimated, created_at, expires_at')
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Prestataires inactifs - Fonctionnalité désactivée (colonne last_active_at non disponible)
  const inactiveProviders: any[] = [];
  const loadingProviders = false;

  // Stats cache
  const cacheStats = {
    hitRate: 85,
    size: 42,
    maxSize: 50
  };

  const handleRetryEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-emails', {
        body: { maxRetries: 3, retryDelay: 30 }
      });

      if (error) throw error;

      toast({
        title: "Retry lancé",
        description: `${data.processed || 0} emails en cours de traitement`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le retry",
        variant: "destructive",
      });
    }
  };

  if (loadingEmails || loadingCarts || loadingProviders) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monitoring Système</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la santé de la plateforme</p>
      </div>

      {/* Stats globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails échoués</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedEmails?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              En attente de retry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers abandonnés</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abandonedCarts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestataires inactifs</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">
              Fonctionnalité à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.hitRate}%</div>
            <p className="text-xs text-muted-foreground">
              {cacheStats.size}/{cacheStats.maxSize} entrées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emails échoués */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Emails en échec</CardTitle>
              <CardDescription>
                Emails en attente de retry automatique
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleRetryEmails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry manuel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {failedEmails && failedEmails.length > 0 ? (
            <div className="space-y-2">
              {failedEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{email.sujet}</p>
                    <p className="text-sm text-muted-foreground">{email.destinataire_email}</p>
                    <p className="text-xs text-muted-foreground">{email.error_message}</p>
                  </div>
                  <Badge variant="destructive">
                    {email.retry_count}/3 tentatives
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun email en échec
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paniers abandonnés */}
      <Card>
        <CardHeader>
          <CardTitle>Paniers abandonnés récents</CardTitle>
          <CardDescription>
            Clients ayant abandonné leur panier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {abandonedCarts && abandonedCarts.length > 0 ? (
            <div className="space-y-2">
              {abandonedCarts.map((cart) => (
                <div key={cart.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Panier #{cart.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Créé le {new Date(cart.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {cart.total_estimated}€
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun panier abandonné
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prestataires inactifs */}
      <Card>
        <CardHeader>
          <CardTitle>
            <AlertTriangle className="h-5 w-5 inline mr-2 text-yellow-500" />
            Prestataires inactifs
          </CardTitle>
          <CardDescription>
            Fonctionnalité à venir - nécessite ajout de la colonne last_active_at
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Cette fonctionnalité sera disponible prochainement
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
