import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from "../_shared/cors.ts";

// Rate-limiting: max 3 demandes par heure par IP
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 3;
const ipStore = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

function sanitize(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 500);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Trop de demandes. Réessayez dans 1 heure." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const company_name = sanitize(body.company_name);
  const contact_name = sanitize(body.contact_name);
  const contact_email = sanitize(body.contact_email);
  const address = sanitize(body.address);
  const city = sanitize(body.city);
  const postal_code = sanitize(body.postal_code);
  const service_type = sanitize(body.service_type);

  if (!company_name || !contact_name || !contact_email || !address || !city || !postal_code || !service_type) {
    return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(contact_email)) {
    return new Response(JSON.stringify({ error: "Email invalide" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const VALID_SERVICE_TYPES = [
    "menage-bureaux-small", "menage-bureaux-medium", "menage-bureaux-devis",
    "support-administratif", "assistance-dirigeants", "conciergerie-entreprise",
    "assistance-administrative-pro", "multi",
  ];
  if (!VALID_SERVICE_TYPES.includes(service_type)) {
    return new Response(JSON.stringify({ error: "Service invalide" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "one_time"];
  const frequency = typeof body.frequency === "string" && VALID_FREQUENCIES.includes(body.frequency)
    ? body.frequency : null;

  const surface_m2 = typeof body.surface_m2 === "number" && body.surface_m2 > 0
    ? Math.floor(body.surface_m2) : null;
  const employee_count = typeof body.employee_count === "number" && body.employee_count > 0
    ? Math.floor(body.employee_count) : null;
  const siret = typeof body.siret === "string" ? sanitize(body.siret) || null : null;
  const contact_phone = typeof body.contact_phone === "string" ? sanitize(body.contact_phone) || null : null;
  const message = typeof body.message === "string" ? sanitize(body.message).slice(0, 1000) || null : null;

  // Service role uniquement pour cette fonction (insertion admin)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Trouver ou créer le client entreprise (email = clé naturelle)
  const { data: existing } = await supabase
    .from("entreprise_clients")
    .select("id")
    .eq("contact_email", contact_email)
    .maybeSingle();

  let clientId: string;
  if (existing) {
    const { error: updateErr } = await supabase
      .from("entreprise_clients")
      .update({ company_name, siret, contact_name, contact_phone, address, city, postal_code, surface_m2, employee_count })
      .eq("id", existing.id);
    if (updateErr) {
      console.error("entreprise_clients update error:", updateErr);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour du client" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    clientId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("entreprise_clients")
      .insert({ company_name, siret, contact_name, contact_email, contact_phone, address, city, postal_code, surface_m2, employee_count, status: "prospect" })
      .select("id")
      .single();
    if (insertErr || !inserted) {
      console.error("entreprise_clients insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement du client" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    clientId = inserted.id;
  }

  // 2. Créer le devis — quote_number auto-généré par trigger DB
  const { data: quote, error: quoteErr } = await supabase
    .from("entreprise_quotes")
    .insert({
      client_id: clientId,
      service_type,
      frequency,
      surface_m2,
      notes: message,
      status: "draft",
    })
    .select("id, quote_number")
    .single();

  if (quoteErr || !quote) {
    console.error("entreprise_quotes insert error:", quoteErr);
    return new Response(JSON.stringify({ error: "Erreur lors de la création du devis" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Notification admin
  try {
    await supabase.from("admin_notifications").insert({
      type: "enterprise_quote_request",
      title: `Nouveau devis entreprise — ${company_name}`,
      message: `${contact_name} (${contact_email}) demande un devis pour ${service_type}. Référence : ${quote.quote_number}`,
      priority: "normal",
      metadata: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
        client_id: clientId,
        company_name,
        contact_email,
        service_type,
      },
    });
  } catch (notifErr) {
    // L'échec de notification ne bloque pas la réponse
    console.error("admin notification error:", notifErr);
  }

  // 4. Email de confirmation à l'entreprise via send-transactional-email
  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        to: contact_email,
        type: "enterprise_quote_received",
        data: {
          contact_name,
          company_name,
          quote_number: quote.quote_number,
          service_type,
        },
      },
    });
  } catch (emailErr) {
    console.error("confirmation email error:", emailErr);
  }

  return new Response(
    JSON.stringify({ success: true, quote_number: quote.quote_number }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
