import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thin wrapper — delegates to send-modern-notification
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { bookingId, clientEmail, description, serviceName, bookingDate } = await req.json();

    if (!bookingId || !description || description.trim().length < 10) {
      return new Response(JSON.stringify({ success: false, error: "Données invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/send-modern-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        type: 'anomaly_report',
        recipient: { email: 'contact@bikawo.com', name: 'Admin Bikawo' },
        data: { bookingId, serviceName, bookingDate, description: description.trim(), contactEmail: clientEmail }
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
