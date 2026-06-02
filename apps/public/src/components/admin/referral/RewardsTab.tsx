import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Award, Search, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReferralReward, ReferralStats } from './types';
import { getRewardTypeLabel, getRewardTypeColor, getStatusColor } from './utils';

interface Props {
  filteredRewards: ReferralReward[];
  stats: Pick<ReferralStats, 'pendingRewards' | 'pendingAmount'>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  rewardTypeFilter: string;
  setRewardTypeFilter: (v: string) => void;
  bulkPayRewards: () => void;
  setSelectedReward: (r: ReferralReward) => void;
  setShowPayDialog: (v: boolean) => void;
  setShowRejectDialog: (v: boolean) => void;
}

export function RewardsTab({
  filteredRewards, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  rewardTypeFilter, setRewardTypeFilter, bulkPayRewards, setSelectedReward,
  setShowPayDialog, setShowRejectDialog,
}: Props) {
  return (
    <TabsContent value="rewards" className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un prestataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rewardTypeFilter} onValueChange={setRewardTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="loyalty">Fidélisation</SelectItem>
                <SelectItem value="super_ambassador">Super Ambassadeur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {stats.pendingRewards > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">
                    {stats.pendingRewards} récompense{stats.pendingRewards > 1 ? 's' : ''} en attente
                  </p>
                  <p className="text-sm text-muted-foreground">Total : {stats.pendingAmount}€</p>
                </div>
              </div>
              <Button onClick={bulkPayRewards} className="gap-2">
                <Check className="h-4 w-4" />
                Tout payer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des Récompenses</CardTitle>
          <CardDescription>
            {filteredRewards.length} récompense{filteredRewards.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRewards.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune récompense trouvée</p>
              </div>
            ) : (
              filteredRewards.map(reward => (
                <div key={reward.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {reward.referrer?.profiles?.first_name} {reward.referrer?.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{reward.referrer?.business_name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <Badge className={getRewardTypeColor(reward.reward_type)}>
                            {getRewardTypeLabel(reward.reward_type)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Montant</p>
                          <p className="font-bold text-success">{reward.amount}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(new Date(reward.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(reward.status)}>
                        {reward.status === 'paid' ? 'Payé' :
                         reward.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </Badge>
                      {reward.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedReward(reward); setShowPayDialog(true); }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedReward(reward); setShowRejectDialog(true); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
