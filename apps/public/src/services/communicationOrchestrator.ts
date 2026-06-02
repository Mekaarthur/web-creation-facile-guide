import { supabase } from "@/integrations/supabase/client";
import { smsService } from "./smsService";
import { pushNotificationService } from "./pushNotificationService";

/**
 * Service d'orchestration des communications
 * Gère l'envoi coordonné d'emails, SMS et notifications push
 */
class CommunicationOrchestrator {
  
  /**
   * Envoyer une communication multi-canal
   */
  async sendMultiChannel(params: {
    userId: string;
    userEmail?: string;
    userPhone?: string;
    type: string;
    priority: 'normal' | 'high' | 'urgent';
    emailData?: any;
    smsData?: any;
    pushData?: {
      title: string;
      message: string;
    };
  }) {
    const results = {
      email: { success: false, error: null as any },
      sms: { success: false, error: null as any },
      push: { success: false, error: null as any }
    };

    // EMAIL (si données fournies)
    if (params.emailData && params.userEmail) {
      try {
        const { error } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            type: params.type,
            recipientEmail: params.userEmail,
            data: params.emailData
          }
        });
        results.email.success = !error;
        results.email.error = error;
      } catch (error) {
        results.email.error = error;
      }
    }

    // SMS (uniquement pour priorité haute/urgente)
    if (params.priority === 'urgent' && params.smsData && params.userPhone) {
      try {
        const smsResult = await smsService.sendCriticalSMS({
          type: params.smsData.type,
          recipientPhone: params.userPhone,
          recipientName: params.smsData.recipientName || 'Client',
          data: params.smsData.data
        });
        results.sms.success = smsResult.success;
        results.sms.error = smsResult.error;
      } catch (error) {
        results.sms.error = error;
      }
    }

    // PUSH NOTIFICATION
    if (params.pushData) {
      try {
        await supabase.from('realtime_notifications').insert({
          user_id: params.userId,
          type: params.type,
          title: params.pushData.title,
          message: params.pushData.message,
          priority: params.priority
        });
        results.push.success = true;
      } catch (error) {
        results.push.error = error;
      }
    }

    // Logger le résultat
    await this.logCommunication(params.userId, params.type, results);

    return results;
  }

  /**
   * Annulation d'urgence - Tous canaux
   */
  async notifyEmergencyCancellation(params: {
    clientId: string;
    clientEmail: string;
    clientPhone: string;
    clientName: string;
    bookingData: {
      serviceName: string;
      bookingDate: string;
      startTime: string;
      reason: string;
    };
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      userPhone: params.clientPhone,
      type: 'emergency_cancellation',
      priority: 'urgent',
      emailData: {
        clientName: params.clientName,
        ...params.bookingData
      },
      smsData: {
        type: 'emergency_cancellation',
        recipientName: params.clientName,
        data: params.bookingData
      },
      pushData: {
        title: '🚨 Annulation Urgente',
        message: `Votre ${params.bookingData.serviceName} du ${params.bookingData.bookingDate} est annulée`
      }
    });
  }

  /**
   * Absence prestataire - Tous canaux
   */
  async notifyProviderAbsence(params: {
    clientId: string;
    clientEmail: string;
    clientPhone: string;
    clientName: string;
    bookingData: {
      serviceName: string;
      bookingDate: string;
      startTime: string;
      replacementProviderName?: string;
    };
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      userPhone: params.clientPhone,
      type: 'late_provider_absence',
      priority: 'urgent',
      emailData: {
        clientName: params.clientName,
        ...params.bookingData
      },
      smsData: {
        type: 'late_provider_absence',
        recipientName: params.clientName,
        data: params.bookingData
      },
      pushData: {
        title: '⚠️ Changement de prestataire',
        message: params.bookingData.replacementProviderName 
          ? `${params.bookingData.replacementProviderName} prend le relais`
          : 'Nous cherchons un remplaçant'
      }
    });
  }

  /**
   * Mission urgente pour prestataire
   */
  async notifyUrgentMission(params: {
    providerId: string;
    providerEmail: string;
    providerPhone: string;
    providerName: string;
    missionData: {
      serviceName: string;
      bookingDate: string;
      startTime: string;
      address: string;
    };
  }) {
    return this.sendMultiChannel({
      userId: params.providerId,
      userEmail: params.providerEmail,
      userPhone: params.providerPhone,
      type: 'urgent_replacement',
      priority: 'urgent',
      emailData: {
        providerName: params.providerName,
        ...params.missionData
      },
      smsData: {
        type: 'urgent_replacement',
        recipientName: params.providerName,
        data: params.missionData
      },
      pushData: {
        title: '🔥 MISSION URGENTE',
        message: `${params.missionData.serviceName} à ${params.missionData.startTime}`
      }
    });
  }

  /**
   * Confirmation de réservation (email + push)
   */
  async notifyBookingConfirmation(params: {
    clientId: string;
    clientEmail: string;
    clientName: string;
    bookingData: any;
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      type: 'booking_confirmation',
      priority: 'normal',
      emailData: {
        clientName: params.clientName,
        ...params.bookingData
      },
      pushData: {
        title: '✅ Réservation confirmée',
        message: `${params.bookingData.serviceName} le ${params.bookingData.bookingDate}`
      }
    });
  }

  /**
   * Rappel 24h (email + push)
   */
  async notifyBookingReminder(params: {
    clientId: string;
    clientEmail: string;
    clientName: string;
    bookingData: any;
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      type: 'booking_reminder',
      priority: 'high',
      emailData: {
        clientName: params.clientName,
        ...params.bookingData
      },
      pushData: {
        title: '📅 Rappel : Prestation demain',
        message: `${params.bookingData.serviceName} à ${params.bookingData.startTime}`
      }
    });
  }

  /**
   * Mission démarrée (push uniquement)
   */
  async notifyMissionStarted(params: {
    clientId: string;
    clientEmail: string;
    providerName: string;
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      type: 'mission_started',
      priority: 'normal',
      pushData: {
        title: '▶️ Prestation démarrée',
        message: `${params.providerName} a commencé la prestation`
      }
    });
  }

  /**
   * Mission terminée (email + push)
   */
  async notifyMissionCompleted(params: {
    clientId: string;
    clientEmail: string;
    clientName: string;
    bookingData: any;
  }) {
    return this.sendMultiChannel({
      userId: params.clientId,
      userEmail: params.clientEmail,
      type: 'mission_completed',
      priority: 'normal',
      emailData: {
        clientName: params.clientName,
        ...params.bookingData
      },
      pushData: {
        title: '✅ Prestation terminée',
        message: 'Nous espérons que vous êtes satisfait. Laissez un avis !'
      }
    });
  }

  /**
   * Logger la communication
   */
  private async logCommunication(userId: string, type: string, results: any) {
    try {
      await supabase.from('notification_logs').insert({
        user_id: userId,
        notification_type: type,
        subject: `Communication multi-canal: ${type}`,
        content: JSON.stringify(results),
        status: results.email.success || results.sms.success || results.push.success ? 'sent' : 'failed'
      });
    } catch (error) {
      console.error('Erreur logging communication:', error);
    }
  }
}

export const communicationOrchestrator = new CommunicationOrchestrator();
