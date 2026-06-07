import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Informations légales Bikawo — configurable via secrets Supabase
const BIKAWO_SIRET    = Deno.env.get("BIKAWO_SIRET")    ?? "À compléter";
const BIKAWO_ADDRESS  = Deno.env.get("BIKAWO_ADDRESS")  ?? "Paris, France";
const BIKAWO_PHONE    = Deno.env.get("BIKAWO_PHONE")    ?? "06 09 08 53 90";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        profiles:client_id (first_name, last_name, phone),
        bookings:booking_id (
          booking_date,
          start_time,
          end_time,
          address,
          custom_duration,
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

    const doc = new jsPDF();
    const pageW = 210;
    const margin = 20;

    // ── ÉMETTEUR (vendeur) ─────────────────────────────────────────
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Bikawo blue
    doc.text("BIKAWO", margin, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Services à la personne agréés", margin, 35);
    doc.text(BIKAWO_ADDRESS, margin, 41);
    doc.text(`SIRET : ${BIKAWO_SIRET}`, margin, 47);
    doc.text(`contact@bikawo.com  |  ${BIKAWO_PHONE}`, margin, 53);
    doc.text("www.bikawo.com", margin, 59);

    // ── EN-TÊTE FACTURE ────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("FACTURE", pageW - margin - 50, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const issuedDate = new Date(invoice.issued_date).toLocaleDateString("fr-FR");
    const dueDate    = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("fr-FR")
      : issuedDate;
    doc.text(`N° : ${invoice.invoice_number}`, pageW - margin - 50, 36);
    doc.text(`Date d'émission : ${issuedDate}`, pageW - margin - 50, 42);
    doc.text(`Date d'échéance : ${dueDate}`, pageW - margin - 50, 48);

    // ── LIGNE SÉPARATRICE ──────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 67, pageW - margin, 67);

    // ── CLIENT ────────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("FACTURÉ À", margin, 76);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const clientName = invoice.profiles
      ? `${invoice.profiles.first_name ?? ""} ${invoice.profiles.last_name ?? ""}`.trim()
      : "Client";
    doc.text(clientName, margin, 83);
    if (invoice.bookings?.address) {
      const addrLines = doc.splitTextToSize(invoice.bookings.address, 80);
      doc.text(addrLines, margin, 89);
    }

    // ── DÉTAILS PRESTATION ────────────────────────────────────────
    const tableTop = 108;
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, tableTop - 6, pageW - 2 * margin, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("Description", margin + 2, tableTop);
    doc.text("Date", 110, tableTop);
    doc.text("Durée", 145, tableTop);
    doc.text("Montant HT", 170, tableTop);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const serviceName = invoice.bookings?.services?.name ?? invoice.service_description ?? "Service à domicile";
    const serviceLines = doc.splitTextToSize(serviceName, 60);
    doc.text(serviceLines, margin + 2, tableTop + 9);

    if (invoice.bookings?.booking_date) {
      const prestDate = new Date(invoice.bookings.booking_date).toLocaleDateString("fr-FR");
      doc.text(prestDate, 110, tableTop + 9);
    }
    if (invoice.bookings?.custom_duration) {
      doc.text(`${invoice.bookings.custom_duration}h`, 145, tableTop + 9);
    } else if (invoice.bookings?.start_time && invoice.bookings?.end_time) {
      doc.text(`${invoice.bookings.start_time}–${invoice.bookings.end_time}`, 145, tableTop + 9);
    }

    const amountHT = Number(invoice.amount ?? 0);
    doc.text(`${amountHT.toFixed(2)} €`, 170, tableTop + 9);

    // ── LIGNE SÉPARATRICE ──────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, tableTop + 20, pageW - margin, tableTop + 20);

    // ── TVA & TOTAUX ──────────────────────────────────────────────
    const totalsX  = 140;
    const totalsX2 = 180;
    let   totalsY  = tableTop + 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Total HT :", totalsX, totalsY);
    doc.text(`${amountHT.toFixed(2)} €`, totalsX2, totalsY, { align: "right" });

    totalsY += 7;
    doc.text("TVA :", totalsX, totalsY);
    doc.text("0,00 € *", totalsX2, totalsY, { align: "right" });

    totalsY += 7;
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, totalsY - 2, pageW - margin, totalsY - 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Total TTC :", totalsX, totalsY + 6);
    doc.text(`${amountHT.toFixed(2)} €`, totalsX2, totalsY + 6, { align: "right" });

    // ── MENTIONS LÉGALES SAP ──────────────────────────────────────
    const legalY = totalsY + 22;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "* TVA non applicable — Art. 261 D 4° du CGI (services à la personne agréés).",
      margin, legalY
    );

    // ── CRÉDIT D'IMPÔT ────────────────────────────────────────────
    const creditY = legalY + 10;
    doc.setFillColor(239, 246, 255);
    doc.rect(margin, creditY - 4, pageW - 2 * margin, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text(
      "Crédit d'impôt services à domicile : 50 % des dépenses engagées sont déductibles",
      margin + 3, creditY + 2
    );
    doc.text(
      "de votre impôt sur le revenu (Art. 199 sexdecies CGI). Conservez cette facture.",
      margin + 3, creditY + 7
    );

    // ── CONDITIONS DE RÈGLEMENT ───────────────────────────────────
    const condY = creditY + 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("Conditions de règlement", margin, condY);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Paiement effectué en ligne au moment de la réservation. En cas de retard de paiement,",
      margin, condY + 6
    );
    doc.text(
      "des pénalités de retard au taux légal en vigueur seront appliquées (Art. L441-6 C. com.).",
      margin, condY + 11
    );
    doc.text(
      "Indemnité forfaitaire de recouvrement : 40 € (Décret n°2012-1115).",
      margin, condY + 16
    );

    // ── PIED DE PAGE ──────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 272, pageW - margin, 272);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Bikawo — ${BIKAWO_ADDRESS} — SIRET : ${BIKAWO_SIRET} — contact@bikawo.com`,
      pageW / 2, 277, { align: "center" }
    );

    const pdfBuffer = doc.output("arraybuffer");

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
