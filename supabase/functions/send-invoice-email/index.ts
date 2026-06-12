import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from "../_shared/cors.ts";

// Thin wrapper — does DB lookup then delegates to send-modern-notification (invoice_generated)
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { invoice_id } = await req.json();

    if (!invoice_id) throw new Error("Invoice ID is required");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('id', invoice_id)
      .single();

    if (error || !invoice) throw new Error("Invoice not found");
    if (!invoice.profiles?.email) throw new Error("Client email not found");

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('fr-FR');

    const res = await fetch(`${supabaseUrl}/functions/v1/send-modern-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        type: 'invoice_generated',
        recipient: {
          email: invoice.profiles.email,
          name: `${invoice.profiles.first_name} ${invoice.profiles.last_name}`,
          firstName: invoice.profiles.first_name,
        },
        data: {
          invoiceNumber: invoice.invoice_number,
          bookingDate: invoiceDate,
          amount: invoice.total_amount,
        }
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({
      success: res.ok,
      invoice_number: invoice.invoice_number,
      ...result,
    }), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
