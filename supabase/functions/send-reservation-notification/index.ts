import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReservationNotificationRequest {
  reservationId: string;
  reservationData: {
    items: Array<{
      serviceName: string;
      packageTitle: string;
      price: number;
      customBooking?: {
        clientInfo?: {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          company?: string;
        };
        address: string;
        serviceType?: string;
        description?: string;
        preferredDate?: string;
        budget?: string;
      };
    }>;
    totalEstimated: number;
    additionalNotes?: string;
    submittedAt: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, reservationData }: ReservationNotificationRequest = await req.json();

    // Email pour le client (confirmation)
    const clientInfo = reservationData.items[0]?.customBooking?.clientInfo;
    if (clientInfo?.email) {
      const clientEmailResponse = await resend.emails.send({
        from: "Bikawo <contact@bikawo.com>",
        to: [clientInfo.email],
        subject: `Confirmation de votre demande de réservation - ${reservationId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Confirmation de votre demande</h1>
            
            <p>Bonjour ${clientInfo.firstName} ${clientInfo.lastName},</p>
            
            <p>Nous avons bien reçu votre demande de réservation <strong>${reservationId}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">Récapitulatif de votre demande</h2>
              
              <ul style="list-style: none; padding: 0;">
                ${reservationData.items.map(item => `
                  <li style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">
                    <strong>${item.serviceName}</strong><br>
                    <small style="color: #6b7280;">${item.packageTitle}</small><br>
                    ${item.customBooking?.serviceType ? `<small>Type: ${item.customBooking.serviceType}</small><br>` : ''}
                    ${item.customBooking?.address ? `<small>Adresse: ${item.customBooking.address}</small><br>` : ''}
                    <strong style="color: #059669;">${item.price}€/h</strong>
                  </li>
                `).join('')}
              </ul>
              
              <div style="text-align: right; font-size: 18px; font-weight: bold; color: #2563eb;">
                Total estimé: ${reservationData.totalEstimated}€
              </div>
            </div>
            
            ${reservationData.additionalNotes ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Vos notes</h3>
                <p style="margin-bottom: 0;">${reservationData.additionalNotes}</p>
              </div>
            ` : ''}
            
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
              <li>Notre équipe va étudier votre demande</li>
              <li>Nous vous contacterons sous 24h pour confirmer les détails</li>
              <li>Un prestataire qualifié sera assigné à votre demande</li>
            </ol>
            
            <p>Pour toute question, n'hésitez pas à nous contacter :</p>
            <ul>
              <li>Email: contact@bikawo.com</li>
              <li>Téléphone: 01 23 45 67 89</li>
            </ul>
            
            <p>Merci de faire confiance à Bikawo !</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              Bikawo - Services à domicile en Île-de-France<br>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        `,
      });

      console.log("Email client envoyé:", clientEmailResponse);
    }

    // Email pour l'équipe administrative
    const adminEmailResponse = await resend.emails.send({
      from: "Bikawo <contact@bikawo.com>",
      to: ["admin@bikawo.com"], // Remplacer par l'email admin réel
      subject: `🔔 Nouvelle demande de réservation - ${reservationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Nouvelle demande de réservation</h1>
          
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Réservation ${reservationId}</h2>
            <p><strong>Reçue le:</strong> ${new Date(reservationData.submittedAt).toLocaleString('fr-FR')}</p>
            <p><strong>Total estimé:</strong> ${reservationData.totalEstimated}€</p>
          </div>
          
          ${clientInfo ? `
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Informations client</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <p><strong>Nom:</strong> ${clientInfo.firstName} ${clientInfo.lastName}</p>
                <p><strong>Email:</strong> ${clientInfo.email}</p>
                <p><strong>Téléphone:</strong> ${clientInfo.phone}</p>
                ${clientInfo.company ? `<p><strong>Entreprise:</strong> ${clientInfo.company}</p>` : ''}
              </div>
            </div>
          ` : ''}
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Services demandés</h3>
            ${reservationData.items.map((item, index) => `
              <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                <h4 style="margin-top: 0; color: #1d4ed8;">${item.serviceName}</h4>
                <p><em>${item.packageTitle}</em></p>
                ${item.customBooking?.serviceType ? `<p><strong>Type:</strong> ${item.customBooking.serviceType}</p>` : ''}
                ${item.customBooking?.address ? `<p><strong>Adresse:</strong> ${item.customBooking.address}</p>` : ''}
                ${item.customBooking?.description ? `<p><strong>Description:</strong> ${item.customBooking.description}</p>` : ''}
                ${item.customBooking?.budget ? `<p><strong>Budget client:</strong> ${item.customBooking.budget}</p>` : ''}
                <p style="color: #059669; font-weight: bold;">Tarif: ${item.price}€/h</p>
              </div>
            `).join('')}
          </div>
          
          ${reservationData.additionalNotes ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Notes additionnelles du client</h3>
              <p>${reservationData.additionalNotes}</p>
            </div>
          ` : ''}
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #166534;">Actions à effectuer</h3>
            <ol style="text-align: left; margin: 0;">
              <li>Vérifier la disponibilité des prestataires</li>
              <li>Contacter le client sous 24h</li>
              <li>Assigner un prestataire qualifié</li>
              <li>Confirmer les détails et le tarif final</li>
            </ol>
          </div>
          
          <p style="text-align: center;">
            <a href="mailto:${clientInfo?.email || 'client'}" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Répondre au client
            </a>
          </p>
        </div>
      `,
    });

    console.log("Email admin envoyé:", adminEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notifications envoyées avec succès" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erreur lors de l'envoi des notifications:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur lors de l'envoi des notifications" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);