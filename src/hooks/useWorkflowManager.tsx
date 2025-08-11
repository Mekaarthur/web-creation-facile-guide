import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowBooking {
  id: string;
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  total_price: number;
  client_id: string;
  provider_id?: string;
  service_id: string;
  assigned_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  check_in_location?: string;
  check_out_location?: string;
  before_photos?: string[];
  after_photos?: string[];
  provider_notes?: string;
}

export const useWorkflowManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const autoAssignProvider = async (bookingId: string, serviceId: string, location: string) => {
    try {
      // Find best available provider
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select(`
          id,
          user_id,
          rating,
          acceptance_rate,
          missions_completed,
          location,
          is_verified,
          provider_services!inner(service_id, is_active)
        `)
        .eq('is_verified', true)
        .eq('provider_services.service_id', serviceId)
        .eq('provider_services.is_active', true)
        .not('location', 'is', null)
        .order('rating', { ascending: false })
        .order('acceptance_rate', { ascending: false })
        .order('missions_completed', { ascending: false })
        .limit(1);

      if (providersError) throw providersError;

      if (providers && providers.length > 0) {
        const bestProvider = providers[0];
        
        // Assign provider to booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            provider_id: bestProvider.id,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        // Create notification for provider
        await supabase.from('provider_notifications').insert({
          provider_id: bestProvider.id,
          booking_id: bookingId,
          title: 'Nouvelle mission assignée',
          message: 'Une nouvelle mission vous a été automatiquement assignée. Confirmez votre disponibilité.',
          type: 'mission_assigned'
        });

        return bestProvider;
      }
      
      return null;
    } catch (error) {
      console.error('Error auto-assigning provider:', error);
      throw error;
    }
  };

  const confirmBooking = async (bookingId: string, providerConfirms: boolean, clientId: string) => {
    setIsLoading(true);
    try {
      if (providerConfirms) {
        // Confirm the booking
        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (error) throw error;

        // Notify client
        await supabase.from('notifications').insert({
          user_id: clientId,
          title: 'Prestation confirmée',
          message: 'Votre prestataire a confirmé sa disponibilité pour votre prestation.',
          type: 'booking_confirmed'
        });

        toast({
          title: "Mission confirmée",
          description: "Vous avez confirmé cette mission",
        });
      } else {
        // Reject and reassign
        const { error } = await supabase
          .from('bookings')
          .update({
            provider_id: null,
            status: 'pending',
            assigned_at: null
          })
          .eq('id', bookingId);

        if (error) throw error;

        // Notify client of change
        await supabase.from('notifications').insert({
          user_id: clientId,
          title: 'Recherche d\'un nouveau prestataire',
          message: 'Nous recherchons un autre prestataire disponible pour votre demande.',
          type: 'provider_changed'
        });

        toast({
          title: "Mission refusée",
          description: "La mission a été refusée et sera réassignée",
        });
      }

      return true;
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre réponse",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const missionCheckIn = async (bookingId: string, clientId: string) => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const location = `${position.coords.latitude},${position.coords.longitude}`;
      
      const { error } = await supabase
        .from('bookings')
        .update({
          started_at: new Date().toISOString(),
          check_in_location: location,
          status: 'in_progress'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Notify client
      await supabase.from('notifications').insert({
        user_id: clientId,
        title: 'Prestation commencée',
        message: 'Votre prestataire a commencé la prestation.',
        type: 'mission_started'
      });

      toast({
        title: "Check-in effectué",
        description: "Votre mission a commencé",
      });

      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le check-in",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const missionCheckOut = async (bookingId: string, clientId: string, notes?: string) => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const location = `${position.coords.latitude},${position.coords.longitude}`;
      
      const { error } = await supabase
        .from('bookings')
        .update({
          completed_at: new Date().toISOString(),
          check_out_location: location,
          provider_notes: notes || "Mission terminée avec succès",
          status: 'completed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Notify client
      await supabase.from('notifications').insert({
        user_id: clientId,
        title: 'Prestation terminée',
        message: 'Votre prestation est terminée. Nous vous invitons à laisser un avis.',
        type: 'mission_completed'
      });

      toast({
        title: "Check-out effectué",
        description: "Votre mission est terminée",
      });

      return true;
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le check-out",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    autoAssignProvider,
    confirmBooking,
    missionCheckIn,
    missionCheckOut
  };
};