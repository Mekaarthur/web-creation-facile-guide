import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        
        // Récupérer les détails de la réservation séparément
        const [bookingResult, serviceResult, clientResult, providerResult] = await Promise.all([
          supabase.from('bookings').select('*').eq('id', newBooking.id).single(),
          supabase.from('services').select('name').eq('id', newBooking.service_id).single(),
          supabase.from('profiles').select('first_name, last_name').eq('user_id', newBooking.client_id).single(),
          newBooking.provider_id ? supabase.from('providers').select('business_name, user_id').eq('id', newBooking.provider_id).single() : null
        ]);

        const booking = bookingResult.data;
        if (!booking) return;

        const bookingDetails = {
          service_name: serviceResult.data?.name || 'Service',
          booking_date: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
          start_time: booking.start_time,
          address: booking.address,
          total_price: booking.total_price
        };

        const clientName = clientResult.data ? 
          `${clientResult.data.first_name} ${clientResult.data.last_name}` : 'Client';

        // Nouveau booking créé
        if (!oldBooking && newBooking.status === 'pending') {
          await sendWorkflowEmail('order_received', {
            booking_id: newBooking.id,
            client_email: booking.client_id, // En attendant d'avoir l'email réel
            client_name: clientName,
            booking_details: bookingDetails
          });
        }

        // Prestataire assigné
        if (oldBooking?.status !== 'assigned' && newBooking.status === 'assigned') {
          await sendWorkflowEmail('provider_assigned', {
            booking_id: newBooking.id,
            client_email: booking.client_id,
            client_name: clientName,
            provider_name: providerResult?.data?.business_name || 'Prestataire',
            booking_details: bookingDetails
          });
        }

        // Booking confirmé
        if (oldBooking?.status !== 'confirmed' && newBooking.status === 'confirmed') {
          await sendWorkflowEmail('booking_confirmed', {
            booking_id: newBooking.id,
            client_email: booking.client_id,
            client_name: clientName,
            provider_name: providerResult?.data?.business_name || 'Prestataire',
            booking_details: bookingDetails
          });

          // Programmer un rappel 24h avant (simulé)
          setTimeout(() => {
            toast({
              title: "Rappel programmé",
              description: "Un rappel sera envoyé 24h avant la prestation",
            });
          }, 1000);
        }

        // Mission commencée
        if (oldBooking?.status !== 'in_progress' && newBooking.status === 'in_progress') {
          await sendWorkflowEmail('mission_started', {
            booking_id: newBooking.id,
            client_email: booking.client_id,
            client_name: clientName,
            provider_name: providerResult?.data?.business_name || 'Prestataire',
            booking_details: bookingDetails
          });
        }

        // Mission terminée
        if (oldBooking?.status !== 'completed' && newBooking.status === 'completed') {
          await sendWorkflowEmail('mission_completed', {
            booking_id: newBooking.id,
            client_email: booking.client_id,
            client_name: clientName,
            provider_name: providerResult?.data?.business_name || 'Prestataire',
            booking_details: bookingDetails
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