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

  const findAndCleanupDuplicates = async () => {
    // Trouver les doublons automatiquement - réservations identiques du même client
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, client_id, service_id, booking_date, start_time, total_price, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Grouper par clé unique (client + service + date + heure)
    const duplicateGroups: Record<string, any[]> = {};
    bookings?.forEach(booking => {
      const key = `${booking.client_id}-${booking.service_id}-${booking.booking_date}-${booking.start_time}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(booking);
    });

    // Filtrer pour ne garder que les groupes avec plus d'une réservation
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1);
    
    if (duplicates.length === 0) {
      toast.info("Aucun doublon détecté");
      return [];
    }

    // Pour chaque groupe, garder la plus récente et marquer les autres pour suppression
    const idsToDelete: string[] = [];
    duplicates.forEach(group => {
      // Trier par date de création, le plus récent en premier
      const sorted = group.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Supprimer tous sauf le premier (le plus récent)
      idsToDelete.push(...sorted.slice(1).map(b => b.id));
    });

    return idsToDelete;
  };

  const handleCleanup = async () => {
    setIsDeleting(true);
    
    try {
      const idsToDelete = await findAndCleanupDuplicates();
      
      if (!idsToDelete || idsToDelete.length === 0) {
        setIsDeleting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-cleanup-duplicates', {
        body: { bookingIds: idsToDelete }
      });

      if (error) throw error;

      toast.success(`${data.deleted} doublon(s) supprimé(s) avec succès`);
      
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
          <AlertDialogTitle>Nettoyer les réservations dupliquées ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va détecter et supprimer automatiquement toutes les réservations dupliquées 
            (même paiement Stripe). Pour chaque groupe de doublons, la réservation la plus récente sera conservée.
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
