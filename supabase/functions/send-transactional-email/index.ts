import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';

// Import templates - Client
import { BookingConfirmationEmail } from './_templates/booking-confirmation.tsx';
import { ProviderAssignedEmail } from './_templates/provider-assigned.tsx';
import { BookingReminderEmail } from './_templates/booking-reminder.tsx';
import { MissionStartedEmail } from './_templates/mission-started.tsx';
import { MissionCompletedEmail } from './_templates/mission-completed.tsx';
import { CancellationEmail } from './_templates/cancellation.tsx';
import { RefundProcessedEmail } from './_templates/refund-processed.tsx';
import { AccountCreatedEmail } from './_templates/account-created.tsx';
import { PasswordSetupEmail } from './_templates/password-setup.tsx';
import { AccountDeletedEmail } from './_templates/account-deleted.tsx';
import { ReviewRequestEmail } from './_templates/review-request.tsx';
import { InvoiceAvailableEmail } from './_templates/invoice-available.tsx';
import { BookingModificationEmail } from './_templates/booking-modification.tsx';
import { PaymentFailedEmail } from './_templates/payment-failed.tsx';
import { ReferralSuccessEmail } from './_templates/referral-success.tsx';

// Import templates - Provider
import { ProviderNewMissionEmail } from './_templates/provider-new-mission.tsx';
import { ProviderMissionConfirmedEmail } from './_templates/provider-mission-confirmed.tsx';
import { ProviderReminderEmail } from './_templates/provider-reminder.tsx';
import { ProviderPaymentEmail } from './_templates/provider-payment.tsx';
import { ProviderDocumentValidatedEmail } from './_templates/provider-document-validated.tsx';
import { ProviderDocumentRejectedEmail } from './_templates/provider-document-rejected.tsx';
import { ProviderTrainingReminderEmail } from './_templates/provider-training-reminder.tsx';
import { ProviderAccountActivatedEmail } from './_templates/provider-account-activated.tsx';
import { ProviderRatingReceivedEmail } from './_templates/provider-rating-received.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

import { corsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  type: 
    // Client emails
    | 'booking_confirmation'
    | 'provider_assigned'
    | 'booking_reminder'
    | 'mission_started'
    | 'mission_completed'
    | 'review_request'
    | 'cancellation'
    | 'refund_processed'
    | 'invoice_available'
    | 'account_created'
    | 'password_setup'
    | 'account_deleted'
    | 'booking_modification'
    | 'payment_failed'
    | 'referral_success'
    // Provider emails
    | 'provider_new_mission'
    | 'provider_mission_confirmed'
    | 'provider_reminder'
    | 'provider_payment'
    | 'provider_document_validated'
    | 'provider_document_rejected'
    | 'provider_training_reminder'
    | 'provider_account_activated'
    | 'provider_rating_received';
  data: any;
  recipientEmail: string;
  recipientName?: string;
}

const getEmailTemplate = async (type: string, data: any) => {
  const templates: Record<string, any> = {
    // Client templates
    'booking_confirmation': BookingConfirmationEmail,
    'provider_assigned': ProviderAssignedEmail,
    'booking_reminder': BookingReminderEmail,
    'mission_started': MissionStartedEmail,
    'mission_completed': MissionCompletedEmail,
    'cancellation': CancellationEmail,
    'refund_processed': RefundProcessedEmail,
    'account_created': AccountCreatedEmail,
    'password_setup': PasswordSetupEmail,
    'account_deleted': AccountDeletedEmail,
    'review_request': ReviewRequestEmail,
    'invoice_available': InvoiceAvailableEmail,
    'booking_modification': BookingModificationEmail,
    'payment_failed': PaymentFailedEmail,
    'referral_success': ReferralSuccessEmail,
    // Provider templates
    'provider_new_mission': ProviderNewMissionEmail,
    'provider_mission_confirmed': ProviderMissionConfirmedEmail,
    'provider_reminder': ProviderReminderEmail,
    'provider_payment': ProviderPaymentEmail,
    'provider_document_validated': ProviderDocumentValidatedEmail,
    'provider_document_rejected': ProviderDocumentRejectedEmail,
    'provider_training_reminder': ProviderTrainingReminderEmail,
    'provider_account_activated': ProviderAccountActivatedEmail,
    'provider_rating_received': ProviderRatingReceivedEmail,
  };

  const TemplateComponent = templates[type];
  if (!TemplateComponent) {
    throw new Error(`Unknown email template: ${type}`);
  }

  return await renderAsync(React.createElement(TemplateComponent, data));
};

const getEmailSubject = (type: string): string => {
  const subjects: Record<string, string> = {
    // Client subjects
    'booking_confirmation': '✅ Réservation confirmée - Bikawo',
    'provider_assigned': '👤 Prestataire assigné à votre réservation',
    'booking_reminder': '⏰ Rappel : Votre prestation demain',
    'mission_started': '🚀 Votre prestation a commencé',
    'mission_completed': '✅ Prestation terminée - Partagez votre avis',
    'review_request': '⭐ Donnez votre avis sur votre prestation',
    'cancellation': '❌ Réservation annulée',
    'refund_processed': '💰 Remboursement effectué',
    'invoice_available': '📄 Facture disponible',
    'account_created': '🎉 Bienvenue chez Bikawo',
    'password_setup': '🔐 Créez votre mot de passe',
    'account_deleted': '🗑️ Confirmation de suppression de compte',
    'booking_modification': '📅 Réservation modifiée',
    'payment_failed': '⚠️ Échec de paiement - Action requise',
    'referral_success': '🎊 Parrainage réussi - Votre récompense',
    // Provider subjects
    'provider_new_mission': '🎯 Nouvelle mission disponible',
    'provider_mission_confirmed': '✅ Mission confirmée par le client',
    'provider_reminder': '⏰ Rappel : Mission demain',
    'provider_payment': '💵 Paiement effectué',
    'provider_document_validated': '✅ Documents validés',
    'provider_document_rejected': '⚠️ Action requise : Document à renvoyer',
    'provider_training_reminder': '📚 Complétez votre formation',
    'provider_account_activated': '🎉 Votre compte est activé',
    'provider_rating_received': '⭐ Nouvel avis reçu',
  };

  return subjects[type] || 'Notification Bikawo';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, recipientEmail, recipientName }: EmailRequest = await req.json();

    console.log('📧 Sending email:', { type, recipientEmail });

    // Vérifier que Resend est configuré
    if (!Deno.env.get("RESEND_API_KEY")) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Injecter siteUrl côté serveur pour les templates qui en ont besoin
    const enrichedData = {
      siteUrl: Deno.env.get('SITE_URL') ?? 'https://bikawo.com',
      ...data,
    };

    // Générer le HTML de l'email
    const html = await getEmailTemplate(type, enrichedData);
    const subject = getEmailSubject(type);

    // Envoyer l'email via Resend
    const result = await resend.emails.send({
      from: 'Bikawo - Votre assistant personnel au quotidien <notifications@bikawo.com>',
      to: [recipientEmail],
      subject: subject,
      html: html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    // Logger dans la base de données
    await supabase.from('notification_logs').insert({
      user_email: recipientEmail,
      notification_type: type,
      subject: subject,
      content: html,
      status: 'sent',
      email_id: result.data?.id,
      sent_at: new Date().toISOString()
    });

    console.log('✅ Email sent successfully:', result.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.data?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
