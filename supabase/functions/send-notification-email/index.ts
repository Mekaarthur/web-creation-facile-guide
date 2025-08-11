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
  recipientEmail?: string;
  recipientName?: string;
  to?: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'payment_processed' | 'review_request' | 'chat_message' | 'request_accepted';
  data: {
    clientName?: string;
    providerName?: string;
    serviceName: string;
    serviceDescription?: string;
    bookingDate?: string;
    bookingTime?: string;
    location: string;
    price?: number;
    bookingId?: string;
    message?: string;
    rating?: number;
    preferredDate?: string;
    preferredTime?: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const { clientName, providerName, serviceName, serviceDescription, bookingDate, bookingTime, location, price, message, rating, preferredDate, preferredTime } = data;

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

    case 'review_request':
      return {
        subject: `Laissez votre avis - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Comment s'est passée votre prestation ?</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Votre avis compte pour nous</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>Prestataire :</strong> ${providerName}</p>
              <p><strong>Date :</strong> ${bookingDate}</p>
            </div>
            <p>Aidez les autres clients en partageant votre expérience avec ce prestataire.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/espace-personnel" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Laisser un avis
              </a>
            </div>
          </div>
        `
      };

    case 'chat_message':
      return {
        subject: `Nouveau message - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nouveau message reçu</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Message concernant votre réservation</h2>
              <p><strong>Service :</strong> ${serviceName}</p>
              <p><strong>De :</strong> ${clientName || providerName}</p>
              <p><strong>Message :</strong> ${message}</p>
            </div>
            <p>Connectez-vous pour voir tous les messages et répondre.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL')}/espace-personnel" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Voir les messages
              </a>
            </div>
          </div>
        `
      };

    case 'request_accepted':
      return {
        subject: `Votre demande de service a été acceptée - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">✅ Excellente nouvelle ! Votre demande a été acceptée</h1>
            <p>Bonjour,</p>
            <p>Nous avons le plaisir de vous informer que votre demande de service a été acceptée par un de nos prestataires qualifiés.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h2 style="color: #16a34a; margin-top: 0;">Détails de votre service :</h2>
              <ul style="margin: 10px 0;">
                <li><strong>Service :</strong> ${serviceName}</li>
                ${serviceDescription ? `<li><strong>Description :</strong> ${serviceDescription}</li>` : ''}
                <li><strong>Prestataire assigné :</strong> ${providerName}</li>
                <li><strong>Localisation :</strong> ${location}</li>
                ${preferredDate ? `<li><strong>Date souhaitée :</strong> ${new Date(preferredDate).toLocaleDateString('fr-FR')}</li>` : ''}
                ${preferredTime ? `<li><strong>Horaire souhaité :</strong> ${preferredTime}</li>` : ''}
              </ul>
            </div>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Prochaines étapes :</h3>
              <ol>
                <li>Votre prestataire va vous contacter prochainement pour finaliser les détails</li>
                <li>Vous recevrez un devis détaillé si nécessaire</li>
                <li>Une fois validé, le service sera programmé selon vos disponibilités</li>
              </ol>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>Merci de faire confiance à AssistLife !</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://assistlife.fr'}" 
                 style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Voir le suivi de ma demande
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Cordialement,<br>L'équipe AssistLife
            </p>
          </div>
        `
      };

    default:
      return {
        subject: 'Notification Bikawo',
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
    const requestBody: NotificationRequest = await req.json();
    const { to, recipientEmail, type, data } = requestBody;
    
    const emailTo = to || recipientEmail;
    if (!emailTo) {
      throw new Error('No recipient email provided');
    }

    console.log('Sending notification email:', { to: emailTo, type, data });

    const emailTemplate = getEmailTemplate(type, data);

    const emailResponse = await resend.emails.send({
      from: "AssistLife <contact@bikawo.com>",
      to: [emailTo],
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