import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'chat';
  bookingId?: string;
}

export interface EmailNotificationData {
  to: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'payment_processed' | 'review_request' | 'chat_message';
  data: {
    clientName?: string;
    providerName?: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    message?: string;
    rating?: number;
  };
}

class NotificationService {
  // Créer une notification dans la base
  async createNotification(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          booking_id: data.bookingId || null,
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  }

  // Envoyer une notification email moderne avec tendresse
  async sendEmailNotification(data: EmailNotificationData) {
    try {
      // Utiliser la nouvelle fonction moderne avec messages tendres
      const { error } = await supabase.functions.invoke('send-modern-notification', {
        body: {
          type: data.type,
          recipient: {
            email: data.to,
            name: data.data.clientName || data.data.providerName || 'Utilisateur',
            firstName: (data.data.clientName || data.data.providerName || 'Utilisateur').split(' ')[0]
          },
          data: {
            serviceName: data.data.serviceName,
            bookingDate: data.data.bookingDate,
            startTime: data.data.bookingTime,
            address: data.data.location,
            price: data.data.price,
            providerName: data.data.providerName,
            clientName: data.data.clientName,
            bookingId: data.data.bookingId,
            message: data.data.message,
            rating: data.data.rating
          }
        }
      });

      if (error) throw error;
      console.log('💝 Email moderne envoyé avec tendresse');
      return { success: true };
    } catch (error) {
      console.error('Error sending modern email notification:', error);
      // Fallback vers l'ancienne fonction
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: data
        });
        return { success: true };
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return { success: false, error };
      }
    }
  }

  // Envoyer une notification push (si supporté)
  async sendPushNotification(title: string, message: string, data?: any) {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return { success: false, error: 'Not supported' };
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return { success: false, error: 'Permission denied' };
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        data
      });

      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        if (data?.bookingId) {
          // Naviguer vers la réservation
          window.location.href = `/espace-personnel`;
        }
      };

      return { success: true };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error };
    }
  }

  // Demander la permission pour les notifications push
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'notsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Marquer les notifications comme lues
  async markNotificationsAsRead(notificationIds: string[]) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return { success: false, error };
    }
  }

  // Notifications complètes pour différents événements
  async notifyBookingRequest(bookingData: {
    providerEmail: string;
    clientName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    providerId: string;
  }) {
    // Notification en base pour le prestataire
    await this.createNotification({
      userId: bookingData.providerId,
      title: 'Nouvelle demande de réservation',
      message: `${bookingData.clientName} souhaite réserver ${bookingData.serviceName}`,
      type: 'booking',
      bookingId: bookingData.bookingId
    });

    // Email au prestataire
    await this.sendEmailNotification({
      to: bookingData.providerEmail,
      type: 'booking_request',
      data: bookingData
    });
  }

  async notifyBookingAccepted(bookingData: {
    clientEmail: string;
    providerName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    clientId: string;
  }) {
    // Notification en base pour le client
    await this.createNotification({
      userId: bookingData.clientId,
      title: 'Réservation confirmée',
      message: `${bookingData.providerName} a accepté votre réservation`,
      type: 'booking',
      bookingId: bookingData.bookingId
    });

    // Email au client
    await this.sendEmailNotification({
      to: bookingData.clientEmail,
      type: 'booking_accepted',
      data: bookingData
    });
  }

  async notifyBookingRejected(bookingData: {
    clientEmail: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    clientId: string;
  }) {
    // Notification en base pour le client
    await this.createNotification({
      userId: bookingData.clientId,
      title: 'Réservation non disponible',
      message: `Votre demande pour ${bookingData.serviceName} n'a pas pu être acceptée`,
      type: 'booking',
      bookingId: bookingData.bookingId
    });

    // Email au client
    await this.sendEmailNotification({
      to: bookingData.clientEmail,
      type: 'booking_rejected',
      data: bookingData
    });
  }

  async notifyPaymentProcessed(paymentData: {
    providerEmail: string;
    clientName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    providerId: string;
  }) {
    // Notification en base pour le prestataire
    await this.createNotification({
      userId: paymentData.providerId,
      title: 'Paiement reçu',
      message: `Paiement de ${paymentData.price}€ reçu pour ${paymentData.serviceName}`,
      type: 'payment',
      bookingId: paymentData.bookingId
    });

    // Email au prestataire
    await this.sendEmailNotification({
      to: paymentData.providerEmail,
      type: 'payment_processed',
      data: paymentData
    });
  }

  async notifyReviewRequest(reviewData: {
    clientEmail: string;
    providerName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
    clientId: string;
  }) {
    // Notification en base pour le client
    await this.createNotification({
      userId: reviewData.clientId,
      title: 'Laissez votre avis',
      message: `Comment s'est passée votre prestation avec ${reviewData.providerName} ?`,
      type: 'review',
      bookingId: reviewData.bookingId
    });

    // Email au client
    await this.sendEmailNotification({
      to: reviewData.clientEmail,
      type: 'review_request',
      data: reviewData
    });
  }

  async notifyNewMessage(messageData: {
    recipientEmail: string;
    senderName: string;
    serviceName: string;
    message: string;
    bookingId: string;
    recipientId: string;
  }) {
    // Notification en base pour le destinataire
    await this.createNotification({
      userId: messageData.recipientId,
      title: 'Nouveau message',
      message: `${messageData.senderName}: ${messageData.message.substring(0, 50)}...`,
      type: 'chat',
      bookingId: messageData.bookingId
    });

    // Email au destinataire
    await this.sendEmailNotification({
      to: messageData.recipientEmail,
      type: 'chat_message',
      data: {
        clientName: messageData.senderName,
        serviceName: messageData.serviceName,
        message: messageData.message,
        bookingId: messageData.bookingId,
        bookingDate: '',
        bookingTime: '',
        location: '',
        price: 0
      }
    });
  }
}

export const notificationService = new NotificationService();