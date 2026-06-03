import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Clock, Check, TrendingUp } from 'lucide-react';
import PerformanceRewardFilters from '../PerformanceRewardFilters';
import PerformanceRewardNotes from '../PerformanceRewardNotes';
import ConfirmCalculateRewards from '../ConfirmCalculateRewards';
import { PerformanceReward, EligibleProvider, ReferralStats } from './types';
import { getTierColor, getTierLabel, getStatusColor } from './utils';

interface Props {
  stats: Pick<ReferralStats, 'bronzeCount' | 'silverCount' | 'goldCount' | 'pendingPerformanceRewards' | 'pendingPerformanceAmount'>;
  performanceRewards: PerformanceReward[];
  eligibleProviders: EligibleProvider[];
  perfSearchTerm: string;
  setPerfSearchTerm: (v: string) => void;
  perfStatusFilter: string;
  setPerfStatusFilter: (v: string) => void;
  perfTierFilter: string;
  setPerfTierFilter: (v: string) => void;
  perfYearFilter: string;
  setPerfYearFilter: (v: string) => void;
  availableYears: number[];
  calculatePerformanceRewards: () => void;
  calculating: boolean;
  showCalculateConfirm: boolean;
  setShowCalculateConfirm: (v: boolean) => void;
  confirmCalculateRewards: () => void;
  markPerformanceRewardAsPaid: (id: string) => void;
  savePerformanceRewardNotes: (id: string, notes: string) => void;
  exportPerformanceRewards: () => void;
  getFilteredPerformanceRewards: () => PerformanceReward[];
}

export function PerformanceTab({
  stats, performanceRewards, eligibleProviders,
  perfSearchTerm, setPerfSearchTerm, perfStatusFilter, setPerfStatusFilter,
  perfTierFilter, setPerfTierFilter, perfYearFilter, setPerfYearFilter,
  availableYears, calculatePerformanceRewards, calculating,
  showCalculateConfirm, setShowCalculateConfirm, confirmCalculateRewards,
  markPerformanceRewardAsPaid, savePerformanceRewardNotes,
  exportPerformanceRewards, getFilteredPerformanceRewards,
}: Props) {
  return (
    <TabsContent value="performance" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">🥉 Bronze</p>
                <p className="text-3xl font-bold">{stats.bronzeCount}</p>
              </div>
              <Award className="h-10 w-10 text-amber-600/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">50€ par récompense</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">🥈 Silver</p>
                <p className="text-3xl font-bold">{stats.silverCount}</p>
              </div>
              <Award className="h-10 w-10 text-slate-400/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">100€ par récompense</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">🥇 Gold</p>
                <p className="text-3xl font-bold">{stats.goldCount}</p>
              </div>
              <Award className="h-10 w-10 text-yellow-500/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">150€ par récompense</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold">{stats.pendingPerformanceAmount}€</p>
              </div>
              <Clock className="h-10 w-10 text-warning/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingPerformanceRewards} récompenses
            </p>
          </CardContent>
        </Card>
      </div>

      <PerformanceRewardFilters
        searchTerm={perfSearchTerm}
        setSearchTerm={setPerfSearchTerm}
        statusFilter={perfStatusFilter}
        setStatusFilter={setPerfStatusFilter}
        tierFilter={perfTierFilter}
        setTierFilter={setPerfTierFilter}
        yearFilter={perfYearFilter}
        setYearFilter={setPerfYearFilter}
        onExport={exportPerformanceRewards}
        years={availableYears}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Calculer les récompenses de performance</p>
              <p className="text-sm text-muted-foreground">
                Analyse tous les prestataires et génère les récompenses éligibles
              </p>
            </div>
            <Button onClick={calculatePerformanceRewards} disabled={calculating} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {calculating ? 'Calcul...' : 'Calculer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmCalculateRewards
        open={showCalculateConfirm}
        onOpenChange={setShowCalculateConfirm}
        eligibleProviders={eligibleProviders}
        onConfirm={confirmCalculateRewards}
        loading={calculating}
      />

      {eligibleProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prestataires Éligibles</CardTitle>
            <CardDescription>
              {eligibleProviders.length} prestataire{eligibleProviders.length > 1 ? 's' : ''} analysé{eligibleProviders.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eligibleProviders.map(provider => (
                <div key={provider.provider_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{provider.business_name}</p>
                      <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <p className="text-muted-foreground">Missions</p>
                          <p className="font-medium">{provider.missions_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Heures</p>
                          <p className="font-medium">{provider.hours_worked.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Note</p>
                          <p className="font-medium">{provider.average_rating.toFixed(1)}/5</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ancienneté</p>
                          <p className="font-medium">{provider.months_active} mois</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {provider.tier !== 'none' ? (
                        <>
                          <Badge className={getTierColor(provider.tier)}>
                            {getTierLabel(provider.tier)}
                          </Badge>
                          {provider.reward_created && (
                            <Badge variant="default">✓ Créée</Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">Non éligible</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Récompenses de Performance</CardTitle>
          <CardDescription>
            {performanceRewards.length} récompense{performanceRewards.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceRewards.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune récompense de performance</p>
              </div>
            ) : (
              getFilteredPerformanceRewards().map(reward => (
                <div key={reward.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {reward.provider?.profiles?.first_name} {reward.provider?.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{reward.provider?.business_name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tier</p>
                          <Badge className={getTierColor(reward.reward_tier)}>
                            {getTierLabel(reward.reward_tier)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Montant</p>
                          <p className="font-bold text-success">{reward.amount}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Année</p>
                          <p className="font-medium">{reward.year}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Métriques</p>
                          <p className="font-medium text-xs">
                            {reward.missions_count} missions | {reward.hours_worked.toFixed(0)}h | ⭐ {reward.average_rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(reward.status)}>
                        {reward.status === 'paid' ? 'Payé' :
                         reward.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </Badge>
                      <PerformanceRewardNotes
                        rewardId={reward.id}
                        currentNotes={reward.notes}
                        providerName={`${reward.provider?.profiles?.first_name} ${reward.provider?.profiles?.last_name}`}
                        onSave={savePerformanceRewardNotes}
                      />
                      {reward.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPerformanceRewardAsPaid(reward.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
