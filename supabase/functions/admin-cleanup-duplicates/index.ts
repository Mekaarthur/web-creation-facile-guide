import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Accès refusé - Admin uniquement');
    }

    const { bookingIds } = await req.json();

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new Error('IDs de réservations manquants');
    }

    console.log('Suppression des doublons:', bookingIds);

    // Supprimer les réservations
    const { data: deletedBookings, error: deleteError } = await supabaseClient
      .from('bookings')
      .delete()
      .in('id', bookingIds)
      .select();

    if (deleteError) {
      console.error('Erreur suppression:', deleteError);
      throw deleteError;
    }

    // Logger l'action admin
    await supabaseClient
      .from('admin_actions_log')
      .insert({
        admin_user_id: user.id,
        entity_type: 'bookings',
        entity_id: bookingIds[0],
        action_type: 'delete_duplicates',
        description: `Suppression de ${bookingIds.length} réservations dupliquées`,
        old_data: deletedBookings,
      });

    console.log('Doublons supprimés avec succès:', deletedBookings?.length);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedBookings?.length || 0,
        bookings: deletedBookings,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
