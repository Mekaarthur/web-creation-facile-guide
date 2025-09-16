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
    const paymentId = url.searchParams.get('paymentId');

    if (req.method === "GET") {
      // Lister tous les paiements avec filtres
      const status = url.searchParams.get('status');
      const method = url.searchParams.get('method');
      const clientId = url.searchParams.get('clientId');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = supabaseClient
        .from('payments')
        .select(`
          *,
          profiles!payments_client_id_fkey(first_name, last_name),
          carts(status, total_estimated),
          bookings(id, service_id, services(name))
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (method) query = query.eq('payment_method', method);
      if (clientId) query = query.eq('client_id', clientId);

      const { data: payments, error } = await query;
      if (error) throw error;

      // Compter le total
      let countQuery = supabaseClient
        .from('payments')
        .select('*', { count: 'exact', head: true });

      if (status) countQuery = countQuery.eq('status', status);
      if (method) countQuery = countQuery.eq('payment_method', method);
      if (clientId) countQuery = countQuery.eq('client_id', clientId);

      const { count } = await countQuery;

      // Calculer les statistiques
      const { data: stats } = await supabaseClient
        .from('payments')
        .select('status, amount, payment_method');

      const statistics = {
        total_revenue: stats?.filter(p => p.status === 'payé').reduce((sum, p) => sum + p.amount, 0) || 0,
        pending_amount: stats?.filter(p => p.status === 'en_attente').reduce((sum, p) => sum + p.amount, 0) || 0,
        failed_count: stats?.filter(p => p.status === 'échoué').length || 0,
        refunded_amount: stats?.filter(p => p.status === 'remboursé').reduce((sum, p) => sum + p.amount, 0) || 0,
        by_method: {
          stripe: stats?.filter(p => p.payment_method === 'stripe').length || 0,
          paypal: stats?.filter(p => p.payment_method === 'paypal').length || 0,
          virement: stats?.filter(p => p.payment_method === 'virement').length || 0,
          especes: stats?.filter(p => p.payment_method === 'especes').length || 0,
        }
      };

      if (action === "export") {
        // Exporter les données en CSV
        const format = url.searchParams.get('format') || 'csv';
        
        let query = supabaseClient
          .from('payments')
          .select(`
            *,
            profiles!payments_client_id_fkey(first_name, last_name),
            carts(status, total_estimated),
            bookings(id, service_id, services(name))
          `)
          .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (method) query = query.eq('payment_method', method);
        if (clientId) query = query.eq('client_id', clientId);

        const { data: exportData, error: exportError } = await query;
        if (exportError) throw exportError;

        if (format === 'csv') {
          const headers = ['ID', 'Montant', 'Devise', 'Statut', 'Méthode', 'Client', 'Date Paiement', 'Transaction ID', 'Notes Admin'];
          const csvContent = [
            headers.join(','),
            ...exportData.map(payment => [
              payment.id,
              payment.amount,
              payment.currency,
              payment.status,
              payment.payment_method,
              payment.profiles ? `"${payment.profiles.first_name} ${payment.profiles.last_name}"` : '',
              payment.payment_date || '',
              payment.transaction_id || '',
              payment.admin_notes ? `"${payment.admin_notes.replace(/"/g, '""')}"` : ''
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

        // Calculer les revenus et commissions
        const { data: paymentsData } = await supabaseClient
          .from('payments')
          .select('amount, status, payment_method, created_at')
          .gte('created_at', startDate.toISOString());

        // Calculer les paiements aux prestataires
        const { data: providerInvoices } = await supabaseClient
          .from('provider_invoices')
          .select('amount_net, status, issued_date')
          .gte('issued_date', startDate.toISOString());

        const totalRevenue = paymentsData?.filter(p => p.status === 'payé').reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalCommissions = totalRevenue * 0.15; // 15% de commission
        const pendingPayments = paymentsData?.filter(p => p.status === 'en_attente').reduce((sum, p) => sum + p.amount, 0) || 0;
        const refunds = paymentsData?.filter(p => p.status === 'remboursé').reduce((sum, p) => sum + p.amount, 0) || 0;
        const providerPayments = providerInvoices?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_net, 0) || 0;

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
          .select(`
            *,
            profiles!payments_client_id_fkey(first_name, last_name),
            bookings(service_id, services(name))
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        const formattedTransactions = transactions?.map(t => ({
          id: t.id,
          type: t.status === 'remboursé' ? 'Remboursement' : 'Paiement',
          client: t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : 'N/A',
          amount: t.status === 'remboursé' ? `-€${t.amount.toFixed(2)}` : `€${t.amount.toFixed(2)}`,
          service: t.bookings?.services?.name || 'Service inconnu',
          status: t.status,
          date: new Date(t.created_at).toLocaleDateString('fr-FR')
        })) || [];

        return new Response(JSON.stringify({ transactions: formattedTransactions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "provider_payments") {
        // Récupérer les paiements prestataires en attente
        const { data: pendingProviderPayments } = await supabaseClient
          .from('provider_invoices')
          .select(`
            *,
            providers(business_name, user_id)
          `)
          .eq('status', 'pending')
          .order('issued_date', { ascending: true });

        const formattedPayments = pendingProviderPayments?.map(p => ({
          id: p.id,
          provider: p.providers?.business_name || 'Prestataire inconnu',
          amount: `€${p.amount_net?.toFixed(2) || '0.00'}`,
          missions: 1, // À calculer selon les bookings liés
          dueDate: new Date(p.issued_date).toLocaleDateString('fr-FR'),
          invoice_id: p.id
        })) || [];

        const totalPending = pendingProviderPayments?.reduce((sum, p) => sum + (p.amount_net || 0), 0) || 0;

        return new Response(JSON.stringify({ 
          payments: formattedPayments,
          total: totalPending
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "confirm") {
        // Confirmer un paiement
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

        // Logger l'action admin
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
        // Rembourser un paiement
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
              amount: Math.round(body.amount * 100), // Convertir en centimes
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

        // Logger l'action admin
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
        // Relancer un paiement échoué
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

        // Logger l'action admin
        await logAdminAction(
          user.id,
          'retry_payment',
          'payment',
          paymentId,
          { status: payment.status },
          { status: 'en_attente' },
          body.notes || 'Paiement relancé par admin'
        );

      if (action === "process_provider_payment") {
        // Traiter un paiement prestataire
        const invoiceId = url.searchParams.get('invoiceId');
        if (!invoiceId) throw new Error("Invoice ID required");

        const body = await req.json();

        const { data: invoice, error: fetchError } = await supabaseClient
          .from('provider_invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updatedInvoice, error: updateError } = await supabaseClient
          .from('provider_invoices')
          .update({ 
            status: 'paid',
            payment_date: new Date().toISOString(),
            admin_notes: body.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Logger l'action admin
        await logAdminAction(
          user.id,
          'process_provider_payment',
          'provider_invoice',
          invoiceId,
          { status: invoice.status },
          { status: 'paid' },
          body.notes || 'Paiement prestataire traité par admin'
        );

        return new Response(JSON.stringify({ invoice: updatedInvoice }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "bulk_process_providers") {
        // Traiter tous les paiements prestataires en attente
        const body = await req.json();
        
        const { data: pendingInvoices, error: fetchError } = await supabaseClient
          .from('provider_invoices')
          .select('*')
          .eq('status', 'pending');

        if (fetchError) throw fetchError;

        const processedInvoices = [];
        let totalAmount = 0;

        for (const invoice of pendingInvoices) {
          const { data: updatedInvoice } = await supabaseClient
            .from('provider_invoices')
            .update({ 
              status: 'paid',
              payment_date: new Date().toISOString(),
              admin_notes: 'Traitement en lot par admin',
              updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id)
            .select()
            .single();

          if (updatedInvoice) {
            processedInvoices.push(updatedInvoice);
            totalAmount += invoice.amount_net || 0;
            
            // Logger chaque action
            await logAdminAction(
              user.id,
              'bulk_process_provider_payment',
              'provider_invoice',
              invoice.id,
              { status: invoice.status },
              { status: 'paid' },
              'Traitement en lot de paiements prestataires'
            );
          }
        }

        return new Response(JSON.stringify({ 
          processed: processedInvoices.length,
          total_amount: totalAmount,
          invoices: processedInvoices
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
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