import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// import { Resend } from "npm:resend@2.0.0";

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

    // Email service temporarily disabled
    console.log('Email service temporarily disabled for invoice:', invoice.invoice_number);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email service temporarily disabled',
      invoice_number: invoice.invoice_number
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