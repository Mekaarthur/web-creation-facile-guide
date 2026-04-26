import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WorkflowNotificationRequest {
  booking_id: string;
  notification_type: 'order_received' | 'provider_assigned' | 'booking_confirmed' | 'mission_started' | 'mission_completed';
  recipient_email: string;
  recipient_name: string;
  booking_details: {
    service_name: string;
    booking_date: string;
    start_time: string;
    address: string;
    total_price: number;
    provider_name?: string;
  };
}

const getEmailTemplate = (type: string, details: any) => {
  const templates = {
    order_received: {
      subject: `Commande reçue - ${details.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre commande a été reçue !</h2>
          <p>Bonjour ${details.recipient_name},</p>
          <p>Nous avons bien reçu votre demande de prestation. Notre équipe va rapidement vous assigner le meilleur prestataire disponible.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails de votre commande</h3>
            <p><strong>Service :</strong> ${details.service_name}</p>
            <p><strong>Date :</strong> ${details.booking_date}</p>
            <p><strong>Heure :</strong> ${details.start_time}</p>
            <p><strong>Adresse :</strong> ${details.address}</p>
            <p><strong>Prix :</strong> ${details.total_price}€</p>
          </div>
          
          <p>🎯 <strong>Prochaine étape :</strong> Nous allons analyser votre demande et vous assigner automatiquement un prestataire qualifié selon vos critères.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo</p>
        </div>
      `
    },
    provider_assigned: {
      subject: `Prestataire assigné - ${details.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre prestataire a été trouvé !</h2>
          <p>Bonjour ${details.recipient_name},</p>
          <p>Excellente nouvelle ! Nous avons trouvé et assigné un prestataire qualifié pour votre demande.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Votre prestataire</h3>
            <p><strong>Prestataire :</strong> ${details.provider_name || 'En cours de confirmation'}</p>
            <p><strong>Service :</strong> ${details.service_name}</p>
            <p><strong>Date :</strong> ${details.booking_date} à ${details.start_time}</p>
          </div>
          
          <p>🎯 <strong>Prochaine étape :</strong> Votre prestataire va confirmer sa disponibilité dans les prochaines minutes.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo</p>
        </div>
      `
    },
    booking_confirmed: {
      subject: `Prestation confirmée - ${details.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Votre prestation est confirmée !</h2>
          <p>Bonjour ${details.recipient_name},</p>
          <p>Parfait ! Votre prestataire a confirmé sa disponibilité. Votre prestation est maintenant planifiée.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Prestation confirmée</h3>
            <p><strong>Prestataire :</strong> ${details.provider_name}</p>
            <p><strong>Service :</strong> ${details.service_name}</p>
            <p><strong>Date :</strong> ${details.booking_date} à ${details.start_time}</p>
            <p><strong>Adresse :</strong> ${details.address}</p>
            <p><strong>Prix :</strong> ${details.total_price}€</p>
          </div>
          
          <p>🎯 <strong>Prochaine étape :</strong> Votre prestataire vous contactera prochainement pour finaliser les détails et commencera la prestation à l'heure convenue.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo</p>
        </div>
      `
    },
    mission_started: {
      subject: `Prestation commencée - ${details.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre prestation a commencé !</h2>
          <p>Bonjour ${details.recipient_name},</p>
          <p>Votre prestataire vient de commencer votre prestation. Tout se déroule comme prévu !</p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #2563eb;">Prestation en cours</h3>
            <p><strong>Service :</strong> ${details.service_name}</p>
            <p><strong>Prestataire :</strong> ${details.provider_name}</p>
            <p><strong>Heure de début :</strong> Maintenant</p>
          </div>
          
          <p>Votre prestataire travaille avec soin pour vous offrir le meilleur service possible.</p>
          
          <p>Avec tendresse,<br>L'équipe Bikawo</p>
        </div>
      `
    },
    mission_completed: {
      subject: `Prestation terminée - ${details.service_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Votre prestation est terminée !</h2>
          <p>Bonjour ${details.recipient_name},</p>
          <p>Excellente nouvelle ! Votre prestation vient d'être terminée avec succès.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a;">Mission accomplie !</h3>
            <p><strong>Service :</strong> ${details.service_name}</p>
            <p><strong>Prestataire :</strong> ${details.provider_name}</p>
            <p><strong>Prix total :</strong> ${details.total_price}€</p>
          </div>
          
          <p>🌟 <strong>Votre avis compte :</strong> Aidez les autres clients en partageant votre expérience avec ce prestataire. Votre avis contribue à maintenir la qualité de nos services.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Laisser un avis</a>
          </div>
          
          <p>Avec tendresse,<br>L'équipe Bikawo</p>
        </div>
      `
    }
  };

  return templates[type as keyof typeof templates] || templates.order_received;
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

    const { booking_id, notification_type, recipient_email, recipient_name, booking_details }: WorkflowNotificationRequest = await req.json();

    console.log(`[WORKFLOW-NOTIFICATION] Sending ${notification_type} for booking ${booking_id}`);

    const template = getEmailTemplate(notification_type, { ...booking_details, recipient_name });

    const emailResult = await resend.emails.send({
      from: "Bikawo - Votre assistant personnel au quotidien <contact@bikawo.com>",
      to: [recipient_email],
      subject: template.subject,
      html: template.html,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    console.log(`[WORKFLOW-NOTIFICATION] Email sent successfully:`, emailResult.data);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResult.data?.id,
      notification_type 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[WORKFLOW-NOTIFICATION] Error:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});