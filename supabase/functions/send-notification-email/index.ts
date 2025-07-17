import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'payment_processed';
  data: {
    clientName?: string;
    providerName?: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    location: string;
    price: number;
    bookingId: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const { clientName, providerName, serviceName, bookingDate, bookingTime, location, price } = data;

  switch (type) {
    case 'booking_request':
      return {
        subject: `Nouvelle demande de réservation - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nouvelle demande de réservation</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Détails de la réservation</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>Date :</strong> ${bookingDate}</p>
              <p><strong>Heure :</strong> ${bookingTime}</p>
              <p><strong>Lieu :</strong> ${location}</p>
              <p><strong>Prix :</strong> ${price}€</p>
            </div>
            <p>Connectez-vous à votre espace prestataire pour accepter ou refuser cette demande.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/espace-prestataire" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Gérer ma demande
              </a>
            </div>
          </div>
        `
      };

    case 'booking_accepted':
      return {
        subject: `Réservation confirmée - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">Réservation confirmée !</h1>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Votre réservation a été acceptée</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>Prestataire :</strong> ${providerName}</p>
              <p><strong>Date :</strong> ${bookingDate}</p>
              <p><strong>Heure :</strong> ${bookingTime}</p>
              <p><strong>Lieu :</strong> ${location}</p>
              <p><strong>Prix :</strong> ${price}€</p>
            </div>
            <p>Votre réservation est confirmée. Le prestataire vous contactera prochainement.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/espace-personnel" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Voir mes réservations
              </a>
            </div>
          </div>
        `
      };

    case 'booking_rejected':
      return {
        subject: `Réservation non disponible - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Réservation non disponible</h1>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Malheureusement, votre demande n'a pas pu être acceptée</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>Date demandée :</strong> ${bookingDate}</p>
              <p><strong>Heure demandée :</strong> ${bookingTime}</p>
            </div>
            <p>Le prestataire n'est pas disponible pour ce créneau. Nous vous encourageons à essayer un autre créneau ou un autre prestataire.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/#services" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Rechercher d'autres créneaux
              </a>
            </div>
          </div>
        `
      };

    case 'payment_processed':
      return {
        subject: `Paiement reçu - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Paiement confirmé</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Votre prestation a été payée</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>Date :</strong> ${bookingDate}</p>
              <p><strong>Montant :</strong> ${price}€</p>
            </div>
            <p>Le paiement pour cette prestation a été traité. Les fonds seront versés sur votre compte selon les conditions convenues.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/espace-prestataire" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Voir mes gains
              </a>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: 'Notification',
        html: '<p>Vous avez une nouvelle notification.</p>'
      };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: NotificationRequest = await req.json();

    console.log('Sending notification email:', { to, type, data });

    const emailTemplate = getEmailTemplate(type, data);

    const emailResponse = await resend.emails.send({
      from: "Assist'mw <contact@bikawo.com>",
      to: [to],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});