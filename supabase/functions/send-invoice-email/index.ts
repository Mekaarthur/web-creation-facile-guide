import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id } = await req.json();
    
    if (!invoice_id) {
      throw new Error("Invoice ID is required");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch invoice details with client email
    const { data: invoice, error } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        profiles:client_id (first_name, last_name, email)
      `)
      .eq('id', invoice_id)
      .single();

    if (error || !invoice) {
      throw new Error("Invoice not found");
    }

    if (!invoice.profiles?.email) {
      throw new Error("Client email not found");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const clientName = `${invoice.profiles.first_name} ${invoice.profiles.last_name}`;
    const downloadUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-invoice-pdf?id=${invoice.id}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Bikawo <contact@bikawo.com>",
      to: [invoice.profiles.email],
      subject: `Votre facture Bikawo ${invoice.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2980b9;">Votre facture Bikawo</h2>
          
          <p>Bonjour ${clientName},</p>
          
          <p>Votre facture pour la prestation réalisée est maintenant disponible.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de la facture</h3>
            <ul>
              <li><strong>Numéro:</strong> ${invoice.invoice_number}</li>
              <li><strong>Montant:</strong> ${invoice.amount.toFixed(2)} €</li>
              <li><strong>Date d'émission:</strong> ${new Date(invoice.issued_date).toLocaleDateString('fr-FR')}</li>
              <li><strong>Date d'échéance:</strong> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</li>
            </ul>
          </div>
          
          <p>
            <a href="${downloadUrl}" 
               style="background-color: #2980b9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Télécharger la facture (PDF)
            </a>
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Crédit d'impôt:</strong> Cette prestation peut bénéficier d'un crédit d'impôt de 50% selon les conditions en vigueur.
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 40px;">
            Merci de votre confiance,<br>
            L'équipe Bikawo<br>
            contact@bikawo.com
          </p>
        </div>
      `,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending invoice email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});