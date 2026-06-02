import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Award, AlertTriangle } from 'lucide-react';

interface EligibleProvider {
  provider_id: string;
  business_name: string;
  tier: string;
  amount: number;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
  months_active: number;
  reward_created: boolean;
}

interface ConfirmCalculateRewardsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleProviders: EligibleProvider[];
  onConfirm: () => void;
  loading: boolean;
}

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

const ConfirmCalculateRewards: React.FC<ConfirmCalculateRewardsProps> = ({
  open,
  onOpenChange,
  eligibleProviders,
  onConfirm,
  loading
}) => {
  const newRewards = eligibleProviders.filter(p => !p.reward_created);
  const totalAmount = newRewards.reduce((sum, p) => sum + p.amount, 0);

  const byTier = {
    bronze: newRewards.filter(p => p.tier === 'bronze').length,
    silver: newRewards.filter(p => p.tier === 'silver').length,
    gold: newRewards.filter(p => p.tier === 'gold').length,
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Confirmer le calcul des récompenses
          </AlertDialogTitle>
          <AlertDialogDescription>
            Récapitulatif des récompenses qui seront créées pour l'année en cours
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Nouvelles récompenses</p>
              <p className="text-2xl font-bold">{newRewards.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)}€</p>
            </div>
          </div>

          {/* By Tier */}
          <div className="flex gap-3 justify-center">
            <div className="flex items-center gap-2">
              <Badge className={getTierColor('bronze')}>
                {byTier.bronze} Bronze
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getTierColor('silver')}>
                {byTier.silver} Argent
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getTierColor('gold')}>
                {byTier.gold} Or
              </Badge>
            </div>
          </div>

          {/* Warning if no new rewards */}
          {newRewards.length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Aucune nouvelle récompense
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tous les prestataires éligibles ont déjà reçu leur récompense pour l'année en cours.
                </p>
              </div>
            </div>
          )}

          {/* List of providers */}
          {newRewards.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Prestataires éligibles ({newRewards.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                {newRewards.map((provider) => (
                  <div
                    key={provider.provider_id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Award className={`h-4 w-4 ${getTierColor(provider.tier)}`} />
                      <div>
                        <p className="font-medium text-sm">{provider.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.missions_count}m • {provider.hours_worked}h • {provider.average_rating.toFixed(1)}★
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getTierColor(provider.tier)} variant="outline">
                        {getTierLabel(provider.tier)}
                      </Badge>
                      <p className="text-sm font-bold mt-1">{provider.amount.toFixed(2)}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || newRewards.length === 0}
          >
            {loading ? 'Création en cours...' : `Confirmer et créer ${newRewards.length} récompense${newRewards.length > 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmCalculateRewards;
