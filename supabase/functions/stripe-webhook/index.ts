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

      // FIX 8 — Fallback: créer le booking si le client a fermé l'onglet avant /payment-success
      const { data: existingBookings } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .ilike('notes', `%stripe_session:${session.id}%`);

      if (!existingBookings || existingBookings.length === 0) {
        console.log(`Aucun booking pour session ${session.id} — fallback verify-payment (non-bloquant)`);
        // Fire-and-forget : ne pas await pour ne pas bloquer la réponse à Stripe (timeout 30s).
        // verify-payment peut prendre jusqu'à 15s avec URSSAF — on retourne 200 immédiatement.
        supabaseAdmin.functions.invoke('verify-payment', {
          body: { sessionId: session.id },
        }).then(() => {
          console.log(`Fallback verify-payment réussi pour session ${session.id}`);
        }).catch(async (fallbackErr) => {
          console.error('Erreur fallback verify-payment:', fallbackErr);
          await supabaseAdmin.functions.invoke('create-admin-notification', {
            body: {
              type: 'urgent',
              title: '⚠️ Booking manquant après paiement',
              message: `Paiement Stripe confirmé mais aucune réservation créée. Session: ${session.id}. Intervention manuelle requise.`,
              data: { session_id: session.id, amount: (session.amount_total ?? 0) / 100, customer_email: session.customer_details?.email },
              priority: 'urgent',
            },
          }).catch(() => {});
        });
      }

      // Notification admin paiement reçu
      await supabaseAdmin.functions.invoke('create-admin-notification', {
        body: {
          type: 'payment_success',
          title: '💰 Paiement reçu',
          message: `Nouveau paiement de ${((session.amount_total ?? 0) / 100).toFixed(2)}€ reçu via Stripe`,
          data: {
            session_id: session.id,
            amount: (session.amount_total ?? 0) / 100,
            customer_email: session.customer_details?.email,
          },
          priority: 'normal',
        },
      }).catch(() => {});
    }

    // Gérer les remboursements
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      // Idempotence : vérifier si ce remboursement a déjà été traité
      const { data: txRecord } = await supabaseAdmin
        .from('financial_transactions')
        .select('id, booking_id, payment_status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();

      if (txRecord?.payment_status === 'refunded') {
        console.log(`charge.refunded déjà traité pour paymentIntent ${paymentIntentId} — skip`);
      } else {
        // 1. Mettre à jour financial_transactions
        const { error: txError } = await supabaseAdmin
          .from('financial_transactions')
          .update({ payment_status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (txError) {
          console.error('Erreur mise à jour financial_transactions:', txError);
        }

        // 2. Mettre à jour le statut du booking
        if (txRecord?.booking_id) {
          const { error: bookingError } = await supabaseAdmin
            .from('bookings')
            .update({ status: 'refunded' })
            .eq('id', txRecord.booking_id);

          if (bookingError) {
            console.error('Erreur mise à jour booking status:', bookingError);
          } else {
            console.log(`Booking ${txRecord.booking_id} marqué refunded`);
          }

          // 3. Notifier le client par email
          try {
            const { data: booking } = await supabaseAdmin
              .from('bookings')
              .select('client_id, total_price, service_id')
              .eq('id', txRecord.booking_id)
              .maybeSingle();

            if (booking?.client_id) {
              const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('email, first_name, last_name')
                .eq('user_id', booking.client_id)
                .maybeSingle();

              if (profile?.email) {
                await supabaseAdmin.functions.invoke('send-transactional-email', {
                  body: {
                    type: 'refund_processed',
                    recipientEmail: profile.email,
                    recipientName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
                    data: {
                      clientName: profile.first_name || 'Client',
                      serviceName: 'votre réservation Bikawo',
                      refundAmount: charge.amount_refunded / 100,
                      originalAmount: booking.total_price || charge.amount / 100,
                      refundReason: 'Remboursement traité par Bikawo',
                    },
                  },
                });
                console.log(`Email refund_processed envoyé à ${profile.email}`);
              }
            }
          } catch (emailErr) {
            console.error('Erreur envoi email remboursement client (non bloquant):', emailErr);
          }
        }

        // 4. Notification admin
        await supabaseAdmin.functions.invoke('create-admin-notification', {
          body: {
            type: 'payment',
            title: '💸 Remboursement effectué',
            message: `Remboursement de ${(charge.amount_refunded / 100).toFixed(2)}€ pour paiement ${paymentIntentId}`,
            data: {
              charge_id: charge.id,
              payment_intent_id: paymentIntentId,
              amount_refunded: charge.amount_refunded / 100,
              booking_id: txRecord?.booking_id || null,
            },
            priority: 'high',
          },
        });
      }
    }

    // Gérer les litiges
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const disputePaymentIntentId = typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : (dispute.payment_intent as any)?.id ?? null;

      if (disputePaymentIntentId) {
        // 1. Trouver la transaction financière et le booking associé
        const { data: txRecord } = await supabaseAdmin
          .from('financial_transactions')
          .select('id, booking_id')
          .eq('stripe_payment_intent_id', disputePaymentIntentId)
          .maybeSingle();

        if (txRecord) {
          // 2. Marquer la transaction comme disputée
          await supabaseAdmin
            .from('financial_transactions')
            .update({ payment_status: 'disputed' })
            .eq('id', txRecord.id);

          // 3. Marquer le booking comme disputé
          if (txRecord.booking_id) {
            await supabaseAdmin
              .from('bookings')
              .update({ status: 'disputed' })
              .eq('id', txRecord.booking_id);
            console.log(`Booking ${txRecord.booking_id} marqué disputed`);
          }
        }
      }

      // 4. Notifier l'admin
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
