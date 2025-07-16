import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleFormResponse {
  formId: string;
  responseId: string;
  answers: Record<string, string>;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const payload: GoogleFormResponse = await req.json();
    console.log('Received Google Forms response:', payload);

    // Extract form data based on expected question structure
    const clientRequest = {
      form_response_id: payload.responseId,
      client_name: payload.answers['Nom complet'] || payload.answers['name'] || '',
      client_email: payload.answers['Email'] || payload.answers['email'] || '',
      client_phone: payload.answers['Téléphone'] || payload.answers['phone'] || '',
      service_type: payload.answers['Type de service'] || payload.answers['service_type'] || '',
      service_description: payload.answers['Description du service'] || payload.answers['description'] || '',
      preferred_date: payload.answers['Date souhaitée'] || payload.answers['preferred_date'] || null,
      preferred_time: payload.answers['Heure préférée'] || payload.answers['preferred_time'] || '',
      budget_range: payload.answers['Budget'] || payload.answers['budget'] || '',
      location: payload.answers['Lieu'] || payload.answers['location'] || '',
      urgency_level: payload.answers['Urgence'] || payload.answers['urgency'] || 'normal',
      additional_notes: payload.answers['Notes additionnelles'] || payload.answers['notes'] || '',
      status: 'new'
    };

    // Insert the client request into the database
    const { data, error } = await supabaseClient
      .from('client_requests')
      .insert([clientRequest])
      .select()
      .single();

    if (error) {
      console.error('Error inserting client request:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save client request' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Client request saved successfully:', data);

    // Optional: Send notification to providers about new request
    // This could be implemented later with email or push notifications

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Client request received and processed',
        requestId: data.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});