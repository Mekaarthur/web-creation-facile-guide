import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationAction {
  action: 'approve' | 'reject' | 'examine' | 'list_reports' | 'list_reviews';
  type?: 'review' | 'report';
  id?: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabasePublic.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Access denied: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, type, id, reason }: ModerationAction = await req.json();

    switch (action) {
      case 'list_reports':
        // Get reported content (simulated for now, you can add a reports table later)
        const reportedContent = [
          { id: 1, type: "Avis", user: "Marie D.", content: "Service décevant, prestataire...", reason: "Langage inapproprié", status: "pending" },
          { id: 2, type: "Profil", user: "Jean M.", content: "Description du prestataire", reason: "Informations trompeuses", status: "pending" },
          { id: 3, type: "Message", user: "Sophie L.", content: "Conversation client", reason: "Harcèlement", status: "reviewing" }
        ];
        
        return new Response(JSON.stringify({ success: true, data: reportedContent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list_reviews':
        // Get reviews pending moderation without relying on implicit FK joins
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, is_approved, client_id, provider_id, booking_id')
          .eq('is_approved', false);

        if (reviewsError) throw reviewsError;

        // Enrich reviews with client profile and provider info
        const enrichedReviews = await Promise.all(
          (reviews || []).map(async (r: any) => {
            const [{ data: client }, { data: provider }] = await Promise.all([
              supabase
                .from('profiles')
                .select('first_name, last_name, email, user_id')
                .eq('user_id', r.client_id)
                .maybeSingle(),
              supabase
                .from('providers')
                .select('business_name, user_id, id')
                .eq('id', r.provider_id)
                .maybeSingle(),
            ]);

            return {
              ...r,
              // Keep response shape compatible with previous nested keys
              profiles: client
                ? { first_name: client.first_name, last_name: client.last_name, email: client.email }
                : null,
              providers: provider
                ? { business_name: provider.business_name, user_id: provider.user_id }
                : null,
            };
          })
        );

        return new Response(JSON.stringify({ success: true, data: enrichedReviews }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });


      case 'approve':
        if (type === 'review' && id) {
          // Approve review
          const { error: updateError } = await supabase
            .from('reviews')
            .update({ 
              is_approved: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) throw updateError;

          // Log action
          await supabase.rpc('log_action', {
            p_entity_type: 'review',
            p_entity_id: id,
            p_action_type: 'approved',
            p_admin_comment: reason || 'Avis approuvé par modération'
          });

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Avis approuvé avec succès' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'reject':
        if (type === 'review' && id) {
          // Delete rejected review
          const { error: deleteError } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

          if (deleteError) throw deleteError;

          // Log action
          await supabase.rpc('log_action', {
            p_entity_type: 'review',
            p_entity_id: id,
            p_action_type: 'rejected',
            p_admin_comment: reason || 'Avis rejeté par modération'
          });

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Avis rejeté et supprimé' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'examine':
        // For examine action, fetch related entities without implicit FK joins
        if (type === 'review' && id) {
          const { data: baseReview, error: reviewError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (reviewError) throw reviewError;

          if (!baseReview) {
            return new Response(JSON.stringify({ success: true, data: null }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const [
            { data: client },
            { data: provider },
            { data: booking }
          ] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, email, user_id')
              .eq('user_id', baseReview.client_id)
              .maybeSingle(),
            supabase
              .from('providers')
              .select('business_name, user_id, id')
              .eq('id', baseReview.provider_id)
              .maybeSingle(),
            supabase
              .from('bookings')
              .select('booking_date, service_id, address')
              .eq('id', baseReview.booking_id)
              .maybeSingle(),
          ]);

          const result = {
            ...baseReview,
            profiles: client
              ? { first_name: client.first_name, last_name: client.last_name, email: client.email }
              : null,
            providers: provider
              ? { business_name: provider.business_name, user_id: provider.user_id }
              : null,
            bookings: booking
              ? { booking_date: booking.booking_date, service_id: booking.service_id, address: booking.address }
              : null,
          };

          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: 'Action not implemented' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin moderation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});