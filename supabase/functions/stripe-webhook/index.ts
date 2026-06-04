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
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret!
    );

    console.log(`Webhook reçu: ${event.type}`);

    // Gérer l'événement checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`Paiement complété pour session: ${session.id}`);
      
      // Créer une notification admin générique pour le paiement
      // Note: Les bookings et factures sont créés par verify-payment, pas ici
      await supabaseAdmin.functions.invoke('create-admin-notification', {
        body: {
          type: 'payment_success',
          title: '💰 Paiement reçu',
          message: `Nouveau paiement de ${(session.amount_total! / 100).toFixed(2)}€ reçu via Stripe`,
          data: {
            session_id: session.id,
            amount: session.amount_total! / 100,
            customer_email: session.customer_details?.email
          },
          priority: 'normal'
        }
      });
    }

    // Gérer les remboursements
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      // Mettre à jour financial_transactions via stripe_payment_intent_id
      const { error: txError } = await supabaseAdmin
        .from('financial_transactions')
        .update({ payment_status: 'refunded' })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (txError) {
        console.error('Erreur mise à jour financial_transactions:', txError);
      }

      // Créer notification admin pour remboursement
      await supabaseAdmin.functions.invoke('create-admin-notification', {
        body: {
          type: 'payment',
          title: '💸 Remboursement effectué',
          message: `Remboursement de ${(charge.amount_refunded / 100).toFixed(2)}€ pour paiement ${paymentIntentId}`,
          data: {
            charge_id: charge.id,
            payment_intent_id: paymentIntentId,
            amount_refunded: charge.amount_refunded / 100
          },
          priority: 'high'
        }
      });
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


async function notifyAdminDispute(dispute: any, supabase: any) {
  // Créer une notification admin pour le litige
  await supabase.functions.invoke('create-admin-notification', {
    body: {
      type: 'system',
      title: '⚠️ Litige Stripe détecté',
      message: `Un litige a été créé pour le paiement ${dispute.charge}. Montant: ${dispute.amount / 100}€`,
      data: { 
        dispute_id: dispute.id, 
        charge_id: dispute.charge,
        amount: dispute.amount / 100
      },
      priority: 'urgent'
    }
  });
  
  console.log(`Litige détecté: ${dispute.id}`);
}
