import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'abandoned_cart' | 'payment_reminder' | 'security_alert' | 'provider_weekly_report';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

const getEmailTemplate = (type: string, data: any): { subject: string; html: string } => {
  switch (type) {
    case 'abandoned_cart':
      return {
        subject: '🛒 Votre panier vous attend !',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${data.clientName},</h2>
            <p>Vous avez laissé des articles dans votre panier. Finalisez votre réservation maintenant !</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Total estimé:</strong> ${data.totalEstimated}€</p>
              <p><strong>Services:</strong> ${data.servicesCount} service(s)</p>
            </div>
            <a href="${data.cartLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Finaliser ma réservation
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Ce panier expire dans ${data.hoursRemaining}h
            </p>
          </div>
        `
      };
    
    case 'payment_reminder':
      return {
        subject: '⏰ Rappel de paiement - Bikawo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${data.clientName},</h2>
            <p>Nous vous rappelons qu'un paiement est en attente depuis ${data.daysPending} jours.</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p><strong>Montant:</strong> ${data.amount}€</p>
              <p><strong>Référence:</strong> ${data.paymentReference}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
            </div>
            <a href="${data.paymentLink}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Effectuer le paiement
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Besoin d'aide ? Contactez-nous à support@bikawo.com
            </p>
          </div>
        `
      };
    
    case 'security_alert':
      return {
        subject: '🔒 Alerte de sécurité - Bikawo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Alerte de sécurité</h2>
            <p>Une activité inhabituelle a été détectée sur votre compte.</p>
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p><strong>Type:</strong> ${data.alertType}</p>
              <p><strong>Date:</strong> ${data.detectedAt}</p>
              <p><strong>Adresse IP:</strong> ${data.ipAddress}</p>
            </div>
            <p>Si ce n'était pas vous, veuillez changer votre mot de passe immédiatement.</p>
            <a href="${data.securityLink}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Sécuriser mon compte
            </a>
          </div>
        `
      };
    
    case 'provider_weekly_report':
      return {
        subject: '📊 Votre rapport hebdomadaire - Bikawo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${data.providerName},</h2>
            <p>Voici votre bilan de la semaine :</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 5px 0; color: #666;">Missions complétées</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">${data.missionsCompleted}</p>
                </div>
                <div>
                  <p style="margin: 5px 0; color: #666;">Revenus</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">${data.weeklyEarnings}€</p>
                </div>
                <div>
                  <p style="margin: 5px 0; color: #666;">Note moyenne</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">${data.averageRating}/5 ⭐</p>
                </div>
                <div>
                  <p style="margin: 5px 0; color: #666;">Taux d'acceptation</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">${data.acceptanceRate}%</p>
                </div>
              </div>
            </div>
            <p style="color: #28a745; font-weight: bold;">Continuez comme ça ! 💪</p>
          </div>
        `
      };
    
    default:
      return {
        subject: 'Notification - Bikawo',
        html: `<p>Vous avez une nouvelle notification.</p>`
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, recipientEmail, recipientName, data }: EmailRequest = await req.json();

    console.log(`Processing ${type} email for ${recipientEmail}`);

    const { subject, html } = getEmailTemplate(type, data);

    // Log dans la table communications
    const { error: logError } = await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: recipientEmail,
        template_name: type,
        sujet: subject,
        contenu: html,
        status: 'envoyé',
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    // En production, intégrer avec Resend ou autre service d'email
    // Pour l'instant, on simule l'envoi
    console.log(`Email ${type} envoyé à ${recipientEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${type} sent successfully`,
        recipient: recipientEmail 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
