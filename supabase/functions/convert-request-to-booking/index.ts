import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConvertRequestParams {
  requestId: string;
  providerId: string;
  serviceId: string;
  estimatedPrice?: number;
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

    const { requestId, providerId, serviceId, estimatedPrice = 0 }: ConvertRequestParams = await req.json();
    console.log('Converting request to booking:', { requestId, providerId, serviceId });

    // Get the original request details
    const { data: requestData, error: requestError } = await supabaseClient
      .from('client_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'new')
      .single();

    if (requestError || !requestData) {
      throw new Error('Request not found or already processed');
    }

    // Check if client profile exists, create if not
    let clientId = null;
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', requestData.client_email)
      .single();

    if (existingProfile) {
      clientId = existingProfile.user_id;
    } else {
      // Create a temporary client profile for external requests
      // In a real scenario, you'd want to create a proper user account
      console.log('Client profile not found, using system user');
      clientId = null; // Will be handled in the booking creation
    }

    // Use the database function to create booking
    const { data: bookingId, error: conversionError } = await supabaseClient
      .rpc('create_booking_from_request', {
        request_id: requestId,
        provider_id: providerId,
        service_id: serviceId
      });

    if (conversionError) {
      console.error('Error converting request:', conversionError);
      throw conversionError;
    }

    // Update the booking with estimated price if provided
    if (estimatedPrice > 0) {
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ total_price: estimatedPrice })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking price:', updateError);
      }
    }

    // Create notification for the provider
    const { data: providerData } = await supabaseClient
      .from('providers')
      .select('id')
      .eq('id', providerId)
      .single();

    if (providerData) {
      await supabaseClient
        .from('provider_notifications')
        .insert({
          provider_id: providerId,
          title: 'Nouvelle mission assignée',
          message: `Mission créée depuis une demande client pour ${requestData.service_type}`,
          type: 'mission',
          booking_id: bookingId
        });
    }

    // Send email notification to client (if email is configured)
    try {
      await supabaseClient.functions.invoke('send-notification-email', {
        body: {
          to: requestData.client_email,
          subject: 'Votre demande a été prise en charge',
          template: 'booking_confirmation',
          data: {
            client_name: requestData.client_name,
            service_type: requestData.service_type,
            booking_id: bookingId,
            estimated_price: estimatedPrice
          }
        }
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the entire process if email fails
    }

    console.log('Successfully converted request to booking:', bookingId);

    return new Response(
      JSON.stringify({ 
        success: true,
        booking_id: bookingId,
        message: 'Request successfully converted to booking',
        client_email: requestData.client_email,
        service_type: requestData.service_type
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Conversion error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to convert request to booking',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});