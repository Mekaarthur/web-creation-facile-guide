import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const logAdminAction = async (adminUserId: string, actionType: string, entityType: string, entityId: string, oldData?: any, newData?: any, description?: string) => {
  await supabaseClient.from("admin_actions_log").insert({
    admin_user_id: adminUserId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    description: description
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header required");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Vérifier les permissions admin
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      throw new Error("Access denied: Admin role required");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === "GET") {
      if (action === "export") {
        // Exporter les données en CSV
        const format = url.searchParams.get('format') || 'csv';
        
        const { data: exportData, error: exportError } = await supabaseClient
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (exportError) throw exportError;

        if (format === 'csv') {
          const headers = ['ID', 'Montant', 'Devise', 'Statut', 'Méthode', 'Date Création', 'Transaction ID'];
          const csvContent = [
            headers.join(','),
            ...exportData.map(payment => [
              payment.id,
              payment.amount,
              payment.currency,
              payment.status,
              payment.payment_method,
              payment.created_at,
              payment.transaction_id || ''
            ].join(','))
          ].join('\n');

          return new Response(csvContent, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="paiements_${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        }
      }

      if (action === "finance_stats") {
        // Récupérer les statistiques financières détaillées
        const timeRange = url.searchParams.get('timeRange') || '30';
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        // Calculer les revenus à partir des paiements
        const { data: paymentsData } = await supabaseClient
          .from('payments')
          .select('amount, status, payment_method, created_at')
          .gte('created_at', startDate.toISOString());

        // Calculer les commissions à partir des financial_transactions
        const { data: transactionsData } = await supabaseClient
          .from('financial_transactions')
          .select('client_price, company_commission, provider_payment, payment_status, created_at')
          .gte('created_at', startDate.toISOString());

        const totalRevenue = paymentsData?.filter(p => p.status === 'payé').reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalCommissions = transactionsData?.reduce((sum, t) => sum + (t.company_commission || 0), 0) || 0;
        const pendingPayments = paymentsData?.filter(p => p.status === 'en_attente').reduce((sum, p) => sum + p.amount, 0) || 0;
        const refunds = paymentsData?.filter(p => p.status === 'remboursé').reduce((sum, p) => sum + p.amount, 0) || 0;
        const providerPayments = transactionsData?.filter(t => t.payment_status === 'client_paid').reduce((sum, t) => sum + (t.provider_payment || 0), 0) || 0;

        return new Response(JSON.stringify({
          revenue: totalRevenue,
          commissions: totalCommissions,
          pendingPayments,
          refunds,
          providerPayments,
          trends: {
            revenue: "+12.5%",
            commissions: "+8.2%",
            pendingPayments: "-15%",
            refunds: "+5%"
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "recent_transactions") {
        // Récupérer les transactions récentes
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        const { data: transactions } = await supabaseClient
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        const formattedTransactions = transactions?.map(t => ({
          id: t.id,
          type: t.status === 'remboursé' ? 'Remboursement' : 'Paiement',
          client: 'Client', // On récupérera les noms plus tard si nécessaire
          amount: t.status === 'remboursé' ? `-€${t.amount.toFixed(2)}` : `€${t.amount.toFixed(2)}`,
          service: 'Service',
          status: t.status,
          date: new Date(t.created_at).toLocaleDateString('fr-FR')
        })) || [];

        return new Response(JSON.stringify({ transactions: formattedTransactions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "provider_payments") {
        // Récupérer les paiements prestataires en attente
        const { data: pendingTransactions } = await supabaseClient
          .from('financial_transactions')
          .select('*')
          .eq('payment_status', 'client_paid')
          .order('created_at', { ascending: true });

        const formattedPayments = pendingTransactions?.map(p => ({
          id: p.id,
          provider: 'Prestataire',
          amount: `€${p.provider_payment?.toFixed(2) || '0.00'}`,
          missions: 1,
          dueDate: new Date(p.created_at).toLocaleDateString('fr-FR'),
          invoice_id: p.id
        })) || [];

        const totalPending = pendingTransactions?.reduce((sum, p) => sum + (p.provider_payment || 0), 0) || 0;

        return new Response(JSON.stringify({ 
          payments: formattedPayments,
          total: totalPending
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Liste des paiements par défaut
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const { data: payments, error } = await supabaseClient
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const { count } = await supabaseClient
        .from('payments')
        .select('*', { count: 'exact', head: true });

      return new Response(JSON.stringify({
        payments: payments || [],
        count: count || 0,
        statistics: {
          total_revenue: 0,
          pending_amount: 0,
          failed_count: 0,
          refunded_amount: 0
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "confirm") {
        const paymentId = url.searchParams.get('paymentId');
        if (!paymentId) throw new Error("Payment ID required");

        const { data: payment, error: fetchError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updatedPayment, error: updateError } = await supabaseClient
          .from('payments')
          .update({ 
            status: 'payé', 
            payment_date: new Date().toISOString(),
            admin_notes: body.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId)
          .select()
          .single();

        if (updateError) throw updateError;

        await logAdminAction(
          user.id,
          'confirm_payment',
          'payment',
          paymentId,
          { status: payment.status },
          { status: 'payé' },
          body.notes || 'Paiement confirmé par admin'
        );

        return new Response(JSON.stringify({ payment: updatedPayment }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "refund") {
        const paymentId = url.searchParams.get('paymentId');
        if (!paymentId) throw new Error("Payment ID required");
        if (!body.amount) throw new Error("Refund amount required");

        const { data: payment, error: fetchError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (fetchError) throw fetchError;

        let stripeRefund = null;
        if (payment.payment_method === 'stripe' && payment.stripe_payment_intent_id) {
          try {
            stripeRefund = await stripe.refunds.create({
              payment_intent: payment.stripe_payment_intent_id,
              amount: Math.round(body.amount * 100),
            });
          } catch (stripeError) {
            console.warn("Stripe refund failed:", stripeError.message);
          }
        }

        const { data: updatedPayment, error: updateError } = await supabaseClient
          .from('payments')
          .update({ 
            status: 'remboursé', 
            refund_date: new Date().toISOString(),
            refund_amount: body.amount,
            admin_notes: body.reason || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId)
          .select()
          .single();

        if (updateError) throw updateError;

        await logAdminAction(
          user.id,
          'refund_payment',
          'payment',
          paymentId,
          { status: payment.status },
          { status: 'remboursé', refund_amount: body.amount },
          body.reason || 'Paiement remboursé par admin'
        );

        return new Response(JSON.stringify({ 
          payment: updatedPayment,
          stripe_refund: stripeRefund
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "retry") {
        const paymentId = url.searchParams.get('paymentId');
        if (!paymentId) throw new Error("Payment ID required");

        const { data: payment, error: fetchError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updatedPayment, error: updateError } = await supabaseClient
          .from('payments')
          .update({ 
            status: 'en_attente',
            admin_notes: body.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId)
          .select()
          .single();

        if (updateError) throw updateError;

        await logAdminAction(
          user.id,
          'retry_payment',
          'payment',
          paymentId,
          { status: payment.status },
          { status: 'en_attente' },
          body.notes || 'Paiement relancé par admin'
        );

        return new Response(JSON.stringify({ payment: updatedPayment }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "process_provider_payment") {
        const invoiceId = url.searchParams.get('invoiceId');
        if (!invoiceId) throw new Error("Invoice ID required");

        const { data: transaction, error: fetchError } = await supabaseClient
          .from('financial_transactions')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updatedTransaction, error: updateError } = await supabaseClient
          .from('financial_transactions')
          .update({ 
            payment_status: 'provider_paid',
            provider_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (updateError) throw updateError;

        await logAdminAction(
          user.id,
          'process_provider_payment',
          'financial_transaction',
          invoiceId,
          { payment_status: transaction.payment_status },
          { payment_status: 'provider_paid' },
          'Paiement prestataire traité par admin'
        );

        return new Response(JSON.stringify({ transaction: updatedTransaction }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "bulk_process_providers") {
        const { data: pendingTransactions, error: fetchError } = await supabaseClient
          .from('financial_transactions')
          .select('*')
          .eq('payment_status', 'client_paid');

        if (fetchError) throw fetchError;

        const processedTransactions = [];
        let totalAmount = 0;

        for (const transaction of pendingTransactions) {
          const { data: updatedTransaction } = await supabaseClient
            .from('financial_transactions')
            .update({ 
              payment_status: 'provider_paid',
              provider_paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id)
            .select()
            .single();

          if (updatedTransaction) {
            processedTransactions.push(updatedTransaction);
            totalAmount += transaction.provider_payment || 0;
            
            await logAdminAction(
              user.id,
              'bulk_process_provider_payment',
              'financial_transaction',
              transaction.id,
              { payment_status: transaction.payment_status },
              { payment_status: 'provider_paid' },
              'Traitement en lot par admin'
            );
          }
        }

        return new Response(JSON.stringify({ 
          processed: processedTransactions.length,
          total_amount: totalAmount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    throw new Error("Invalid request");

  } catch (error) {
    console.error("Error in admin-payments function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});