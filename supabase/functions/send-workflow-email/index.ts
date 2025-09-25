import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WorkflowEmailRequest {
  trigger: 'order_received' | 'provider_assigned' | 'booking_confirmed' | 'mission_started' | 'mission_completed' | 'payment_confirmed' | 'provider_remuneration';
  booking_id?: string;
  client_email?: string;
  client_name?: string;
  provider_email?: string;
  provider_name?: string;
  booking_details?: any;
  amount?: number;
}

const getEmailTemplate = (trigger: string, data: any) => {
  const templates = {
    order_received: {
      to: data.client_email,
      subject: `Commande reçue - ${data.booking_details?.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre commande a été reçue ! 🎯</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Nous avons bien reçu votre demande de prestation. Notre équipe va rapidement vous assigner le meilleur prestataire disponible dans votre zone.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails de votre commande</h3>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Date :</strong> ${data.booking_details?.booking_date}</p>
            <p><strong>Heure :</strong> ${data.booking_details?.start_time}</p>
            <p><strong>Adresse :</strong> ${data.booking_details?.address}</p>
            <p><strong>Prix :</strong> ${data.booking_details?.total_price}€</p>
          </div>
          
          <p>🌟 <strong>Prochaine étape :</strong> Nous allons analyser votre demande et vous assigner automatiquement un prestataire qualifié selon vos critères.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    provider_assigned: {
      to: data.client_email,
      subject: `Prestataire assigné - ${data.booking_details?.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre prestataire a été trouvé ! 🎯</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Excellente nouvelle ! Nous avons trouvé et assigné un prestataire qualifié pour votre demande.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Votre prestataire</h3>
            <p><strong>Prestataire :</strong> ${data.provider_name}</p>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Date :</strong> ${data.booking_details?.booking_date} à ${data.booking_details?.start_time}</p>
          </div>
          
          <p>🌟 <strong>Prochaine étape :</strong> Votre prestataire va confirmer sa disponibilité dans les prochaines minutes.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    booking_confirmed: {
      to: data.client_email,
      subject: `Prestation confirmée - ${data.booking_details?.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Votre prestation est confirmée ! ✅</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Parfait ! Votre prestataire a confirmé sa disponibilité. Votre prestation est maintenant planifiée.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Prestation confirmée</h3>
            <p><strong>Prestataire :</strong> ${data.provider_name}</p>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Date :</strong> ${data.booking_details?.booking_date} à ${data.booking_details?.start_time}</p>
            <p><strong>Adresse :</strong> ${data.booking_details?.address}</p>
            <p><strong>Prix :</strong> ${data.booking_details?.total_price}€</p>
          </div>
          
          <p>📞 <strong>Rappel 24h :</strong> Nous vous enverrons un rappel 24h avant la prestation.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    mission_started: {
      to: data.client_email,
      subject: `Prestation commencée - ${data.booking_details?.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre prestation a commencé ! 🚀</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Votre prestataire vient de commencer votre prestation. Tout se déroule comme prévu !</p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #2563eb;">Prestation en cours</h3>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Prestataire :</strong> ${data.provider_name}</p>
            <p><strong>Heure de début :</strong> Maintenant</p>
          </div>
          
          <p>Votre prestataire travaille avec soin pour vous offrir le meilleur service possible.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    mission_completed: {
      to: data.client_email,
      subject: `Prestation terminée - Merci ! ⭐`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Votre prestation est terminée ! 🎉</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Excellente nouvelle ! Votre prestation vient d'être terminée avec succès.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Mission accomplie ! ✨</h3>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Prestataire :</strong> ${data.provider_name}</p>
            <p><strong>Prix total :</strong> ${data.booking_details?.total_price}€</p>
          </div>
          
          <p>🌟 <strong>Votre avis compte :</strong> Aidez les autres clients en partageant votre expérience avec ce prestataire. Votre avis contribue à maintenir la qualité de nos services.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">⭐ Laisser un avis</a>
          </div>
          
          <p>Avec tendresse et reconnaissance,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    payment_confirmed: {
      to: data.client_email,
      subject: `Paiement confirmé - ${data.amount}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Paiement confirmé ! 💳</h2>
          <p>Bonjour ${data.client_name},</p>
          <p>Nous avons bien reçu votre paiement. Merci pour votre confiance !</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails du paiement</h3>
            <p><strong>Montant :</strong> ${data.amount}€</p>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p>Une facture vous sera envoyée sous peu.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    },
    provider_remuneration: {
      to: data.provider_email,
      subject: `Fiche de rémunération disponible`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre rémunération est disponible ! 💰</h2>
          <p>Bonjour ${data.provider_name},</p>
          <p>Votre fiche de rémunération pour la mission terminée est maintenant disponible.</p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails de la rémunération</h3>
            <p><strong>Service :</strong> ${data.booking_details?.service_name}</p>
            <p><strong>Montant :</strong> ${data.amount}€</p>
            <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p>🎯 <strong>Prochaine étape :</strong> Votre fiche est disponible dans votre espace prestataire.</p>
          
          <p>Merci pour votre excellent travail,<br>L'équipe Bikawo ❤️</p>
        </div>
      `
    }
  };

  return templates[trigger as keyof typeof templates] || templates.order_received;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestData: WorkflowEmailRequest = await req.json();

    console.log(`[WORKFLOW-EMAIL] Processing ${requestData.trigger}`);

    const template = getEmailTemplate(requestData.trigger, requestData);

    const emailResult = await resend.emails.send({
      from: "Bikawo <contact@bikawo.com>",
      to: [template.to],
      subject: template.subject,
      html: template.html,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    // Enregistrer dans les logs
    await supabase.from('notification_logs').insert({
      user_id: template.to,
      notification_type: 'email',
      subject: template.subject,
      content: template.html,
      entity_type: 'booking',
      entity_id: requestData.booking_id,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    console.log(`[WORKFLOW-EMAIL] Email sent successfully:`, emailResult.data);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResult.data?.id,
      trigger: requestData.trigger
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[WORKFLOW-EMAIL] Error:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});