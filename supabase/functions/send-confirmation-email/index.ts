import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ConfirmationEmail } from './_templates/confirmation-email.tsx';

// Initialize clients
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userEmail?: string; // legacy key support
  email?: string;     // preferred key
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📧 send-confirmation-email called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as EmailRequest;
    const rawEmail = (body.email || body.userEmail || '').trim().toLowerCase();

    if (!rawEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email manquant' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Compute base URL for redirect
    const baseUrl = supabaseUrl.includes("sandbox")
      ? `https://ed681ca2-74aa-4970-8c41-139ffb8c8152.sandbox.lovable.dev`
      : `https://bikawo.com`;

    // Always (re)generate a fresh, single-use confirmation link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: rawEmail,
      options: { redirectTo: `${baseUrl}/auth/complete` }
    });

    if (linkError) {
      console.error('❌ Error generating confirmation link:', linkError);
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de générer le lien de confirmation.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const confirmationUrl = linkData?.properties?.action_link
      || `${supabaseUrl}/auth/v1/verify?type=signup&redirect_to=${encodeURIComponent(`${baseUrl}/auth/complete`)}`;

    console.log('🔗 Confirmation URL generated:', confirmationUrl);
    console.log('🌍 Base URL used:', baseUrl);

    // Render the React Email template
    const emailHtml = await renderAsync(
      React.createElement(ConfirmationEmail, {
        confirmationUrl,
        userEmail: rawEmail,
      })
    );

    console.log('📝 Email template rendered');

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Bikawo <noreply@bikawo.com>",
      to: [rawEmail],
      subject: "Confirmez votre compte Bikawo",
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Error sending email via Resend:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur d'envoi de l'email" }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('✅ Confirmation email sent:', emailData?.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de confirmation envoyé', emailId: emailData?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('❌ Error in send-confirmation-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erreur interne' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
