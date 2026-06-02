import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { communicationOrchestrator } from '@/services/communicationOrchestrator';
import { toast } from 'sonner';

/**
 * Hook pour orchestrer les communications d'urgence
 * Surveille les emergency_assignments et déclenche les communications multi-canal
 */
export const useEmergencyOrchestration = () => {

  useEffect(() => {
    const channel = supabase
      .channel('emergency-orchestration')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'emergency_assignments'
      }, async (payload) => {
        const assignment = payload.new;
        
        try {
          // Récupérer les détails complets séparément
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('*, service:services(name)')
            .eq('id', assignment.original_booking_id)
            .single();

          if (!bookingData) return;

          const { data: clientData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('user_id', bookingData.client_id)
            .single();

          if (!clientData) return;

          // Notification d'urgence tous canaux
          if (assignment.reason.includes('Annulation')) {
            await communicationOrchestrator.notifyEmergencyCancellation({
              clientId: bookingData.client_id,
              clientEmail: clientData.email,
              clientPhone: clientData.phone,
              clientName: clientData.first_name,
              bookingData: {
                serviceName: bookingData.service.name,
                bookingDate: bookingData.booking_date,
                startTime: bookingData.start_time,
                reason: assignment.reason
              }
            });
          } else if (assignment.reason.includes('Absence')) {
            await communicationOrchestrator.notifyProviderAbsence({
              clientId: bookingData.client_id,
              clientEmail: clientData.email,
              clientPhone: clientData.phone,
              clientName: clientData.first_name,
              bookingData: {
                serviceName: bookingData.service.name,
                bookingDate: bookingData.booking_date,
                startTime: bookingData.start_time,
                replacementProviderName: undefined
              }
            });
          }

          toast.error('🚨 Communication d\'urgence envoyée', {
            description: `Client notifié par email, SMS et notification push`,
            duration: 5000
          });

        } catch (error) {
          console.error('Erreur orchestration urgence:', error);
          toast.error('Erreur communication urgence');
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'emergency_assignments'
      }, async (payload) => {
        const assignment = payload.new;
        
        // Si un prestataire backup est assigné
        if (assignment.status === 'assigned' && assignment.replacement_provider_id) {
          try {
            // Récupérer les infos du prestataire
            const { data: providerData } = await supabase
              .from('providers')
              .select('business_name, user_id')
              .eq('id', assignment.replacement_provider_id)
              .single();

            if (!providerData) return;

            const { data: providerProfile } = await supabase
              .from('profiles')
              .select('email, phone, first_name')
              .eq('user_id', providerData.user_id)
              .single();

            if (!providerProfile) return;

            // Récupérer les infos de la mission
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('*, service:services(name)')
              .eq('id', assignment.original_booking_id)
              .single();

            if (!bookingData) return;

            // Notifier le prestataire backup
            await communicationOrchestrator.notifyUrgentMission({
              providerId: providerData.user_id,
              providerEmail: providerProfile.email,
              providerPhone: providerProfile.phone,
              providerName: providerData.business_name,
              missionData: {
                serviceName: bookingData.service.name,
                bookingDate: bookingData.booking_date,
                startTime: bookingData.start_time,
                address: bookingData.address
              }
            });

            toast.success('📱 Prestataire backup notifié', {
              description: `${providerData.business_name} a reçu la mission urgente`,
              duration: 5000
            });

          } catch (error) {
            console.error('Erreur notification backup:', error);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
};
