import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'booking_confirmation' | 'booking_accepted' | 'booking_rejected' | 'booking_reminder' | 'booking_completed';
  recipientEmail: string;
  recipientName: string;
  bookingDetails: {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    location: string;
    providerName?: string;
    clientName?: string;
    price: number;
  };
}

const getEmailTemplate = (type: string, details: any) => {
  const { serviceName, date, time, location, providerName, clientName, price, id } = details;

  switch (type) {
    case 'booking_confirmation':
      return {
        subject: `Confirmation de réservation - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Réservation confirmée !</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Bonjour, votre demande de réservation a été reçue avec succès.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">Détails de la réservation</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure :</strong> ${time}</p>
                <p><strong>Lieu :</strong> ${location}</p>
                <p><strong>Prix :</strong> ${price}€</p>
                <p><strong>Numéro de réservation :</strong> #${id.slice(0, 8)}</p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Nous vous recontactons sous 48h pour la suite.
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 8px;">
                Vous recevrez une notification dès qu'un prestataire acceptera votre demande.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                  Cet email a été envoyé par Assist'mw<br>
                  Si vous avez des questions, contactez-nous à contact@bikawo.com
                </p>
              </div>
            </div>
          </div>
        `
      };

    case 'booking_accepted':
      return {
        subject: `Votre réservation a été acceptée - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Réservation acceptée !</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Excellente nouvelle ! ${providerName} a accepté votre demande de réservation.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #28a745; margin-top: 0;">Détails confirmés</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure :</strong> ${time}</p>
                <p><strong>Lieu :</strong> ${location}</p>
                <p><strong>Prestataire :</strong> ${providerName}</p>
                <p><strong>Prix :</strong> ${price}€</p>
              </div>
              
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <p style="margin: 0; color: #0056b3;">
                  <strong>Prochaines étapes :</strong><br>
                  Le prestataire se rendra à l'adresse indiquée à l'heure prévue. Assurez-vous d'être disponible.
                </p>
              </div>
            </div>
          </div>
        `
      };

    case 'booking_rejected':
      return {
        subject: `Mise à jour de votre réservation - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Réservation non disponible</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Nous sommes désolés, mais votre demande de réservation n'a pas pu être acceptée par le prestataire.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #dc3545; margin-top: 0;">Détails de la réservation</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure :</strong> ${time}</p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>Pas de problème !</strong><br>
                  Nous vous proposons d'autres prestataires disponibles. Consultez notre plateforme pour faire une nouvelle réservation.
                </p>
              </div>
            </div>
          </div>
        `
      };

    case 'booking_reminder':
      return {
        subject: `Rappel : Votre rendez-vous demain - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ffc107; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Rappel important</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                N'oubliez pas votre rendez-vous prévu demain avec ${providerName} !
              </p>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">Détails du rendez-vous</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure :</strong> ${time}</p>
                <p><strong>Lieu :</strong> ${location}</p>
                <p><strong>Prestataire :</strong> ${providerName}</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Assurez-vous d'être disponible et préparez tout ce qui pourrait être nécessaire pour la prestation.
              </p>
            </div>
          </div>
        `
      };

    case 'booking_completed':
      return {
        subject: `Merci ! Votre prestation est terminée - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Prestation terminée</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Votre prestation avec ${providerName} est maintenant terminée. Nous espérons que tout s'est bien passé !
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #28a745; margin-top: 0;">Récapitulatif</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Prestataire :</strong> ${providerName}</p>
                <p><strong>Montant :</strong> ${price}€</p>
              </div>
              
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <p style="margin: 0; color: #0056b3;">
                  <strong>Votre avis compte !</strong><br>
                  N'hésitez pas à laisser un commentaire sur la prestation pour aider d'autres clients.
                </p>
              </div>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: `Notification Assist'mw`,
        html: `<p>Notification depuis Assist'mw</p>`
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, bookingDetails }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const template = getEmailTemplate(type, bookingDetails);

    const emailResponse = await resend.emails.send({
      from: "Bikawo - Votre assistant personnel au quotidien <contact@bikawo.com>",
      to: [recipientEmail],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
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