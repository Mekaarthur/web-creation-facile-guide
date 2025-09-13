import { supabase } from "@/integrations/supabase/client";

export interface ModernNotificationRequest {
  type: 
    // Client notifications
    | 'client_welcome'
    | 'booking_confirmation' 
    | 'booking_reminder_24h'
    | 'booking_reminder_2h'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'booking_rescheduled'
    | 'booking_cancelled'
    | 'mission_started'
    | 'mission_completed'
    | 'invoice_generated'
    | 'payment_confirmed'
    | 'review_request'
    | 'chat_message_client'
    
    // Provider notifications
    | 'provider_welcome'
    | 'new_mission_available'
    | 'mission_assigned'
    | 'mission_reminder'
    | 'client_modification'
    | 'payment_received'
    | 'remuneration_available'
    | 'chat_message_provider'
    
    // System notifications
    | 'system_maintenance'
    | 'newsletter'
    | 'technical_support';
    
  recipient: {
    email: string;
    name: string;
    firstName?: string;
  };
  
  data: {
    serviceName?: string;
    serviceDescription?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    address?: string;
    price?: number;
    providerName?: string;
    clientName?: string;
    bookingId?: string;
    message?: string;
    invoiceNumber?: string;
    amount?: number;
    rating?: number;
    reminderType?: '24h' | '2h';
    reason?: string;
    newDate?: string;
    newTime?: string;
  };
}

class ModernNotificationService {
  // Envoyer une notification moderne avec tendresse
  async sendModernNotification(request: ModernNotificationRequest) {
    try {
      const { error } = await supabase.functions.invoke('send-modern-notification', {
        body: request
      });

      if (error) throw error;
      
      console.log(`💝 Notification moderne ${request.type} envoyée avec tendresse à ${request.recipient.email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending modern notification:', error);
      return { success: false, error };
    }
  }

  // Helper methods pour les événements courants

  // 🌟 NOTIFICATIONS CLIENTS
  async sendClientWelcome(email: string, firstName: string) {
    return this.sendModernNotification({
      type: 'client_welcome',
      recipient: { email, name: firstName, firstName },
      data: {}
    });
  }

  async sendBookingConfirmation(booking: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime?: string;
    address: string;
    price: number;
    providerName?: string;
    bookingId: string;
  }) {
    return this.sendModernNotification({
      type: 'booking_confirmation',
      recipient: { 
        email: booking.clientEmail, 
        name: booking.clientName,
        firstName: booking.clientName.split(' ')[0]
      },
      data: {
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        address: booking.address,
        price: booking.price,
        providerName: booking.providerName,
        bookingId: booking.bookingId
      }
    });
  }

  async sendBookingReminder(booking: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    address: string;
    providerName?: string;
    reminderType: '24h' | '2h';
  }) {
    const notificationType = booking.reminderType === '24h' ? 'booking_reminder_24h' : 'booking_reminder_2h';
    
    return this.sendModernNotification({
      type: notificationType,
      recipient: { 
        email: booking.clientEmail, 
        name: booking.clientName,
        firstName: booking.clientName.split(' ')[0]
      },
      data: {
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        address: booking.address,
        providerName: booking.providerName,
        reminderType: booking.reminderType
      }
    });
  }

  async sendMissionStarted(booking: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    providerName: string;
    bookingId: string;
  }) {
    return this.sendModernNotification({
      type: 'mission_started',
      recipient: { 
        email: booking.clientEmail, 
        name: booking.clientName,
        firstName: booking.clientName.split(' ')[0]
      },
      data: {
        serviceName: booking.serviceName,
        providerName: booking.providerName,
        bookingId: booking.bookingId
      }
    });
  }

  async sendMissionCompleted(booking: {
    clientEmail: string;
    clientName: string;
    serviceName: string;
    providerName: string;
    price: number;
    bookingId: string;
  }) {
    return this.sendModernNotification({
      type: 'mission_completed',
      recipient: { 
        email: booking.clientEmail, 
        name: booking.clientName,
        firstName: booking.clientName.split(' ')[0]
      },
      data: {
        serviceName: booking.serviceName,
        providerName: booking.providerName,
        price: booking.price,
        bookingId: booking.bookingId
      }
    });
  }

  // 🌟 NOTIFICATIONS PRESTATAIRES
  async sendProviderWelcome(email: string, firstName: string) {
    return this.sendModernNotification({
      type: 'provider_welcome',
      recipient: { email, name: firstName, firstName },
      data: {}
    });
  }

  async sendNewMissionAvailable(mission: {
    providerEmail: string;
    providerName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime?: string;
    address: string;
    price: number;
    bookingId: string;
  }) {
    return this.sendModernNotification({
      type: 'new_mission_available',
      recipient: { 
        email: mission.providerEmail, 
        name: mission.providerName,
        firstName: mission.providerName.split(' ')[0]
      },
      data: {
        serviceName: mission.serviceName,
        bookingDate: mission.bookingDate,
        startTime: mission.startTime,
        endTime: mission.endTime,
        address: mission.address,
        price: mission.price,
        bookingId: mission.bookingId
      }
    });
  }

  async sendPaymentReceived(payment: {
    providerEmail: string;
    providerName: string;
    serviceName: string;
    amount: number;
    bookingId: string;
  }) {
    return this.sendModernNotification({
      type: 'payment_received',
      recipient: { 
        email: payment.providerEmail, 
        name: payment.providerName,
        firstName: payment.providerName.split(' ')[0]
      },
      data: {
        serviceName: payment.serviceName,
        amount: payment.amount,
        bookingId: payment.bookingId
      }
    });
  }

  // 🌟 NOTIFICATIONS CHAT
  async sendChatMessage(chat: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    serviceName: string;
    message: string;
    bookingId: string;
    isClient: boolean;
  }) {
    const notificationType = chat.isClient ? 'chat_message_client' : 'chat_message_provider';
    
    return this.sendModernNotification({
      type: notificationType,
      recipient: { 
        email: chat.recipientEmail, 
        name: chat.recipientName,
        firstName: chat.recipientName.split(' ')[0]
      },
      data: {
        serviceName: chat.serviceName,
        message: chat.message,
        clientName: chat.isClient ? chat.senderName : chat.recipientName,
        providerName: !chat.isClient ? chat.senderName : chat.recipientName,
        bookingId: chat.bookingId
      }
    });
  }

  // 🌟 PROGRAMMATION DE RAPPELS AUTOMATIQUES
  async scheduleAutomaticReminder(bookingId: string, reminderType: '24h' | '2h') {
    try {
      // Récupérer les détails de la réservation
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          address,
          services (name),
          profiles!client_id (first_name, last_name, email),
          providers (business_name)
        `)
        .eq('id', bookingId)
        .eq('status', 'confirmed')
        .single();

      if (error || !booking) {
        console.error('Booking not found for reminder:', error);
        return { success: false, error: 'Booking not found' };
      }

      const profile = booking.profiles as any;
      const provider = booking.providers as any;
      const service = booking.services as any;

      if (!profile?.email) {
        console.error('Client email not found for reminder');
        return { success: false, error: 'Client email not found' };
      }

      await this.sendBookingReminder({
        clientEmail: profile.email,
        clientName: `${profile.first_name} ${profile.last_name}`,
        serviceName: service?.name || 'Service',
        bookingDate: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
        startTime: booking.start_time,
        address: booking.address,
        providerName: provider?.business_name,
        reminderType
      });

      console.log(`💝 Rappel ${reminderType} programmé avec tendresse pour ${profile.email}`);
      return { success: true };
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return { success: false, error };
    }
  }
}

export const modernNotificationService = new ModernNotificationService();