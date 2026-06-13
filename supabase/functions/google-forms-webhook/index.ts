import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

interface GoogleFormResponse {
  formId: string;
  responseId: string;
  answers: Record<string, string>;
  timestamp: string;
  secret?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("GOOGLE_FORMS_WEBHOOK_SECRET");

    // Validate webhook secret if configured (required in production)
    const headerSecret = req.headers.get("x-webhook-secret");
    const payload: GoogleFormResponse = await req.json();
    const bodySecret = payload.secret;

    if (webhookSecret) {
      const providedSecret = headerSecret || bodySecret;
      if (!providedSecret || providedSecret !== webhookSecret) {
        console.error('[google-forms-webhook] Unauthorized: invalid or missing webhook secret');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate required fields
    if (!payload.responseId || !payload.answers) {
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientEmail = payload.answers['Email'] || payload.answers['email'] || '';
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientRequest = {
      form_response_id: payload.responseId,
      client_name: (payload.answers['Nom complet'] || payload.answers['name'] || '').substring(0, 255),
      client_email: clientEmail.substring(0, 255),
      client_phone: (payload.answers['Téléphone'] || payload.answers['phone'] || '').substring(0, 50),
      service_type: (payload.answers['Type de service'] || payload.answers['service_type'] || '').substring(0, 100),
      service_description: (payload.answers['Description du service'] || payload.answers['description'] || '').substring(0, 2000),
      preferred_date: payload.answers['Date souhaitée'] || payload.answers['preferred_date'] || null,
      preferred_time: (payload.answers['Heure préférée'] || payload.answers['preferred_time'] || '').substring(0, 50),
      budget_range: (payload.answers['Budget'] || payload.answers['budget'] || '').substring(0, 100),
      location: (payload.answers['Lieu'] || payload.answers['location'] || '').substring(0, 500),
      urgency_level: (payload.answers['Urgence'] || payload.answers['urgency'] || 'normal').substring(0, 50),
      additional_notes: (payload.answers['Notes additionnelles'] || payload.answers['notes'] || '').substring(0, 2000),
      status: 'new'
    };

    const { data, error } = await supabaseClient
      .from('client_requests')
      .insert([clientRequest])
      .select()
      .single();

    if (error) {
      console.error('Error inserting client request:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save client request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Client request saved successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Client request received and processed', requestId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
