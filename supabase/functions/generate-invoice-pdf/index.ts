import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get invoice ID from query parameters
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Fetch invoice details
    const { data: invoice, error } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        profiles:client_id (first_name, last_name),
        bookings:booking_id (
          booking_date,
          start_time,
          end_time,
          address,
          services:service_id (name)
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error("Invoice not found");
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Header with Bikawo logo and info
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185); // Primary blue
    doc.text("BIKAWO", 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Services à domicile", 20, 40);
    doc.text("contact@bikawo.com", 20, 50);
    doc.text("www.bikawo.com", 20, 60);

    // Invoice title and number
    doc.setFontSize(16);
    doc.text("FACTURE", 140, 30);
    doc.setFontSize(10);
    doc.text(`N° ${invoice.invoice_number}`, 140, 40);
    doc.text(`Date: ${new Date(invoice.issued_date).toLocaleDateString('fr-FR')}`, 140, 50);
    doc.text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, 140, 60);

    // Client information
    doc.setFontSize(12);
    doc.text("Facturé à:", 20, 80);
    doc.setFontSize(10);
    const clientName = invoice.profiles ? 
      `${invoice.profiles.first_name} ${invoice.profiles.last_name}` : 
      'Client';
    doc.text(clientName, 20, 90);

    // Service details
    doc.setFontSize(12);
    doc.text("Détails de la prestation:", 20, 110);
    
    doc.setFontSize(10);
    if (invoice.bookings) {
      doc.text(`Service: ${invoice.bookings.services?.name || 'Service'}`, 20, 120);
      doc.text(`Date: ${new Date(invoice.bookings.booking_date).toLocaleDateString('fr-FR')}`, 20, 130);
      doc.text(`Adresse: ${invoice.bookings.address || 'Non spécifiée'}`, 20, 140);
    }
    doc.text(`Description: ${invoice.service_description}`, 20, 150);

    // Amount details
    const amountHT = invoice.amount / 1.20; // Assuming 20% VAT
    const tvaAmount = invoice.amount - amountHT;

    doc.line(20, 170, 190, 170); // Horizontal line
    
    doc.text("Montant HT:", 120, 180);
    doc.text(`${amountHT.toFixed(2)} €`, 160, 180);
    
    doc.text("TVA (20%):", 120, 190);
    doc.text(`${tvaAmount.toFixed(2)} €`, 160, 190);
    
    doc.setFontSize(12);
    doc.text("Total TTC:", 120, 200);
    doc.text(`${invoice.amount.toFixed(2)} €`, 160, 200);

    // Footer
    doc.setFontSize(8);
    doc.text("Conditions générales disponibles sur www.bikawo.com", 20, 250);
    doc.text("Crédit d'impôt de 50% applicable selon conditions.", 20, 260);

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});