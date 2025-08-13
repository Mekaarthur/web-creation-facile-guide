import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  subject: string;
  message: string;
  type?: 'email' | 'sms';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, subject, message, type = 'email' }: NotificationRequest = await req.json();
    console.log('Sending notification:', { email, name, subject, type });

    if (type === 'email') {
      const emailResponse = await resend.emails.send({
        from: "Bikawo <notifications@resend.dev>",
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bikawo</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre plateforme de services à domicile</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #374151; margin-top: 0;">Bonjour ${name},</h2>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #374151; margin: 0; line-height: 1.6;">${message}</p>
              </div>
              
              <p style="color: #6b7280; margin: 20px 0;">
                Vous pouvez vous connecter à votre espace personnel pour suivre l'évolution de votre demande.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://votre-site-bikawo.com" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  Accéder à mon espace
                </a>
              </div>
              
              <hr style="border: none; height: 1px; background: #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                Vous recevez cet email car vous avez une demande active sur Bikawo.<br>
                Si vous avez des questions, contactez-nous à support@bikawo.com
              </p>
            </div>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        type: 'email'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Pour SMS (à implémenter plus tard avec un service SMS)
    if (type === 'sms') {
      console.log('SMS notification requested but not implemented yet');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'SMS functionality not implemented yet',
        type: 'sms'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    throw new Error('Invalid notification type');

  } catch (error: any) {
    console.error("Error in notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
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