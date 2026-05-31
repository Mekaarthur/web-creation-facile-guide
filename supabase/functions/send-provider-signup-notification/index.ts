import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thin wrapper — delegates to send-modern-notification
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, first_name, last_name, services, type } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const notificationType = type === 'admin' ? 'provider_signup_admin' : 'provider_signup_candidate';
    const body = type === 'admin'
      ? {
          type: notificationType,
          recipient: { email: 'contact@bikawo.com', name: 'Admin Bikawo' },
          data: { clientName: `${first_name} ${last_name}`, contactEmail: email, services }
        }
      : {
          type: notificationType,
          recipient: { email, name: first_name, firstName: first_name },
          data: { services, clientName: `${first_name} ${last_name}` }
        };

    const res = await fetch(`${supabaseUrl}/functions/v1/send-modern-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
