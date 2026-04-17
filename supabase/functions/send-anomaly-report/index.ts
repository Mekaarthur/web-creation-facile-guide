import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface Payload {
  bookingId: string;
  clientEmail?: string;
  description: string;
  serviceName?: string;
  bookingDate?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.bookingId || !body?.description || body.description.trim().length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Données invalides" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
        <h2 style="color:#0f172a;">⚠️ Nouveau signalement d'anomalie</h2>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr><td style="padding:8px; border-bottom:1px solid #e5e7eb;"><strong>Réservation</strong></td><td style="padding:8px; border-bottom:1px solid #e5e7eb;">${body.bookingId}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #e5e7eb;"><strong>Service</strong></td><td style="padding:8px; border-bottom:1px solid #e5e7eb;">${body.serviceName || '—'}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #e5e7eb;"><strong>Date</strong></td><td style="padding:8px; border-bottom:1px solid #e5e7eb;">${body.bookingDate || '—'}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #e5e7eb;"><strong>Client</strong></td><td style="padding:8px; border-bottom:1px solid #e5e7eb;">${body.clientEmail || '—'}</td></tr>
        </table>
        <h3 style="color:#0f172a;">Description :</h3>
        <p style="background:#f9fafb; padding:15px; border-radius:8px; border-left:4px solid #ef4444; white-space:pre-wrap;">${body.description.replace(/</g, '&lt;')}</p>
        <p style="color:#6b7280; font-size:12px; margin-top:20px;">
          Délai de réponse engagé : 48h ouvrées.<br/>
          Cet email a été envoyé automatiquement depuis l'espace client Bikawo.
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "Bikawo Support <noreply@bikawo.com>",
      to: ["contact@bikawo.com"],
      replyTo: body.clientEmail,
      subject: `⚠️ Signalement anomalie – ${body.serviceName || 'Prestation'}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Échec d'envoi" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Erreur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
