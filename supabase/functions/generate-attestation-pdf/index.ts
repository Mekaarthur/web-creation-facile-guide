import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

import { corsHeaders } from "../_shared/cors.ts";

// R-CLI-01: attestation fiscale SAP — document distinct de la facture
const BIKAWO_SIRET   = Deno.env.get("BIKAWO_SIRET")   ?? "À compléter";
const BIKAWO_ADDRESS = Deno.env.get("BIKAWO_ADDRESS")  ?? "Paris, France";
const BIKAWO_PHONE   = Deno.env.get("BIKAWO_PHONE")    ?? "06 09 08 53 90";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentification JWT obligatoire
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Vérifier l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Récupérer le booking avec jointures
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id, booking_date, start_time, end_time, total_price, address,
        status, client_id,
        services:service_id ( name, category, urssaf_eligible ),
        providers:provider_id ( business_name ),
        profiles:client_id ( first_name, last_name )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Réservation introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérification sécurité : le booking doit appartenir à l'utilisateur
    if (booking.client_id !== user.id) {
      return new Response(JSON.stringify({ error: "Accès interdit" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // R-CLI-01 : uniquement les bookings completed ET urssaf_eligible
    if (booking.status !== "completed") {
      return new Response(JSON.stringify({ error: "Attestation disponible uniquement pour les prestations terminées" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((booking.services as any)?.urssaf_eligible === false) {
      return new Response(JSON.stringify({ error: "Ce service n'est pas éligible au crédit d'impôt" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GÉNÉRATION PDF ────────────────────────────────────────────────
    const doc = new jsPDF();
    const pageW = 210;
    const margin = 20;

    const clientName = (() => {
      const p = booking.profiles as any;
      if (!p) return "Client";
      return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Client";
    })();

    const serviceName    = (booking.services as any)?.name     ?? "Service à la personne";
    const serviceCategory = (booking.services as any)?.category ?? "Services à la Personne";
    const providerName   = (booking.providers as any)?.business_name ?? "Prestataire Bikawo";

    const prestDate = new Date(booking.booking_date).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric"
    });
    const year = new Date(booking.booking_date).getFullYear();
    const amount = Number(booking.total_price ?? 0);
    const creditEstimate = (amount * 0.5).toFixed(2);

    // P5 — référence document unique
    const docRef = `ATT-${new Date().getFullYear()}-${bookingId.substring(0, 8).toUpperCase()}`;

    // P4 — date de génération
    const generationDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric"
    });

    // P8 — durée en heures
    const [sh, sm] = booking.start_time.split(":").map(Number);
    const [eh, em] = booking.end_time.split(":").map(Number);
    const durationHours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    const durationStr = Number.isInteger(durationHours)
      ? `${durationHours}h` : `${durationHours.toFixed(1)}h`;

    // ── EN-TÊTE BIKAWO ────────────────────────────────────────────────
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("BIKAWO", margin, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Services à la personne agréés", margin, 35);
    doc.text(BIKAWO_ADDRESS, margin, 41);
    doc.text(`SIRET : ${BIKAWO_SIRET}`, margin, 47);
    doc.text(`contact@bikawo.com  |  ${BIKAWO_PHONE}`, margin, 53);
    doc.text(`N° SAP : ${BIKAWO_SIRET}`, margin, 59); // P9

    // ── TITRE DU DOCUMENT ─────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("ATTESTATION FISCALE", pageW - margin - 80, 28);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Services à la Personne", pageW - margin - 80, 36);
    doc.text(`Année fiscale : ${year}`, pageW - margin - 80, 43);
    doc.setFontSize(8);
    doc.text(`Réf. : ${docRef}`, pageW - margin - 80, 50); // P5
    doc.text(`Généré le : ${generationDate}`, pageW - margin - 80, 56); // P4

    // ── SÉPARATEUR ────────────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 62, pageW - margin, 62);

    // ── CLIENT ────────────────────────────────────────────────────────
    let y = 72;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("BÉNÉFICIAIRE", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    y += 7;
    doc.text(clientName, margin, y);
    if (booking.address) {
      y += 6;
      const addrLines = doc.splitTextToSize(booking.address, 80);
      doc.text(addrLines, margin, y);
      y += (addrLines.length - 1) * 5;
    }

    // ── PRESTATAIRE ───────────────────────────────────────────────────
    const colRight = 120;
    let yr = 72;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("INTERVENANT", colRight, yr);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    yr += 7;
    doc.text(providerName, colRight, yr);

    // ── DÉTAILS PRESTATION ────────────────────────────────────────────
    const tableTop = Math.max(y, yr) + 16;

    doc.setFillColor(243, 244, 246);
    doc.rect(margin, tableTop - 6, pageW - 2 * margin, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("Prestation", margin + 2, tableTop);
    doc.text("Date", 100, tableTop);
    doc.text("Horaires", 135, tableTop);
    doc.text("Montant TTC", 167, tableTop);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const svcLines = doc.splitTextToSize(serviceName, 55);
    doc.text(svcLines, margin + 2, tableTop + 9);
    doc.text(prestDate, 100, tableTop + 9);
    if (booking.start_time && booking.end_time) {
      doc.text(
        `${booking.start_time.slice(0, 5)} – ${booking.end_time.slice(0, 5)}`,
        135, tableTop + 9
      );
      doc.text(durationStr, 135, tableTop + 16); // P8 — durée
    }
    doc.text(`${amount.toFixed(2)} €`, 167, tableTop + 9);

    // Catégorie SAP
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Catégorie : ${serviceCategory}`, margin + 2, tableTop + 17);

    // ── SÉPARATEUR ────────────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, tableTop + 22, pageW - margin, tableTop + 22);

    // ── CRÉDIT D'IMPÔT ESTIMÉ ─────────────────────────────────────────
    const creditY = tableTop + 34;
    doc.setFillColor(239, 246, 255);
    doc.rect(margin, creditY - 6, pageW - 2 * margin, 20, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text("Crédit d'impôt estimé (50%) :", margin + 4, creditY + 2);
    doc.setFontSize(13);
    doc.text(`${creditEstimate} €`, 160, creditY + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "À reporter dans votre déclaration de revenus (case 7DB ou équivalent).",
      margin + 4, creditY + 10
    );

    // ── MENTION LÉGALE ────────────────────────────────────────────────
    const legalY = creditY + 26;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, legalY - 4, pageW - 2 * margin, 24, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const legalText = doc.splitTextToSize(
      "Ce document atteste de la réalisation d'une prestation de service à la personne éligible " +
      "au crédit d'impôt de 50 % conformément à l'article 199 sexdecies du Code Général des Impôts. " +
      "TVA non applicable — Art. 261 D 4° du CGI (services à la personne agréés). " +
      "Conservez ce document pour votre déclaration fiscale.",
      pageW - 2 * margin - 8
    );
    doc.text(legalText, margin + 4, legalY + 4);

    // ── PIED DE PAGE ──────────────────────────────────────────────────
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
    const safeClient = clientName.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attestation-fiscale-${year}-${safeClient}-${docRef}.pdf"`,
      },
    });
  } catch (error) {
    console.error("generate-attestation-pdf error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
