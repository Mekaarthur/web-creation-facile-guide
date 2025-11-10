import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
// import { Resend } from "npm:resend@2.0.0";
// import React from 'npm:react@18.3.1';
// import { renderAsync } from 'npm:@react-email/components@0.0.22';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

// Template email pour la réinitialisation
const PasswordResetEmail = ({ resetUrl, userEmail }: { resetUrl: string; userEmail: string }) => {
  return React.createElement('html', null,
    React.createElement('body', { style: { fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333' } },
      React.createElement('div', { style: { maxWidth: '600px', margin: '0 auto', padding: '20px' } },
        React.createElement('h1', { style: { color: '#2563eb', textAlign: 'center' } }, '🔐 Réinitialisation de votre mot de passe'),
        React.createElement('p', null, `Bonjour,`),
        React.createElement('p', null, `Vous avez demandé à réinitialiser le mot de passe de votre compte Bikawo (${userEmail}).`),
        React.createElement('div', { style: { textAlign: 'center', margin: '30px 0' } },
          React.createElement('a', {
            href: resetUrl,
            style: {
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }
          }, '🔄 Créer un nouveau mot de passe')
        ),
        React.createElement('p', { style: { fontSize: '14px', color: '#666' } }, 
          '⏱️ Ce lien expire dans 24 heures pour votre sécurité.'
        ),
        React.createElement('p', { style: { fontSize: '14px', color: '#666' } }, 
          '❗ Si vous n\'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.'
        ),
        React.createElement('hr', { style: { margin: '30px 0' } }),
        React.createElement('p', { style: { fontSize: '12px', color: '#999', textAlign: 'center' } }, 
          'Cet email a été envoyé par Bikawo - Votre plateforme de services à domicile.'
        )
      )
    )
  );
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🔑 Password reset email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();
    
    console.log(`🔑 Processing password reset for: ${email}`);

    // Vérifier que l'email existe en base
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('email', email);

    if (!profiles || profiles.length === 0) {
      console.log(`❌ No account found for email: ${email}`);
      // Ne pas révéler si l'email existe ou non pour la sécurité
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
        }), 
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Render l'email avec React
    const emailHtml = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetUrl,
        userEmail: email,
      })
    );

    console.log('📝 Password reset email template rendered');

    // Envoyer l'email via Resend
    const emailResponse = await resend.emails.send({
      from: "Bikawo - Votre assistant personnel au quotidien <contact@bikawo.com>",
      to: [email],
      subject: "🔐 Réinitialisation de votre mot de passe Bikawo",
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      throw new Error(`Erreur Resend: ${emailResponse.error.message}`);
    }

    console.log('✅ Password reset email sent successfully:', emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de réinitialisation envoyé',
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
    console.error("❌ Error in send-password-reset function:", error);
    
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