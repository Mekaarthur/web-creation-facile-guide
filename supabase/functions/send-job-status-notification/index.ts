import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thin wrapper — delegates to send-modern-notification.
// Supports two calling patterns:
//   { email, firstName, lastName, oldStatus, newStatus, comments, language } — direct
//   { applicationId, status, adminComments } — DB lookup required
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const payload = await req.json();

    let email: string;
    let firstName: string;
    let lastName: string;
    let oldStatus: string | undefined;
    let newStatus: string;
    let comments: string | undefined;
    let language: string | undefined;

    if (payload.applicationId) {
      // DB-lookup pattern from ProvidersManagement
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: app, error } = await supabase
        .from('job_applications')
        .select('email, first_name, last_name, status')
        .eq('id', payload.applicationId)
        .single();
      if (error || !app) throw new Error('Application non trouvée');
      email = app.email;
      firstName = app.first_name;
      lastName = app.last_name;
      oldStatus = app.status;
      newStatus = payload.status;
      comments = payload.adminComments;
      language = 'fr';
    } else {
      email = payload.email;
      firstName = payload.firstName;
      lastName = payload.lastName;
      oldStatus = payload.oldStatus;
      newStatus = payload.newStatus;
      comments = payload.comments;
      language = payload.language;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/send-modern-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        type: 'job_status_update',
        recipient: { email, name: `${firstName} ${lastName}`, firstName },
        data: { oldStatus, newStatus, comments, language }
      }),
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
