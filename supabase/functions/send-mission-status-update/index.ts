import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Edge Function: send-mission-status-update
 *
 * Notifie le client par email lorsqu'une mission change de statut clé :
 * - "in_progress" → la prestation a commencé
 * - "completed"   → la prestation est terminée (et déclenche send-review-request)
 *
 * Appelée :
 *  - manuellement depuis le frontend (mutations useUpdateMissionStatus)
 *  - automatiquement via un trigger DB (pg_net) sur bookings.status
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  bookingId: string;
  newStatus?: "in_progress" | "completed";
}

const FROM = "Bikawo <contact@bikawo.com>";
const SITE = Deno.env.get("SITE_URL") ?? "https://bikawo.com";

const renderEmail = (params: {
  clientName: string;
  serviceName: string;
  providerName: string;
  status: "in_progress" | "completed";
  bookingId: string;
}) => {
  const isStart = params.status === "in_progress";
  const title = isStart ? "Votre prestation a commencé" : "Votre prestation est terminée";
  const emoji = isStart ? "▶️" : "✅";
  const intro = isStart
    ? `${params.providerName} vient de démarrer votre prestation <strong>${params.serviceName}</strong>.`
    : `${params.providerName} a terminé votre prestation <strong>${params.serviceName}</strong>. Merci d'avoir fait confiance à Bikawo !`;
  const ctaLabel = isStart ? "Suivre la mission" : "Noter ma prestation";
  const ctaUrl = isStart
    ? `${SITE}/espace-personnel?tab=bookings&booking=${params.bookingId}`
    : `${SITE}/espace-personnel?tab=bookings&rate=${params.bookingId}`;

  return `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f4f4f7;margin:0;padding:24px;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px;color:#ffffff;text-align:center;">
          <h1 style="margin:0;font-size:24px;">${emoji} ${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;color:#1f2937;">
          <p style="font-size:16px;margin:0 0 16px;">Bonjour <strong>${params.clientName}</strong>,</p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${intro}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#667eea;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${ctaLabel}</a>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:24px 0 0;">Référence : ${params.bookingId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px;">
          Bikawo — La sérénité au quotidien<br/>
          <a href="${SITE}" style="color:#667eea;">bikawo.com</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = (await req.json()) as Payload;
    const { bookingId } = body;
    if (!bookingId) throw new Error("bookingId required");

    // Charge la réservation + client + service
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id, status, client_id, provider_id, service_id, booking_date")
      .eq("id", bookingId)
      .single();
    if (bookingErr || !booking) throw bookingErr ?? new Error("Booking introuvable");

    const status = (body.newStatus ?? booking.status) as Payload["newStatus"];
    if (status !== "in_progress" && status !== "completed") {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "status not transactional" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Coordonnées client (email via auth.users via service role)
    const { data: clientProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", booking.client_id)
      .maybeSingle();

    const { data: clientUser } = await supabaseAdmin.auth.admin.getUserById(booking.client_id);
    const clientEmail = clientUser?.user?.email;
    if (!clientEmail) throw new Error("Email client introuvable");

    // Service & prestataire
    const [{ data: service }, { data: provider }] = await Promise.all([
      supabaseAdmin.from("services").select("name").eq("id", booking.service_id).maybeSingle(),
      booking.provider_id
        ? supabaseAdmin
            .from("providers")
            .select("business_name, user_id")
            .eq("id", booking.provider_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    let providerName = provider?.business_name ?? "Votre prestataire";
    if (provider?.user_id) {
      const { data: providerProfile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", provider.user_id)
        .maybeSingle();
      if (providerProfile?.first_name) {
        providerName = `${providerProfile.first_name} ${providerProfile.last_name ?? ""}`.trim();
      }
    }

    const html = renderEmail({
      clientName: clientProfile?.first_name ?? "Client",
      serviceName: service?.name ?? "Prestation",
      providerName,
      status,
      bookingId,
    });

    const subject =
      status === "in_progress"
        ? "▶️ Votre prestation Bikawo a commencé"
        : "✅ Votre prestation Bikawo est terminée";

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: clientEmail, subject, html }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Resend error: ${errText}`);
    }

    // Trace pour le centre de communications
    await supabaseAdmin.from("communications").insert({
      type: "email",
      destinataire_id: booking.client_id,
      destinataire_email: clientEmail,
      sujet: subject,
      contenu: `mission-status:${status}:${bookingId}`,
      template_name: "mission-status-update",
      status: "sent",
      sent_at: new Date().toISOString(),
      related_entity_type: "booking",
      related_entity_id: bookingId,
    });

    // Si terminé : déclenche aussi la demande d'avis (best-effort)
    if (status === "completed" && booking.provider_id) {
      try {
        await supabaseAdmin.functions.invoke("send-review-request", {
          body: {
            bookingId,
            clientId: booking.client_id,
            providerId: booking.provider_id,
          },
        });
      } catch (e) {
        console.error("send-review-request invoke failed", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-mission-status-update error", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
