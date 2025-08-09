import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRewards } from '@/hooks/useRewards';
import { Gift, Clock, Star, Trophy, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RewardsSectionProps {
  userType: 'client' | 'provider';
}

export const RewardsSection: React.FC<RewardsSectionProps> = ({ userType }) => {
  const {
    clientRewards,
    providerRewards,
    monthlyActivity,
    loading,
    checkClientEligibility,
    getTierBadgeColor,
    getTierEmoji,
    formatTierName,
    useClientReward,
  } = useRewards();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Calculate progress for client rewards
  const getClientProgress = () => {
    const recentActivity = monthlyActivity
      .filter(activity => activity.year === currentYear)
      .sort((a, b) => b.month - a.month)
      .slice(0, 3);

    const consecutiveMonths = recentActivity.filter(activity => activity.total_hours >= 10).length;
    const currentMonthActivity = recentActivity.find(activity => activity.month === currentMonth);
    const currentHours = currentMonthActivity?.total_hours || 0;

    return {
      consecutiveMonths,
      currentHours,
      progressPercentage: (currentHours / 10) * 100,
      isEligible: consecutiveMonths >= 3
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userType === 'client') {
    const progress = getClientProgress();
    const activeRewards = clientRewards.filter(reward => reward.status === 'active');
    const usedRewards = clientRewards.filter(reward => reward.status === 'used');

    return (
      <div className="space-y-6">
        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Progression vers le bon psychologue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Heures ce mois-ci</span>
                <span>{progress.currentHours}/10h</span>
              </div>
              <Progress value={progress.progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{progress.consecutiveMonths}</div>
                <div className="text-sm text-muted-foreground">Mois consécutifs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{progress.currentHours}h</div>
                <div className="text-sm text-muted-foreground">Ce mois-ci</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Mois requis</div>
              </div>
            </div>

            {progress.isEligible && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  🎉 Félicitations ! Vous êtes éligible pour un bon psychologue !
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Rewards */}
        {activeRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vos bons disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Gift className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Bon psychologue</h4>
                        <p className="text-sm text-muted-foreground">
                          Valable jusqu'au {format(new Date(reward.valid_until), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Disponible
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reward History */}
        {usedRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des récompenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">Bon psychologue</h4>
                        <p className="text-sm text-muted-foreground">
                          Utilisé le {format(new Date(reward.used_date!), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Utilisé</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Provider view
  const currentYearRewards = providerRewards.filter(reward => reward.year === currentYear);
  const pendingRewards = currentYearRewards.filter(reward => reward.status === 'pending');
  const paidRewards = currentYearRewards.filter(reward => reward.status === 'paid');

  return (
    <div className="space-y-6">
      {/* Current Year Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Récompenses {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {pendingRewards.reduce((sum, reward) => sum + reward.amount, 0)}€
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {paidRewards.reduce((sum, reward) => sum + reward.amount, 0)}€
              </div>
              <div className="text-sm text-muted-foreground">Versé</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{pendingRewards.length}</div>
              <div className="text-sm text-muted-foreground">Récompenses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {pendingRewards.length > 0 ? formatTierName(pendingRewards[0].reward_tier) : 'Aucun'}
              </div>
              <div className="text-sm text-muted-foreground">Niveau</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Rewards */}
      {pendingRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Récompenses en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${getTierBadgeColor(reward.reward_tier)} rounded-full flex items-center justify-center text-white text-xl`}>
                      {getTierEmoji(reward.reward_tier)}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        Prime {formatTierName(reward.reward_tier)}
                        <Badge className={getTierBadgeColor(reward.reward_tier)}>
                          {reward.amount}€
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {reward.missions_count} missions • {reward.hours_worked}h • Note: {reward.average_rating.toFixed(1)}/5
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    En attente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reward History */}
      {paidRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique des primes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${getTierBadgeColor(reward.reward_tier)} rounded-full flex items-center justify-center text-white text-xl`}>
                      {getTierEmoji(reward.reward_tier)}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        Prime {formatTierName(reward.reward_tier)}
                        <Badge variant="outline">{reward.amount}€</Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Versé le {format(new Date(reward.paid_date!), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Versé</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guide des récompenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm">
                🥉
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Bronze - 50€</h4>
                <p className="text-sm text-muted-foreground">
                  6 mois + (15 missions OU 120h) + note ≥ 4.0/5
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm">
                🥈
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Silver - 100€</h4>
                <p className="text-sm text-muted-foreground">
                  6 mois + (30 missions OU 240h) + note ≥ 4.3/5
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
                🥇
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Gold - 150€</h4>
                <p className="text-sm text-muted-foreground">
                  6 mois + (50 missions OU 400h) + note ≥ 4.5/5
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};