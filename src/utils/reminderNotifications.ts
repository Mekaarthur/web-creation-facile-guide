import { supabase } from "@/integrations/supabase/client";

interface ReminderData {
  clientEmail: string;
  clientName: string;
  providerEmail: string;
  providerName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  address: string;
  notes?: string;
  totalPrice: number;
}

export const sendReminderNotifications = async () => {
  try {
    console.log('Sending reminder notifications...');
    
    const { data, error } = await supabase.functions.invoke('send-reminder-notifications', {
      body: { manual: true }
    });

    if (error) {
      console.error('Error sending reminder notifications:', error);
      return { success: false, error };
    }

    console.log('Reminder notifications sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking reminder function:', error);
    return { success: false, error };
  }
};

// Fonction pour envoyer automatiquement les rappels quotidiens
export const scheduleAutomaticReminders = async () => {
  try {
    // Récupérer toutes les réservations confirmées pour demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        address,
        total_price,
        profiles!client_id (
          first_name,
          last_name
        ),
        providers (
          business_name
        ),
        services (
          name
        )
      `)
      .eq('status', 'confirmed')
      .eq('booking_date', tomorrowStr);

    if (error) throw error;

    if (bookings && bookings.length > 0) {
      // Envoyer les notifications
      const { data, error: notifError } = await supabase.functions.invoke('send-reminder-notifications');
      
      if (notifError) throw notifError;

      console.log(`Sent reminders for ${bookings.length} bookings tomorrow`);
      return { success: true, count: bookings.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error('Error scheduling automatic reminders:', error);
    return { success: false, error };
  }
};

// Fonction pour programmer les rappels (appelée manuellement)
export const scheduleBookingReminders = async (bookingId: string) => {
  try {
    // Récupérer les détails du booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        address,
        notes,
        total_price,
        profiles!client_id (
          first_name,
          last_name,
          email
        ),
        providers (
          business_name,
          contact_email
        ),
        services (
          name
        )
      `)
      .eq('id', bookingId)
      .eq('status', 'confirmed')
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return { success: false, error };
    }

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Vérifier si c'est demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];
    
    if (booking.booking_date === tomorrowDateString) {
      // Envoyer les notifications immédiatement
      return await sendReminderNotifications();
    } else {
      // Programmer pour plus tard (pour l'instant, on log juste)
      console.log(`Booking ${bookingId} programmé pour le ${booking.booking_date}`);
      return { success: true, message: 'Reminder scheduled' };
    }
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return { success: false, error };
  }
};