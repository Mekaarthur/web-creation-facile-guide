import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`Webhook received: ${event.type}`);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Payment successful:", session.id);
      
      // Extract metadata from payment intent
      const paymentIntentId = session.payment_intent as string;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const metadata = paymentIntent.metadata;

      if (!metadata.clientInfo || !metadata.services) {
        console.error("Missing metadata in payment intent");
        return new Response(JSON.stringify({ error: "Missing metadata" }), { status: 400 });
      }

      const clientInfo = JSON.parse(metadata.clientInfo);
      const services = JSON.parse(metadata.services);
      const preferredDate = metadata.preferredDate;
      const preferredTime = metadata.preferredTime;
      const notes = metadata.notes;

      // Create Supabase client with service role
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Create bookings
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

        // Create the booking with payment_status = completed
        const { data: booking, error: bookingError } = await supabaseClient
          .from('bookings')
          .insert({
            service_id: serviceData.id,
            booking_date: service.customBooking?.date || preferredDate,
            start_time: service.customBooking?.startTime || preferredTime || '09:00',
            end_time: service.customBooking?.endTime || '17:00',
            total_price: service.price * (service.customBooking?.hours || 2),
            address: clientInfo.address,
            notes: service.customBooking?.notes || notes,
            status: 'confirmed',
            payment_status: 'completed',
            stripe_payment_intent_id: paymentIntentId,
            custom_duration: service.customBooking?.hours || 2,
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Error creating booking:', bookingError);
          continue;
        }

        bookingResults.push(booking);
      }

      // Store client request
      if (bookingResults.length > 0) {
        const bookingId = `BKW-${bookingResults[0].id}`;
        
        await supabaseClient
          .from('client_requests')
          .insert({
            form_response_id: `booking-${bookingResults[0].id}`,
            client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            service_type: services[0].packageTitle,
            service_description: services.map((s: any) => s.serviceName).join(', '),
            location: clientInfo.address,
            preferred_date: preferredDate,
            preferred_time: preferredTime,
            additional_notes: notes,
            status: 'confirmed',
          });

        // Send confirmation email
        await supabaseClient.functions.invoke('send-booking-confirmation', {
          body: {
            to: clientInfo.email,
            clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
            services: services.map((s: any) => ({
              serviceName: s.serviceName,
              packageTitle: s.packageTitle,
              price: s.price
            })),
            bookingId,
            preferredDate,
            totalAmount: session.amount_total ? session.amount_total / 100 : 0
          }
        });
      }

      console.log(`Created ${bookingResults.length} bookings for payment ${paymentIntentId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});