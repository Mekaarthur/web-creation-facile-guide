import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface MissionAssignmentTriggerProps {
  onNewRequest?: (request: any) => void;
}

export const MissionAssignmentTrigger = ({ onNewRequest }: MissionAssignmentTriggerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les nouvelles demandes pour déclencher l'attribution automatique
    const channel = supabase
      .channel('new-client-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_requests'
        },
        async (payload) => {
          console.log('New client request:', payload.new);
          
          const newRequest = payload.new;
          
          // Déclencher l'attribution automatique
          await triggerAutoAssignment(newRequest);
          
          if (onNewRequest) {
            onNewRequest(newRequest);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewRequest]);

  const triggerAutoAssignment = async (request: any) => {
    try {
      console.log('Triggering auto-assignment for request:', request.id);

      const { data, error } = await supabase.functions.invoke('auto-assign-mission', {
        body: {
          clientRequestId: request.id,
          serviceType: request.service_type,
          location: request.location,
          postalCode: request.city, // Utiliser la ville comme code postal approximatif
          requestedDate: request.preferred_date
        }
      });

      if (error) {
        console.error('Error in auto-assignment:', error);
        return;
      }

      console.log('Auto-assignment result:', data);

      if (data.success) {
        toast({
          title: "Attribution automatique",
          description: `${data.notificationsSent} prestataires notifiés pour la demande`,
        });
      } else {
        toast({
          title: "Aucun prestataire disponible",
          description: "Aucun prestataire éligible trouvé pour cette demande",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error triggering auto-assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déclencher l'attribution automatique",
        variant: "destructive",
      });
    }
  };

  return null; // Ce composant ne rend rien, il écoute juste les événements
};