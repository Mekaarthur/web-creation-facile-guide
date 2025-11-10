import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WelcomeEmail } from './_templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  tempPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📧 send-welcome-email called');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, tempPassword }: WelcomeEmailRequest = await req.json();

    if (!email || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Email et mot de passe requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Envoi email de bienvenue à:', email);

    const loginUrl = Deno.env.get("SUPABASE_URL")?.includes("sandbox")
      ? `https://ed681ca2-74aa-4970-8c41-139ffb8c8152.sandbox.lovable.dev/auth`
      : `https://bikawo.com/auth`;

    const emailHtml = await renderAsync(
      React.createElement(WelcomeEmail, {
        email,
        firstName,
        tempPassword,
        loginUrl,
      })
    );

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Bikawo - Votre assistant personnel au quotidien <noreply@bikawo.com>",
      to: [email],
      subject: "Bienvenue sur Bikawo - Votre compte a été créé",
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      return new Response(
        JSON.stringify({ error: "Erreur d'envoi de l'email" }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('✅ Email de bienvenue envoyé:', emailData?.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('❌ Erreur dans send-welcome-email:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erreur interne' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
