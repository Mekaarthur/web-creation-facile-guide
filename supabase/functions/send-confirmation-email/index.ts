import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ConfirmationEmail } from './_templates/confirmation-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userEmail: string;
  userId: string;
  confirmationToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📧 Confirmation email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userId, confirmationToken }: EmailRequest = await req.json();
    
    console.log(`📧 Processing confirmation email for: ${userEmail}`);

    // Générer l'URL de confirmation
    let confirmationUrl;
    if (confirmationToken) {
      confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${confirmationToken}&type=signup&redirect_to=${encodeURIComponent('https://bikawo.com/espace-personnel')}`;
    } else {
      // Fallback: utiliser un lien direct vers la page d'authentification
      confirmationUrl = `https://bikawo.com/auth?message=Veuillez confirmer votre email puis vous connecter`;
    }

    console.log('🔗 Confirmation URL generated:', confirmationUrl);

    // Render l'email avec React Email
    const emailHtml = await renderAsync(
      React.createElement(ConfirmationEmail, {
        confirmationUrl,
        userEmail,
      })
    );

    console.log('📝 Email template rendered successfully');

    // Envoyer l'email via Resend
    const emailResponse = await resend.emails.send({
      from: "Bikawo <contact@bikawo.com>",
      to: [userEmail],
      subject: "🎉 Bienvenue sur Bikawo - Confirmez votre email",
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      throw new Error(`Erreur Resend: ${emailResponse.error.message}`);
    }

    console.log('✅ Email sent successfully:', emailResponse.data);

    // Mettre à jour la notification dans la base de données
    const { error: updateError } = await supabase
      .from('realtime_notifications')
      .update({ 
        message: 'Email de confirmation envoyé avec succès',
        data: { 
          email_sent: true, 
          email_id: emailResponse.data?.id 
        }
      })
      .eq('user_id', userId)
      .eq('type', 'email_confirmation');

    if (updateError) {
      console.error('⚠️ Error updating notification:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmation envoyé',
        emailId: emailResponse.data?.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("❌ Error in send-confirmation-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erreur lors de l'envoi de l'email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);