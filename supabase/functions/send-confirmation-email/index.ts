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

    // Obtenir l'URL de base dynamiquement selon l'environnement
    const baseUrl = Deno.env.get("SUPABASE_URL")?.includes("sandbox") 
      ? `https://ed681ca2-74aa-4970-8c41-139ffb8c8152.sandbox.lovable.dev`
      : `https://bikawo.com`;
    
    // Vérifier d'abord si l'utilisateur existe déjà
    const { data: existingUser } = await supabase.auth.admin.getUserById(userId);
    
    let confirmationUrl: string;
    
    if (existingUser && !existingUser.email_confirmed_at) {
      // Utilisateur non confirmé - générer un nouveau lien
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: userEmail,
        options: { redirectTo: `${baseUrl}/auth/complete` }
      });

      if (linkError) {
        console.error('❌ Error generating confirmation link:', linkError);
        // Si erreur "email_exists", créer un lien manuel de confirmation
        confirmationUrl = `${baseUrl}/auth/complete?type=signup&email=${encodeURIComponent(userEmail)}`;
      } else {
        confirmationUrl = linkData?.properties?.action_link || `${baseUrl}/auth/complete?type=signup`;
      }
    } else {
      // Lien de fallback pour réactivation manuelle
      confirmationUrl = `${baseUrl}/auth/complete?type=signup&email=${encodeURIComponent(userEmail)}`;
    }

    console.log('🔗 Confirmation URL generated:', confirmationUrl);
    console.log('🌍 Base URL used:', baseUrl);

    // Render l'email avec React Email
    const emailHtml = await renderAsync(
      React.createElement(ConfirmationEmail, {
        confirmationUrl,
        userEmail
      })
    );

    console.log('📝 Email template generated successfully');

    // Envoyer l'email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Bikawo <noreply@bikawo.com>",
      to: [userEmail],
      subject: "Confirmez votre compte Bikawo",
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Error sending email via Resend:', emailError);
      throw emailError;
    }

    console.log('✅ Email sent successfully via Resend:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmation envoyé avec succès',
        emailId: emailData?.id
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