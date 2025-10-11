import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Mail, ShoppingCart, Activity, RefreshCw, TrendingUp, CheckCircle, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useSystemAlerts, useDashboardStats, resolveAlert, useFailedEmails, useAbandonedCarts } from "@/hooks/useSystemMonitoring";
import { EmptyState } from "@/components/ui/empty-state";

export const MonitoringDashboard = () => {
  const { toast } = useToast();

  // Hooks de monitoring avec refresh automatique
  const { data: systemAlerts, isLoading: loadingAlerts, refetch: refetchAlerts } = useSystemAlerts();
  const { data: dashboardStats, isLoading: loadingStats, refetch: refetchStats } = useDashboardStats();
  const { data: failedEmails, isLoading: loadingEmails, refetch: refetchEmails } = useFailedEmails();
  const { data: abandonedCarts, isLoading: loadingCarts, refetch: refetchCarts } = useAbandonedCarts();

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAlerts();
      refetchStats();
      refetchEmails();
      refetchCarts();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchAlerts, refetchStats, refetchEmails, refetchCarts]);

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
      
      // Rafraîchir les données
      refetchEmails();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le retry",
        variant: "destructive",
      });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue",
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte",
        variant: "destructive",
      });
    }
  };

  if (loadingEmails || loadingCarts || loadingAlerts || loadingStats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monitoring Système</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la santé de la plateforme</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            refetchAlerts();
            refetchStats();
            refetchEmails();
            refetchCarts();
            toast({ title: "Données actualisées" });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats globales - Vraies données */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations 30j</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardStats?.bookings_last_30d || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.completed_bookings_30d || 0} complétées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu 30j</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardStats?.revenue_30d?.toFixed(0) || 0}€</div>
            <p className="text-xs text-muted-foreground">
              Note moy. {dashboardStats?.avg_rating_30d?.toFixed(1) || 0}/5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails échoués</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{failedEmails?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              En attente de retry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réclamations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardStats?.open_complaints || 0}</div>
            <p className="text-xs text-muted-foreground">
              En cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes système */}
      {systemAlerts && systemAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes système</CardTitle>
            <CardDescription>
              Alertes non résolues détectées automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{alert.title}</p>
                      <Badge 
                        variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' :
                          'secondary'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolveAlert(alert.id)}
                    className="ml-2"
                  >
                    <CheckCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div key={email.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{email.sujet}</p>
                    <p className="text-sm text-muted-foreground">{email.destinataire_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{email.error_message}</p>
                  </div>
                  <Badge variant="destructive" className="ml-2">
                    {email.retry_count}/3
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Inbox}
              title="Aucun email en échec"
              description="Tous les emails ont été envoyés avec succès"
            />
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
                <div key={cart.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">Panier #{cart.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Créé le {new Date(cart.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground ml-2">
                    {cart.total_estimated}€
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={ShoppingCart}
              title="Aucun panier abandonné"
              description="Tous les clients ont finalisé leurs achats"
            />
          )}
        </CardContent>
      </Card>

      {/* Stats supplémentaires */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prestataires actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardStats?.active_providers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vérifiés et disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Paniers actifs (7j)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardStats?.active_carts_7d || 0}</div>
            <p className="text-xs text-muted-foreground">
              {abandonedCarts?.length || 0} abandonnés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardStats?.bookings_last_30d && dashboardStats?.completed_bookings_30d 
                ? ((dashboardStats.completed_bookings_30d / dashboardStats.bookings_last_30d) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Réservations complétées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
