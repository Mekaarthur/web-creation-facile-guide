import { supabase } from "@/integrations/supabase/client";

interface BookingDetails {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  providerName?: string;
  clientName?: string;
  price: number;
}

interface NotificationData {
  type: 'booking_confirmation' | 'booking_accepted' | 'booking_rejected' | 'booking_reminder' | 'booking_completed';
  recipientEmail: string;
  recipientName: string;
  bookingDetails: BookingDetails;
}

export const sendNotification = async (notificationData: NotificationData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: notificationData
    });

    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }

    console.log('Notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return { success: false, error };
  }
};

// Helper functions pour envoyer des notifications spécifiques
export const sendBookingConfirmation = async (
  clientEmail: string,
  clientName: string,
  bookingDetails: BookingDetails
) => {
  return sendNotification({
    type: 'booking_confirmation',
    recipientEmail: clientEmail,
    recipientName: clientName,
    bookingDetails
  });
};

export const sendBookingAccepted = async (
  clientEmail: string,
  clientName: string,
  bookingDetails: BookingDetails
) => {
  return sendNotification({
    type: 'booking_accepted',
    recipientEmail: clientEmail,
    recipientName: clientName,
    bookingDetails
  });
};

export const sendBookingRejected = async (
  clientEmail: string,
  clientName: string,
  bookingDetails: BookingDetails
) => {
  return sendNotification({
    type: 'booking_rejected',
    recipientEmail: clientEmail,
    recipientName: clientName,
    bookingDetails
  });
};

export const sendBookingReminder = async (
  clientEmail: string,
  clientName: string,
  bookingDetails: BookingDetails
) => {
  return sendNotification({
    type: 'booking_reminder',
    recipientEmail: clientEmail,
    recipientName: clientName,
    bookingDetails
  });
};

export const sendBookingCompleted = async (
  clientEmail: string,
  clientName: string,
  bookingDetails: BookingDetails
) => {
  return sendNotification({
    type: 'booking_completed',
    recipientEmail: clientEmail,
    recipientName: clientName,
    bookingDetails
  });
};