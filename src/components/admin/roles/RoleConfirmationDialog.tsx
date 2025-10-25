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
import { UserProfile } from '@/types/admin-roles';

interface RoleConfirmationDialogProps {
  open: boolean;
  actionType: 'promote' | 'revoke' | null;
  selectedUser: UserProfile | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RoleConfirmationDialog = ({
  open,
  actionType,
  selectedUser,
  onConfirm,
  onCancel,
}: RoleConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionType === 'promote' ? 'Promouvoir en Admin' : 'Révoquer Admin'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {actionType === 'promote' ? (
              <>
                Êtes-vous sûr de vouloir promouvoir <strong>{selectedUser?.email}</strong> en administrateur ?
                Cette personne aura accès à toutes les fonctionnalités d'administration.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir révoquer les droits d'administrateur de <strong>{selectedUser?.email}</strong> ?
                Cette personne n'aura plus accès aux fonctionnalités d'administration.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={actionType === 'revoke' ? 'bg-destructive' : ''}
          >
            {actionType === 'promote' ? 'Promouvoir' : 'Révoquer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
