import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Star,
  Award,
  Calendar
} from "lucide-react";

interface ProviderStatsModalProps {
  providerId: string;
  providerName: string;
  onClose: () => void;
}

export const ProviderStatsModal = ({ providerId, providerName, onClose }: ProviderStatsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    completedMissions: 0,
    cancelledMissions: 0,
    acceptanceRate: 0,
    cancellationRate: 0,
    totalRevenue: 0,
    averageRating: 0,
    lastMissionDate: null as string | null
  });

  useEffect(() => {
    loadProviderStats();
  }, [providerId]);

  const loadProviderStats = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les missions du prestataire
      const { data: missions, error: missionsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerId);

      if (missionsError) throw missionsError;

      // Charger les données du prestataire (rating, etc.)
      const { data: providerData } = await supabase
        .from('providers')
        .select('rating, missions_completed, total_earnings')
        .eq('id', providerId)
        .single();

      const total = missions?.length || 0;
      const completed = missions?.filter(m => m.status === 'completed' || m.status === 'paid').length || 0;
      const cancelled = missions?.filter(m => m.status === 'cancelled').length || 0;
      const assigned = missions?.filter(m => m.status === 'assigned').length || 0;
      const accepted = missions?.filter(m => ['accepted', 'in_progress', 'completed', 'paid'].includes(m.status)).length || 0;

      const totalRevenue = missions?.reduce((sum, m) => {
        if (m.status === 'completed' || m.status === 'paid') {
          return sum + (Number(m.total_price) * 0.72);
        }
        return sum;
      }, 0) || 0;

      const acceptanceRate = assigned > 0 ? (accepted / (assigned + accepted)) * 100 : 100;
      const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

      const lastMission = missions?.sort((a, b) => 
        new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
      )[0];

      setStats({
        totalMissions: total,
        completedMissions: completed,
        cancelledMissions: cancelled,
        acceptanceRate,
        cancellationRate,
        totalRevenue,
        averageRating: providerData?.rating || 0,
        lastMissionDate: lastMission?.booking_date || null
      });
    } catch (error) {
      console.error('Error loading provider stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Statistiques du prestataire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statistiques de {providerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Performance globale */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total missions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMissions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedMissions} terminées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus cumulés</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground">
                  72% des missions terminées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Taux de performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taux de performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Taux d'acceptation</span>
                  </div>
                  <Badge variant={stats.acceptanceRate >= 80 ? "default" : "secondary"}>
                    {stats.acceptanceRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.acceptanceRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.acceptanceRate >= 90 ? 'Excellent' : stats.acceptanceRate >= 80 ? 'Très bon' : stats.acceptanceRate >= 70 ? 'Bon' : 'À améliorer'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Taux d'annulation</span>
                  </div>
                  <Badge variant={stats.cancellationRate < 10 ? "default" : "destructive"}>
                    {stats.cancellationRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-destructive h-2 rounded-full transition-all"
                    style={{ width: `${stats.cancellationRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.cancellationRate < 5 ? 'Excellent' : stats.cancellationRate < 10 ? 'Bon' : 'À surveiller'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Satisfaction client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Satisfaction client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= stats.averageRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Badge variant={stats.averageRating >= 4.5 ? "default" : stats.averageRating >= 4 ? "secondary" : "outline"}>
                  {stats.averageRating >= 4.5 ? 'Excellent' : stats.averageRating >= 4 ? 'Très bon' : stats.averageRating >= 3 ? 'Bon' : 'À améliorer'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Dernière activité */}
          {stats.lastMissionDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Dernière activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Dernière mission effectuée le{' '}
                  <span className="font-medium">
                    {new Date(stats.lastMissionDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Indicateur de fiabilité global */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Évaluation globale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {stats.acceptanceRate >= 80 && stats.cancellationRate < 10 && stats.averageRating >= 4 ? (
                  <>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      ⭐ Prestataire fiable
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ce prestataire est hautement recommandable
                    </p>
                  </>
                ) : stats.acceptanceRate >= 70 && stats.cancellationRate < 15 ? (
                  <>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      ✓ Prestataire correct
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Performances satisfaisantes
                    </p>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      ⚠️ À surveiller
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Performances à améliorer
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
