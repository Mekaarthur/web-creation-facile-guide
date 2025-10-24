import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Award, TrendingUp, Calendar, Euro, Star, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface PerformanceReward {
  id: string;
  provider_id: string;
  reward_tier: string;
  amount: number;
  year: number;
  status: string;
  earned_date: string;
  paid_date?: string;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
  notes?: string;
}

interface ProviderStats {
  missions_completed: number;
  total_hours: number;
  average_rating: number;
  months_active: number;
}

const ProviderPerformanceRewards = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<PerformanceReward[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    missions_completed: 0,
    total_hours: 0,
    average_rating: 0,
    months_active: 0
  });
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get provider ID
      const { data: provider } = await supabase
        .from('providers')
        .select('id, missions_completed, rating, created_at')
        .eq('user_id', user.id)
        .single();

      if (!provider) return;

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('provider_rewards')
        .select('*')
        .eq('provider_id', provider.id)
        .order('year', { ascending: false });

      if (rewardsData) {
        setRewards(rewardsData);
      }

      // Calculate stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('provider_id', provider.id)
        .eq('status', 'completed');

      const totalHours = bookings?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(`1970-01-01T${b.start_time}`);
          const end = new Date(`1970-01-01T${b.end_time}`);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0) || 0;

      const monthsActive = Math.floor(
        (Date.now() - new Date(provider.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      setStats({
        missions_completed: provider.missions_completed || 0,
        total_hours: totalHours,
        average_rating: provider.rating || 0,
        months_active: monthsActive
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-500';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'Bronze';
      case 'silver': return 'Argent';
      case 'gold': return 'Or';
      default: return tier;
    }
  };

  const getNextTierRequirements = () => {
    const { missions_completed, total_hours, average_rating, months_active } = stats;
    
    if (months_active < 6) {
      return {
        tier: 'Éligibilité',
        requirements: [
          { label: 'Ancienneté', current: months_active, target: 6, unit: 'mois' }
        ]
      };
    }

    if (missions_completed >= 50 && total_hours >= 400 && average_rating >= 4.5) {
      return { tier: 'Or', requirements: [] };
    }

    if (missions_completed >= 30 && total_hours >= 240 && average_rating >= 4.3) {
      return {
        tier: 'Or',
        requirements: [
          { label: 'Missions', current: missions_completed, target: 50, unit: 'missions' },
          { label: 'Heures', current: total_hours, target: 400, unit: 'heures' },
          { label: 'Note moyenne', current: average_rating, target: 4.5, unit: '/5' }
        ]
      };
    }

    if (missions_completed >= 15 && total_hours >= 120 && average_rating >= 4.0) {
      return {
        tier: 'Argent',
        requirements: [
          { label: 'Missions', current: missions_completed, target: 30, unit: 'missions' },
          { label: 'Heures', current: total_hours, target: 240, unit: 'heures' },
          { label: 'Note moyenne', current: average_rating, target: 4.3, unit: '/5' }
        ]
      };
    }

    return {
      tier: 'Bronze',
      requirements: [
        { label: 'Missions', current: missions_completed, target: 15, unit: 'missions' },
        { label: 'Heures', current: total_hours, target: 120, unit: 'heures' },
        { label: 'Note moyenne', current: average_rating, target: 4.0, unit: '/5' }
      ]
    };
  };

  const currentYearReward = rewards.find(r => r.year === currentYear);
  const nextTier = getNextTierRequirements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          Récompenses de Performance
        </h2>
        <p className="text-muted-foreground mt-2">
          Votre progression et récompenses basées sur vos performances
        </p>
      </div>

      {/* Current Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Missions réalisées</CardDescription>
            <CardTitle className="text-3xl">{stats.missions_completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Total complété
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Heures travaillées</CardDescription>
            <CardTitle className="text-3xl">{Math.round(stats.total_hours)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Heures totales
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Note moyenne</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-1">
              {stats.average_rating.toFixed(1)}
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Sur 5 étoiles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ancienneté</CardDescription>
            <CardTitle className="text-3xl">{stats.months_active}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Mois actifs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Year Reward */}
      {currentYearReward && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className={`h-6 w-6 ${getTierColor(currentYearReward.reward_tier)}`} />
                  Récompense {currentYear}
                </CardTitle>
                <CardDescription>Votre récompense de performance pour l'année en cours</CardDescription>
              </div>
              <Badge className={getTierColor(currentYearReward.reward_tier)}>
                {getTierLabel(currentYearReward.reward_tier)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Montant</span>
              <span className="text-2xl font-bold flex items-center gap-1">
                <Euro className="h-5 w-5" />
                {currentYearReward.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge variant={currentYearReward.status === 'paid' ? 'default' : 'secondary'}>
                {currentYearReward.status === 'paid' ? 'Payée' : 'En attente'}
              </Badge>
            </div>
            {currentYearReward.paid_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date de paiement</span>
                <span className="text-sm">
                  {format(new Date(currentYearReward.paid_date), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            )}
            {currentYearReward.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Note</p>
                <p className="text-sm">{currentYearReward.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress to Next Tier */}
      {nextTier.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progression vers {nextTier.tier}
            </CardTitle>
            <CardDescription>Continuez vos efforts pour atteindre le niveau supérieur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextTier.requirements.map((req, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{req.label}</span>
                  <span className="font-medium">
                    {req.current.toFixed(1)} / {req.target} {req.unit}
                  </span>
                </div>
                <Progress value={(req.current / req.target) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tier Requirements Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guide des paliers de récompenses</CardTitle>
          <CardDescription>Critères requis pour chaque niveau</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Award className="h-8 w-8 text-yellow-500 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold">Or - 150€</h4>
                <p className="text-sm text-muted-foreground">
                  50+ missions OU 400+ heures • Note ≥ 4.5/5 • 6+ mois d'ancienneté
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-gray-400/10 border border-gray-400/20">
              <Award className="h-8 w-8 text-gray-400 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold">Argent - 100€</h4>
                <p className="text-sm text-muted-foreground">
                  30+ missions OU 240+ heures • Note ≥ 4.3/5 • 6+ mois d'ancienneté
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Award className="h-8 w-8 text-orange-500 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold">Bronze - 50€</h4>
                <p className="text-sm text-muted-foreground">
                  15+ missions OU 120+ heures • Note ≥ 4.0/5 • 6+ mois d'ancienneté
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards History */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des récompenses</CardTitle>
            <CardDescription>Toutes vos récompenses de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Award className={`h-6 w-6 ${getTierColor(reward.reward_tier)}`} />
                    <div>
                      <p className="font-medium">
                        {getTierLabel(reward.reward_tier)} {reward.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reward.missions_count} missions • {reward.hours_worked}h • {reward.average_rating.toFixed(1)}★
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{reward.amount.toFixed(2)}€</p>
                    <Badge variant={reward.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {reward.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rewards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune récompense de performance pour le moment.
              <br />
              Continuez à fournir un excellent service pour débloquer vos premières récompenses !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderPerformanceRewards;
