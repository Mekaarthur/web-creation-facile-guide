import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReferralReward } from './types';

interface Props {
  showPayDialog: boolean;
  setShowPayDialog: (v: boolean) => void;
  showRejectDialog: boolean;
  setShowRejectDialog: (v: boolean) => void;
  selectedReward: ReferralReward | null;
  markRewardAsPaid: (id: string) => void;
  rejectReward: (id: string) => void;
}

export function RewardDialogs({
  showPayDialog, setShowPayDialog, showRejectDialog, setShowRejectDialog,
  selectedReward, markRewardAsPaid, rejectReward,
}: Props) {
  return (
    <>
      <AlertDialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous marquer cette récompense de {selectedReward?.amount}€ comme payée ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedReward && markRewardAsPaid(selectedReward.id)}>
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la récompense</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment rejeter cette récompense de {selectedReward?.amount}€ ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReward && rejectReward(selectedReward.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
