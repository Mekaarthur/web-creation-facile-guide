import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Admin access required");

    const { action, transactionId, transactionIds } = await req.json();

    if (action === "transfer_single") {
      const result = await processTransfer(stripe, supabaseClient, transactionId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "transfer_bulk") {
      const ids = transactionIds as string[];
      const results = [];
      let successCount = 0;
      let failCount = 0;
      let totalAmount = 0;

      for (const id of ids) {
        try {
          const result = await processTransfer(stripe, supabaseClient, id);
          results.push({ id, ...result });
          if (result.success) {
            successCount++;
            totalAmount += result.amount || 0;
          } else {
            failCount++;
          }
        } catch (e) {
          results.push({ id, success: false, error: e.message });
          failCount++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        successCount,
        failCount,
        totalAmount,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "mark_manual_paid") {
      // Mark as manually paid (bank transfer)
      const { error } = await supabaseClient
        .from("financial_transactions")
        .update({
          payment_status: "provider_paid",
          provider_paid_at: new Date().toISOString(),
          paid_via: "manual",
        })
        .eq("id", transactionId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("Transfer error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processTransfer(stripe: any, supabase: any, transactionId: string) {
  // Get transaction with provider info
  const { data: transaction, error } = await supabase
    .from("financial_transactions")
    .select("*, provider:providers(id, stripe_account_id, stripe_onboarding_complete, business_name)")
    .eq("id", transactionId)
    .single();

  if (error || !transaction) {
    return { success: false, error: "Transaction not found" };
  }

  if (transaction.payment_status === "provider_paid") {
    return { success: false, error: "Already paid" };
  }

  const provider = (transaction as any).provider;

  if (!provider?.stripe_account_id || !provider?.stripe_onboarding_complete) {
    return {
      success: false,
      error: `Provider ${provider?.business_name || 'unknown'} has no Stripe Connect account`,
    };
  }

  const amountInCents = Math.round(transaction.provider_payment * 100);

  // Create transfer to connected account
  const transfer = await stripe.transfers.create({
    amount: amountInCents,
    currency: "eur",
    destination: provider.stripe_account_id,
    description: `Paiement mission - Transaction ${transactionId}`,
    metadata: {
      transaction_id: transactionId,
      booking_id: transaction.booking_id,
      provider_id: provider.id,
    },
  });

  console.log("Transfer created:", transfer.id);

  // Update transaction
  await supabase
    .from("financial_transactions")
    .update({
      payment_status: "provider_paid",
      provider_paid_at: new Date().toISOString(),
      paid_via: "stripe_connect",
    })
    .eq("id", transactionId);

  return {
    success: true,
    transferId: transfer.id,
    amount: transaction.provider_payment,
    provider: provider.business_name,
  };
}
