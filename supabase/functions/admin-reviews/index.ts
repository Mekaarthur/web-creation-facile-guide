import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { action, ...requestData } = await req.json();
    console.log('Admin reviews action:', action, 'Data:', requestData);

    switch (action) {
      case 'list':
        return await listReviews(supabase, requestData);
      case 'approve':
        return await approveReview(supabase, requestData);
      case 'reject':
        return await rejectReview(supabase, requestData);
      case 'get_stats':
        return await getReviewStats(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-reviews:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function listReviews(supabase: any, { status = 'all', limit = 50, offset = 0 }: any) {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        punctuality_rating,
        quality_rating,
        comment,
        is_approved,
        created_at,
        booking_id,
        client_id,
        provider_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('is_approved', status === 'approved');
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    // Récupérer les infos supplémentaires pour chaque avis
    const enrichedReviews = await Promise.all(
      (reviews || []).map(async (review) => {
        // Client info
        const { data: client } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', review.client_id)
          .single();

        // Provider info
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name, user_id')
          .eq('id', review.provider_id)
          .single();

        return {
          ...review,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Client inconnu',
          client_email: client?.email || '',
          provider_name: provider?.business_name || 'Prestataire inconnu'
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, reviews: enrichedReviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du listage des avis:', error);
    throw error;
  }
}

async function approveReview(supabase: any, { reviewId, adminUserId }: any) {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'review',
        entity_id: reviewId,
        action_type: 'approve',
        description: 'Avis approuvé'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Avis approuvé avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'avis:', error);
    throw error;
  }
}

async function rejectReview(supabase: any, { reviewId, adminUserId, reason }: any) {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', reviewId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'review',
        entity_id: reviewId,
        action_type: 'reject',
        description: `Avis rejeté: ${reason || 'Aucune raison spécifiée'}`
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Avis rejeté avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du rejet de l\'avis:', error);
    throw error;
  }
}

async function getReviewStats(supabase: any, { timeRange = '30d' }: any) {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, is_approved, created_at')
      .gte('created_at', startDate.toISOString());

    const totalReviews = reviews?.length || 0;
    const approvedReviews = reviews?.filter(r => r.is_approved)?.length || 0;
    const pendingReviews = totalReviews - approvedReviews;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews 
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: totalReviews,
          approved: approvedReviews,
          pending: pendingReviews,
          average_rating: Math.round(averageRating * 10) / 10
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats avis:', error);
    throw error;
  }
}