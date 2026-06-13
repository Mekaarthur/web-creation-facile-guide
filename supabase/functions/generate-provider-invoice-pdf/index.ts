// ============================================================================
// ⚠️ SOLUTION TRANSITOIRE — À remplacer par l'intégration NeedMe
//
// Ce générateur de fiches de rémunération est temporaire. Les documents
// officiels (bulletins de salaire, fiches de paie) doivent être émis par
// NeedMe (organisme mandataire) une fois l'intégration API finalisée.
// ============================================================================
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const BIKAWO_SIRET   = Deno.env.get("BIKAWO_SIRET")   ?? "À compléter";
const BIKAWO_ADDRESS = Deno.env.get("BIKAWO_ADDRESS")  ?? "Paris, France";
const BIKAWO_PHONE   = Deno.env.get("BIKAWO_PHONE")    ?? "À compléter";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider invoice — RLS ensures provider can only access their own
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select(`
        *,
        providers:provider_id (
          business_name,
          user_id,
          siret_number
        ),
        bookings:booking_id (
          booking_date,
          start_time,
          end_time,
          address,
          services:service_id (name)
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider profile for name
    let providerName = invoice.providers?.business_name || "Prestataire";
    if (invoice.providers?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", invoice.providers.user_id)
        .maybeSingle();
      if (profile) {
        providerName = invoice.providers.business_name ||
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
      }
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("BIKAWO", 20, 28);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Services à domicile", 20, 36);
    doc.text(BIKAWO_ADDRESS, 20, 44);
    doc.text(`SIRET : ${BIKAWO_SIRET}  |  ${BIKAWO_PHONE}`, 20, 52);
    doc.text("contact@bikawo.com — www.bikawo.com", 20, 58);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text("FICHE DE RÉMUNÉRATION", 120, 28);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`N° ${invoice.invoice_number}`, 120, 38);
    doc.text(`Émise le : ${new Date(invoice.issued_date).toLocaleDateString("fr-FR")}`, 120, 46);

    // Provider info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Prestataire :", 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(providerName, 20, 73);
    if (invoice.providers?.siret_number) {
      doc.text(`SIRET : ${invoice.providers.siret_number}`, 20, 81);
    }

    // Mission details
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Détails de la mission :", 20, 100);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    if (invoice.bookings) {
      doc.text(
        `Service : ${invoice.bookings.services?.name || "Service à domicile"}`,
        20, 110
      );
      doc.text(
        `Date : ${new Date(invoice.bookings.booking_date).toLocaleDateString("fr-FR")}`,
        20, 118
      );
      doc.text(
        `Horaires : ${invoice.bookings.start_time} — ${invoice.bookings.end_time}`,
        20, 126
      );
      doc.text(`Lieu : ${invoice.bookings.address || "Non spécifié"}`, 20, 134);
    }

    // Amounts
    doc.line(20, 155, 190, 155);
    doc.setFontSize(10);
    doc.text("Montant brut :", 20, 165);
    doc.text(`${Number(invoice.amount_brut ?? 0).toFixed(2)} €`, 160, 165);

    if (invoice.tva_amount) {
      doc.text("TVA :", 20, 173);
      doc.text(`${Number(invoice.tva_amount).toFixed(2)} €`, 160, 173);
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Montant net versé :", 20, 188);
    doc.text(`${Number(invoice.amount_net ?? 0).toFixed(2)} €`, 160, 188);
    doc.setFont("helvetica", "normal");

    if (invoice.payment_date) {
      doc.setFontSize(10);
      doc.text(
        `Versement le : ${new Date(invoice.payment_date).toLocaleDateString("fr-FR")}`,
        20, 200
      );
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Bikawo — ${BIKAWO_ADDRESS} — SIRET : ${BIKAWO_SIRET} — contact@bikawo.com`, 20, 260);

    const pdfBuffer = doc.output("arraybuffer");

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fiche-remuneration-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating provider invoice PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
