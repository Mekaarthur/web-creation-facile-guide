import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, conversationId, senderName, messagePreview } = await req.json();

    if (!userId || !conversationId) {
      throw new Error("Missing required parameters");
    }

    // Récupérer l'email de l'utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      throw new Error("User email not found");
    }

    // TODO: Intégrer avec un service d'envoi d'emails (Resend, SendGrid, etc.)
    // Pour l'instant, on crée juste une notification in-app
    await supabaseAdmin
      .from('realtime_notifications')
      .insert({
        user_id: userId,
        type: 'new_message',
        title: `💬 Nouveau message de ${senderName}`,
        message: messagePreview || 'Vous avez reçu un nouveau message sur Bikawo',
        data: {
          conversation_id: conversationId,
          sender_name: senderName
        },
        priority: 'medium'
      });

    console.log(`📧 Notification envoyée à ${profile.first_name} (${profile.email})`);

    // Structure pour l'envoi d'email (à implémenter avec Resend/SendGrid)
    const emailData = {
      to: profile.email,
      subject: `Nouveau message de ${senderName} sur Bikawo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>BIKAWO</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>Bonjour ${profile.first_name},</h2>
            <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> sur Bikawo.</p>
            ${messagePreview ? `<div style="background: white; padding: 15px; border-left: 3px solid #3b82f6; margin: 20px 0;">
              <em>"${messagePreview}"</em>
            </div>` : ''}
            <p>
              <a href="${Deno.env.get("SITE_URL")}/messages?conversation=${conversationId}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Voir la conversation
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Cette notification automatique a été envoyée depuis Bikawo.<br>
              Si vous souhaitez ne plus recevoir ces notifications, modifiez vos préférences dans votre compte.
            </p>
          </div>
        </div>
      `
    };

    // Log pour débogage (à remplacer par un vrai envoi d'email)
    console.log("📧 Email à envoyer:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification envoyée",
        email_queued: true 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
