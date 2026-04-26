import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const clientName = `${invoice.profiles.first_name} ${invoice.profiles.last_name}`;
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('fr-FR');
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : null;

    const emailResult = await resend.emails.send({
      from: 'Bikawo - Votre assistant personnel au quotidien <contact@bikawo.com>',
      to: [invoice.profiles.email],
      subject: `Votre facture Bikawo n°${invoice.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Votre facture Bikawo</h2>
          <p>Bonjour ${clientName},</p>
          <p>Veuillez trouver ci-dessous les détails de votre facture :</p>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e40af;">Facture n°${invoice.invoice_number}</h3>
            <p><strong>Date :</strong> ${invoiceDate}</p>
            ${dueDate ? `<p><strong>Date d'échéance :</strong> ${dueDate}</p>` : ''}
            <p><strong>Montant total :</strong> ${invoice.total_amount}€ TTC</p>
            ${invoice.status === 'paid' ? '<p style="color: #16a34a;"><strong>Statut :</strong> Payée</p>' : '<p style="color: #d97706;"><strong>Statut :</strong> En attente de paiement</p>'}
          </div>

          <p>Pour toute question concernant cette facture, contactez-nous :</p>
          <p>📞 <strong>06 09 08 53 90</strong></p>
          <p>✉️ contact@bikawo.com</p>

          <p>Merci de votre confiance,<br>L'équipe Bikawo</p>
        </div>
      `,
    });

    if (emailResult.error) {
      throw new Error(`Erreur Resend: ${emailResult.error.message}`);
    }

    console.log('Invoice email sent for:', invoice.invoice_number);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email de facture envoyé',
      invoice_number: invoice.invoice_number,
      emailId: emailResult.data?.id
    }), {
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