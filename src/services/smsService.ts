import { supabase } from "@/integrations/supabase/client";

export interface CriticalSMSRequest {
  type: 'emergency_cancellation' | 'late_provider_absence' | 'urgent_replacement' | 'security_alert';
  recipientPhone: string;
  recipientName: string;
  data: {
    serviceName?: string;
    bookingDate?: string;
    startTime?: string;
    address?: string;
    reason?: string;
    replacementProviderName?: string;
  };
}

class SMSService {
  async sendCriticalSMS(request: CriticalSMSRequest) {
    try {
      console.log('📱 Sending critical SMS:', request.type);

      const { data, error } = await supabase.functions.invoke('send-critical-sms', {
        body: request
      });

      if (error) {
        console.error('❌ SMS sending failed:', error);
        return { success: false, error };
      }

      console.log('✅ Critical SMS sent successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return { success: false, error };
    }
  }

  // Helper methods pour les SMS critiques

  async sendEmergencyCancellation(params: {
    recipientPhone: string;
    recipientName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    reason: string;
  }) {
    return this.sendCriticalSMS({
      type: 'emergency_cancellation',
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      data: {
        serviceName: params.serviceName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        reason: params.reason
      }
    });
  }

  async sendLateProviderAbsence(params: {
    recipientPhone: string;
    recipientName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    replacementProviderName?: string;
  }) {
    return this.sendCriticalSMS({
      type: 'late_provider_absence',
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      data: {
        serviceName: params.serviceName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        replacementProviderName: params.replacementProviderName
      }
    });
  }

  async sendUrgentReplacement(params: {
    recipientPhone: string;
    recipientName: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    address: string;
  }) {
    return this.sendCriticalSMS({
      type: 'urgent_replacement',
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      data: {
        serviceName: params.serviceName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        address: params.address
      }
    });
  }

  async sendSecurityAlert(params: {
    recipientPhone: string;
    recipientName: string;
    reason: string;
  }) {
    return this.sendCriticalSMS({
      type: 'security_alert',
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      data: {
        reason: params.reason
      }
    });
  }
}

export const smsService = new SMSService();
