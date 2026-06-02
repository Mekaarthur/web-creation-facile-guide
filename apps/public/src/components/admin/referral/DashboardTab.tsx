import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle, Star, Award, TrendingUp } from 'lucide-react';
import { ReferralReward, ReferralStats } from './types';
import { getRewardTypeColor } from './utils';

interface Props {
  stats: ReferralStats;
  rewards: ReferralReward[];
}

export function DashboardTab({ stats, rewards }: Props) {
  return (
    <TabsContent value="dashboard" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Parrainages</p>
                <p className="text-3xl font-bold">{stats.totalReferrals}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.activeReferrals} actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold">{stats.pendingAmount}€</p>
              </div>
              <Clock className="h-10 w-10 text-warning/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.pendingRewards} récompenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total versé</p>
                <p className="text-3xl font-bold">{stats.paidAmount}€</p>
              </div>
              <CheckCircle className="h-10 w-10 text-success/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Récompenses payées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ambassadeurs</p>
                <p className="text-3xl font-bold">{stats.totalAmbassadors}</p>
              </div>
              <Star className="h-10 w-10 text-warning/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Super Ambassadeurs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance en attente</p>
                <p className="text-3xl font-bold">{stats.pendingPerformanceAmount}€</p>
              </div>
              <Award className="h-10 w-10 text-warning/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.pendingPerformanceRewards} récompenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance versée</p>
                <p className="text-3xl font-bold">{stats.paidPerformanceAmount}€</p>
              </div>
              <CheckCircle className="h-10 w-10 text-success/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.bronzeCount + stats.silverCount + stats.goldCount} récompenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Répartition Tiers</p>
                <p className="text-lg font-bold">🥉 {stats.bronzeCount} | 🥈 {stats.silverCount} | 🥇 {stats.goldCount}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Bronze, Silver, Gold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Taux de Conversion</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Validation (50h)', count: stats.validatedReferrals, color: 'bg-info' },
              { label: 'Fidélisation (120h)', count: stats.loyaltyReferrals, color: 'bg-primary' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-bold">
                    {stats.totalReferrals > 0 ? Math.round((count / stats.totalReferrals) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full`}
                    style={{ width: `${stats.totalReferrals > 0 ? (count / stats.totalReferrals) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition des Récompenses</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'validation', label: 'Validation (30€)', color: 'bg-info' },
                { type: 'loyalty', label: 'Fidélisation (50€)', color: 'bg-primary' },
                { type: 'super_ambassador', label: 'Super Ambassadeur (100€)', color: 'bg-warning' },
              ].map(({ type, label, color }) => {
                const count = rewards.filter(r => r.reward_type === type).length;
                const total = rewards.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{label}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
