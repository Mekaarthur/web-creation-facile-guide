import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { communicationOrchestrator } from '@/services/communicationOrchestrator';

export const useWorkflowEmails = () => {
  const { toast } = useToast();

  const sendWorkflowEmail = async (trigger: string, data: any) => {
    try {
      // Utiliser la nouvelle fonction moderne avec messages tendres
      const { error } = await supabase.functions.invoke('send-modern-notification', {
        body: {
          type: trigger,
          recipient: {
            email: data.client_email,
            name: data.client_name,
            firstName: data.client_name?.split(' ')[0] || 'Client'
          },
          data: {
            serviceName: data.booking_details?.service_name,
            bookingDate: data.booking_details?.booking_date,
            startTime: data.booking_details?.start_time,
            address: data.booking_details?.address,
            price: data.booking_details?.total_price,
            providerName: data.provider_name,
            clientName: data.client_name,
            bookingId: data.booking_id
          }
        }
      });

      if (error) throw error;

      console.log(`💝 Email moderne ${trigger} envoyé avec tendresse`);
    } catch (error) {
      console.error(`Erreur envoi email moderne ${trigger}:`, error);
      // Fallback vers l'ancienne fonction en cas d'erreur
      try {
        await supabase.functions.invoke('send-workflow-email', {
          body: { trigger, ...data }
        });
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
      }
    }
  };

  // Écouter les changements de statut des réservations pour déclencher les emails
  useEffect(() => {
    const channel = supabase
      .channel('workflow-emails')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, async (payload) => {
        const { new: newBooking, old: oldBooking } = payload;
        
        // Récupérer les données complètes pour les communications
        const [bookingResult, serviceResult, clientResult, providerResult] = await Promise.all([
          supabase.from('bookings').select('*').eq('id', newBooking.id).single(),
          supabase.from('services').select('name').eq('id', newBooking.service_id).single(),
          supabase.from('profiles').select('first_name, last_name, email, phone').eq('user_id', newBooking.client_id).single(),
          newBooking.provider_id ? supabase.from('providers').select('business_name, user_id').eq('id', newBooking.provider_id).single() : null
        ]);

        const booking = bookingResult.data;
        const client = clientResult.data;
        if (!booking || !client) return;

        const bookingData = {
          serviceName: serviceResult.data?.name || 'Service',
          bookingDate: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
          startTime: booking.start_time,
          address: booking.address,
          totalPrice: booking.total_price
        };

        // Nouvelle réservation créée
        if (!oldBooking && newBooking.status === 'pending') {
          await communicationOrchestrator.notifyBookingConfirmation({
            clientId: booking.client_id,
            clientEmail: client.email,
            clientName: client.first_name,
            bookingData
          });
        }
        
        // Prestataire assigné
        if (oldBooking?.status !== 'assigned' && newBooking.status === 'assigned') {
          await sendWorkflowEmail('provider_assigned', {
            booking_id: newBooking.id,
            client_email: client.email,
            client_name: `${client.first_name} ${client.last_name}`,
            provider_name: providerResult?.data?.business_name || 'Prestataire',
            booking_details: {
              service_name: serviceResult.data?.name,
              booking_date: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
              start_time: booking.start_time,
              address: booking.address,
              total_price: booking.total_price
            }
          });
        }
        
        // Réservation confirmée - Rappel 24h
        if (oldBooking?.status !== 'confirmed' && newBooking.status === 'confirmed') {
          await communicationOrchestrator.notifyBookingReminder({
            clientId: booking.client_id,
            clientEmail: client.email,
            clientName: client.first_name,
            bookingData: {
              ...bookingData,
              providerName: providerResult?.data?.business_name
            }
          });
        }
        
        // Mission démarrée
        if (oldBooking?.status !== 'in_progress' && newBooking.status === 'in_progress') {
          await communicationOrchestrator.notifyMissionStarted({
            clientId: booking.client_id,
            clientEmail: client.email,
            providerName: providerResult?.data?.business_name || 'Votre prestataire'
          });
        }
        
        // Mission terminée
        if (oldBooking?.status !== 'completed' && newBooking.status === 'completed') {
          await communicationOrchestrator.notifyMissionCompleted({
            clientId: booking.client_id,
            clientEmail: client.email,
            clientName: client.first_name,
            bookingData: {
              ...bookingData,
              providerName: providerResult?.data?.business_name
            }
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { sendWorkflowEmail };
};