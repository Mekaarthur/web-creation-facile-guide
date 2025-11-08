import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      clientInfo,
      services,
      preferredDate,
      preferredTime,
      totalAmount,
      notes
    } = await req.json();

    // Validate input
    if (!clientInfo || !services || services.length === 0 || !totalAmount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user (optional - can be anonymous)
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Create booking for each service
    const bookingResults = [];
    
    for (const service of services) {
      // Get service details
      const { data: serviceData, error: serviceError } = await supabaseClient
        .from('services')
        .select('id')
        .eq('name', service.serviceName)
        .eq('category', service.category)
        .single();

      if (serviceError) {
        console.error('Service not found:', serviceError);
        continue;
      }

      // Create the booking
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          client_id: user?.id || null,
          service_id: serviceData.id,
          booking_date: service.customBooking?.date || preferredDate,
          start_time: service.customBooking?.startTime || preferredTime || '09:00',
          end_time: service.customBooking?.endTime || '17:00',
          total_price: service.price * (service.customBooking?.hours || 2),
          address: clientInfo.address,
          notes: service.customBooking?.notes || notes,
          status: 'pending',
          custom_duration: service.customBooking?.hours || 2,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        continue;
      }

      bookingResults.push(booking);
      
      // Créer notification admin pour nouvelle réservation
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseAdmin.functions.invoke('create-admin-notification', {
        body: {
          type: 'booking',
          title: '📅 Nouvelle réservation',
          message: `${clientInfo.firstName} ${clientInfo.lastName} a réservé ${service.serviceName} pour ${service.price * (service.customBooking?.hours || 2)}€`,
          data: {
            booking_id: booking.id,
            client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
            client_email: clientInfo.email,
            service_name: service.serviceName,
            amount: service.price * (service.customBooking?.hours || 2)
          },
          priority: 'normal'
        }
      });
    }

    // Store client info in a separate table for anonymous bookings
    if (bookingResults.length > 0) {
      const { error: clientError } = await supabaseClient
        .from('client_requests')
        .insert({
          form_response_id: `booking-${Date.now()}`,
          client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
          client_email: clientInfo.email,
          client_phone: clientInfo.phone,
          service_type: services[0].packageTitle,
          service_description: services.map(s => s.serviceName).join(', '),
          location: clientInfo.address,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          additional_notes: notes,
          status: 'new',
        });

      if (clientError) {
        console.error('Error storing client request:', clientError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings: bookingResults,
        message: 'Réservation(s) créée(s) avec succès'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-booking function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
