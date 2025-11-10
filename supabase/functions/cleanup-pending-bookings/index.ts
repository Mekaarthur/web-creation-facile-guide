import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Nettoyage des réservations pending non payées...');

    // Trouver les bookings pending créés il y a plus de 2 heures
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: oldPendingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, created_at, client_name, service_name')
      .eq('status', 'pending')
      .is('stripe_payment_intent_id', null)
      .lt('created_at', twoHoursAgo);

    if (fetchError) {
      console.error('Erreur lors de la recherche des bookings:', fetchError);
      throw fetchError;
    }

    if (!oldPendingBookings || oldPendingBookings.length === 0) {
      console.log('✅ Aucune réservation pending à nettoyer');
      return new Response(
        JSON.stringify({ 
          success: true, 
          cleaned: 0,
          message: 'Aucune réservation pending à nettoyer'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📋 ${oldPendingBookings.length} réservations pending trouvées`);

    // Supprimer ces bookings
    const bookingIds = oldPendingBookings.map(b => b.id);
    
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
      throw deleteError;
    }

    // Logger l'action
    oldPendingBookings.forEach(booking => {
      console.log(`  ✓ Supprimé: ${booking.service_name} - ${booking.client_name} (créé le ${new Date(booking.created_at).toLocaleString('fr-FR')})`);
    });

    console.log(`✅ ${oldPendingBookings.length} réservations pending nettoyées`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: oldPendingBookings.length,
        bookings: oldPendingBookings.map(b => ({
          id: b.id,
          service_name: b.service_name,
          client_name: b.client_name,
          created_at: b.created_at
        })),
        message: `${oldPendingBookings.length} réservations pending nettoyées`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
