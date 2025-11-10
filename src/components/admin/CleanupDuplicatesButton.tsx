import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CleanupDuplicatesButton = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCleanup = async () => {
    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-cleanup-duplicates', {
        body: {
          bookingIds: [
            '4605e364-d1e6-411d-8dcb-0c976a35b191',
            '69b87966-d2da-4680-b77f-5ec7e9d34928'
          ]
        }
      });

      if (error) throw error;

      toast.success(`${data.deleted} doublons supprimés avec succès`);
      
      // Recharger la page après 1 seconde
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Nettoyer les doublons
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer les réservations dupliquées ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va supprimer 2 réservations dupliquées d'Anita Bikoko (même paiement Stripe).
            La réservation la plus récente sera conservée.
            <br /><br />
            <strong>Cette action est irréversible.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCleanup}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Confirmer la suppression"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CleanupDuplicatesButton;
