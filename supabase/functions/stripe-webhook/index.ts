import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret!
    );

    console.log(`Webhook reçu: ${event.type}`);

    // Gérer l'événement checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Récupérer les détails de la session
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string
      );

      // Récupérer la réservation associée via metadata
      const bookingId = session.metadata?.booking_id;
      
      if (bookingId) {
        // Mettre à jour la facture client
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (invoice) {
          const { error: updateError } = await supabaseAdmin
            .from('invoices')
            .update({
              status: 'paid',
              payment_date: new Date().toISOString(),
              stripe_payment_id: paymentIntent.id
            })
            .eq('id', invoice.id);

          if (updateError) {
            console.error('Erreur mise à jour facture:', updateError);
          } else {
            console.log('Facture mise à jour:', invoice.invoice_number);
            
            // Envoyer email de confirmation au client
            await sendInvoiceEmail(invoice, supabaseAdmin);
          }
        }

        // Mettre à jour la transaction financière
        const { error: transactionError } = await supabaseAdmin
          .from('financial_transactions')
          .update({
            payment_status: 'paid',
            payment_date: new Date().toISOString()
          })
          .eq('booking_id', bookingId);

        if (transactionError) {
          console.error('Erreur mise à jour transaction:', transactionError);
        }
      }
    }

    // Gérer les remboursements
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      // Mettre à jour la facture
      const { error } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'refunded'
        })
        .eq('stripe_payment_id', paymentIntentId);

      if (error) {
        console.error('Erreur mise à jour remboursement:', error);
      }
    }

    // Gérer les litiges
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      
      // Notifier l'admin
      await notifyAdminDispute(dispute, supabaseAdmin);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function sendInvoiceEmail(invoice: any, supabase: any) {
  // TODO: Implémenter l'envoi d'email avec Resend ou autre service
  // Pour l'instant, on enregistre dans les logs
  console.log(`Email à envoyer pour facture ${invoice.invoice_number}`);
  
  // Exemple avec Resend (à configurer):
  // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  // await resend.emails.send({
  //   from: 'facturation@bikawo.com',
  //   to: invoice.client_email,
  //   subject: `Votre facture Bikawo ${invoice.invoice_number}`,
  //   html: `...template HTML...`
  // });
}

async function notifyAdminDispute(dispute: any, supabase: any) {
  // Créer une notification pour l'admin
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: 'admin', // ID de l'admin
      type: 'dispute',
      title: 'Litige Stripe détecté',
      message: `Un litige a été créé pour le paiement ${dispute.charge}. Montant: ${dispute.amount / 100}€`,
      data: { dispute_id: dispute.id, charge_id: dispute.charge }
    });

  if (error) {
    console.error('Erreur création notification:', error);
  }
  
  console.log(`Litige détecté: ${dispute.id}`);
}
