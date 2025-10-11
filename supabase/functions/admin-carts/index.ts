import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

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
    const cartId = url.searchParams.get('cartId');

    if (req.method === "GET") {
      // Lister tous les paniers avec filtres
      const status = url.searchParams.get('status');
      const clientId = url.searchParams.get('clientId');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = supabaseClient
        .from('carts')
        .select(`
          *,
          profiles!carts_client_id_fkey(first_name, last_name),
          cart_items(
            id,
            service_id,
            quantity,
            unit_price,
            total_price,
            services(name)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (clientId) query = query.eq('client_id', clientId);

      const { data: carts, error } = await query;
      if (error) throw error;

      // Compter le total
      let countQuery = supabaseClient
        .from('carts')
        .select('*', { count: 'exact', head: true });

      if (status) countQuery = countQuery.eq('status', status);
      if (clientId) countQuery = countQuery.eq('client_id', clientId);

      const { count } = await countQuery;

      return new Response(JSON.stringify({ 
        carts, 
        pagination: { 
          page, 
          limit, 
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "validate") {
        // Valider un panier et créer les réservations
        if (!cartId) throw new Error("Cart ID required");

        // Utiliser la RPC pour validation et création des bookings
        const { data: result, error: validateError } = await supabaseClient
          .rpc('validate_cart_manually', {
            p_cart_id: cartId,
            p_admin_notes: body.notes || null
          });

        if (validateError) throw validateError;

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Panier validé - ${result.bookings_created} réservation(s) créée(s)`,
          data: result
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "expire") {
        // Expirer un panier
        if (!cartId) throw new Error("Cart ID required");

        const { data: cart, error: fetchError } = await supabaseClient
          .from('carts')
          .select('*')
          .eq('id', cartId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updatedCart, error: updateError } = await supabaseClient
          .from('carts')
          .update({ status: 'expiré', updated_at: new Date().toISOString() })
          .eq('id', cartId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Logger l'action admin
        await logAdminAction(
          user.id,
          'expire_cart',
          'cart',
          cartId,
          { status: cart.status },
          { status: 'expiré' },
          body.reason || 'Panier expiré par admin'
        );

        return new Response(JSON.stringify({ cart: updatedCart }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "expire-old") {
        // Expirer automatiquement les anciens paniers
        const { data: expiredCount } = await supabaseClient.rpc('expire_old_carts');

        return new Response(JSON.stringify({ expiredCount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    throw new Error("Invalid request");

  } catch (error) {
    console.error("Error in admin-carts function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});