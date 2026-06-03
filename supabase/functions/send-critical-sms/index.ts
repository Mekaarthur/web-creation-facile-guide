import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CriticalSMSRequest {
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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const getSMSTemplate = (type: string, data: any): string => {
  const templates: Record<string, (d: any) => string> = {
    emergency_cancellation: (d) => 
      `🚨 URGENT - Bikawo\n\nVotre ${d.serviceName} du ${d.bookingDate} à ${d.startTime} est annulée.\nRaison: ${d.reason}\n\nContactez-nous: 01 XX XX XX XX`,
    
    late_provider_absence: (d) => 
      `🚨 URGENT - Bikawo\n\nVotre prestataire ne peut plus assurer votre ${d.serviceName} du ${d.bookingDate} à ${d.startTime}.\n${d.replacementProviderName ? `Un remplaçant (${d.replacementProviderName}) arrive.` : 'Nous cherchons un remplaçant.'}\n\nContactez-nous: 01 XX XX XX XX`,
    
    urgent_replacement: (d) => 
      `🚨 MISSION URGENTE - Bikawo\n\n${d.serviceName}\n📅 ${d.bookingDate} à ${d.startTime}\n📍 ${d.address}\n\nAcceptez MAINTENANT dans votre app`,
    
    security_alert: (d) => 
      `🔐 ALERTE SÉCURITÉ - Bikawo\n\n${d.reason}\n\nSi ce n'est pas vous, contactez-nous immédiatement: 01 XX XX XX XX`
  };

  const templateFn = templates[type];
  return templateFn ? templateFn(data) : '';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CriticalSMSRequest = await req.json();
    console.log('📱 Sending critical SMS:', request.type, 'to', request.recipientPhone);

    // Vérifier que Twilio est configuré
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn('⚠️ Twilio not configured, SMS will be logged only');
      
      // Logger dans la base de données
      await supabase.from('notification_logs').insert({
        user_email: `sms:${request.recipientPhone}`,
        notification_type: `sms_${request.type}`,
        subject: 'Critical SMS (not sent - Twilio not configured)',
        content: getSMSTemplate(request.type, request.data),
        status: 'pending',
        sent_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMS logged (Twilio not configured)',
          simulation: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Générer le contenu du SMS
    const message = getSMSTemplate(request.type, request.data);

    // Envoyer via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: request.recipientPhone,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(`Twilio error: ${twilioResult.message || 'Unknown error'}`);
    }

    // Logger dans la base de données
    await supabase.from('notification_logs').insert({
      user_email: `sms:${request.recipientPhone}`,
      notification_type: `sms_${request.type}`,
      subject: `Critical SMS: ${request.type}`,
      content: message,
      status: 'sent',
      email_id: twilioResult.sid,
      sent_at: new Date().toISOString()
    });

    console.log('✅ Critical SMS sent successfully:', twilioResult.sid);

    return new Response(
      JSON.stringify({
        success: true,
        smsId: twilioResult.sid,
        message: 'SMS sent successfully'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
