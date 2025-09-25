import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0";

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
      // Email service temporarily disabled
      console.log('Email notification requested:', { email, name, subject });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email service temporarily disabled',
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