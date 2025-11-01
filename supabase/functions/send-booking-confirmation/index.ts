import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, clientName, services, bookingId, preferredDate, totalAmount } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const servicesHtml = services.map((service: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${service.serviceName}</strong><br/>
          <small style="color: #666;">${service.packageTitle}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${service.price}€
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Réservation Confirmée !</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-top: 0;">Bonjour <strong>${clientName}</strong>,</p>
            
            <p>Nous avons bien reçu votre demande de réservation. Notre équipe va l'examiner et vous contactera sous <strong>24 heures</strong> pour confirmer les détails.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">📋 Détails de votre réservation</h2>
              <p><strong>Référence :</strong> ${bookingId}</p>
              <p><strong>Date souhaitée :</strong> ${new Date(preferredDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0;">Services réservés</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${servicesHtml}
                <tr>
                  <td style="padding: 12px; padding-top: 20px;"><strong>Total estimé</strong></td>
                  <td style="padding: 12px; padding-top: 20px; text-align: right; font-size: 20px; color: #667eea;"><strong>${totalAmount}€</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Un conseiller vous contactera pour confirmer les détails</li>
                <li>Le tarif final sera confirmé par notre équipe</li>
                <li>Les services ont une durée minimum de 2 heures</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p>Pour toute question urgente, contactez-nous au :</p>
              <p style="font-size: 20px; color: #667eea; font-weight: bold;">06 09 08 53 90</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Merci de votre confiance !<br/>
                L'équipe Bikawo
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Bikawo <noreply@bikawo.fr>',
        to: [to],
        subject: `✅ Réservation confirmée - ${bookingId}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
