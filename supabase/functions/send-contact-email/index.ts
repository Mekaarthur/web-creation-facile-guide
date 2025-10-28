import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactRequest = await req.json();

    console.log('Processing contact form submission from:', email);

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Envoyer l'email à contact@bikawo.com
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bikawo Contact <contact@bikawo.com>",
        to: ["contact@bikawo.com"],
        reply_to: email,
        subject: `Nouveau message de ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau message depuis le formulaire de contact</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Nom:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              ${phone ? `<p style="margin: 10px 0;"><strong>Téléphone:</strong> ${phone}</p>` : ''}
              <p style="margin: 10px 0;"><strong>Message:</strong></p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              Vous pouvez répondre directement à cet email pour contacter ${name}.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await emailResponse.json();
    console.log('Email sent successfully:', data);

    // Envoyer un email de confirmation au client
    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bikawo <contact@bikawo.com>",
        to: [email],
        subject: "Message reçu - Bikawo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Merci de nous avoir contacté !</h2>
            <p>Bonjour ${name},</p>
            
            <p>Nous avons bien reçu votre message et nous vous remercions de l'intérêt que vous portez à Bikawo.</p>
            
            <p>Notre équipe reviendra vers vous dans les plus brefs délais, généralement sous 24 heures.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #64748b;"><strong>Votre message:</strong></p>
              <p style="margin: 10px 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>En attendant notre réponse, n'hésitez pas à :</p>
            <ul style="color: #64748b;">
              <li>Consulter notre <a href="https://bikawo.com/aide" style="color: #2563eb;">centre d'aide</a></li>
              <li>Nous appeler au 0609085390</li>
            </ul>
            
            <p>À très bientôt,<br>L'équipe Bikawo</p>
          </div>
        `,
      }),
    });

    if (!confirmationResponse.ok) {
      console.error('Failed to send confirmation email, but main email was sent');
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
