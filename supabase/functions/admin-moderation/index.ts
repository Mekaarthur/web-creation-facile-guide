import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationAction {
  action: 'approve' | 'reject' | 'examine' | 'list_reports' | 'list_reviews' | 'get_stats';
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
      case 'get_stats':
        // Obtenir les statistiques de modération en temps réel
        const { data: stats } = await supabase.rpc('calculate_moderation_stats');
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: stats || {
            open_reports: 0,
            pending_reviews: 0,
            suspended_users: 0,
            weekly_actions: 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'list_reports':
        // Obtenir les vrais signalements depuis la base de données
        const { data: reports, error: reportsError } = await supabase
          .from('content_reports')
          .select(`
            id,
            reported_content_type,
            reported_content_id,
            report_reason,
            report_category,
            additional_details,
            status,
            created_at,
            reported_by
          `)
          .in('status', ['pending', 'reviewing'])
          .order('created_at', { ascending: false });

        if (reportsError) throw reportsError;

        // Enrichir avec les informations du rapporteur
        const enrichedReports = await Promise.all(
          (reports || []).map(async (report: any) => {
            const { data: reporter } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', report.reported_by)
              .maybeSingle();

            return {
              id: report.id,
              type: report.reported_content_type,
              user: reporter 
                ? `${reporter.first_name} ${reporter.last_name}`
                : 'Utilisateur inconnu',
              content: `Contenu ${report.reported_content_type} signalé`,
              reason: report.report_reason,
              status: report.status,
              details: report.additional_details,
              created_at: report.created_at
            };
          })
        );
        
        return new Response(JSON.stringify({ success: true, data: enrichedReports }), {
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
        } else if (type === 'report' && id) {
          // Approve report - mark as resolved/dismissed
          const { error: updateError } = await supabase
            .from('content_reports')
            .update({ 
              status: 'resolved',
              resolved_by: user.id,
              resolved_at: new Date().toISOString(),
              resolution_notes: reason || 'Signalement approuvé - pas d\'action nécessaire',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) throw updateError;

          // Log action
          await supabase.rpc('log_action', {
            p_entity_type: 'content_report',
            p_entity_id: id,
            p_action_type: 'approved',
            p_admin_comment: reason || 'Signalement approuvé par modération'
          });

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Signalement approuvé - aucune action nécessaire' 
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
        } else if (type === 'report' && id) {
          // Reject report - take action on reported content
          const { data: report } = await supabase
            .from('content_reports')
            .select('reported_content_type, reported_content_id')
            .eq('id', id)
            .maybeSingle();

          if (report) {
            // Mark the reported content based on type
            if (report.reported_content_type === 'review') {
              await supabase
                .from('reviews')
                .update({ is_approved: false })
                .eq('id', report.reported_content_id);
            } else if (report.reported_content_type === 'provider') {
              await supabase
                .from('providers')
                .update({ status: 'suspended' })
                .eq('id', report.reported_content_id);
            }
          }

          // Update report status
          const { error: updateError } = await supabase
            .from('content_reports')
            .update({ 
              status: 'resolved',
              resolved_by: user.id,
              resolved_at: new Date().toISOString(),
              resolution_notes: reason || 'Signalement traité - action prise',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) throw updateError;

          // Log action
          await supabase.rpc('log_action', {
            p_entity_type: 'content_report',
            p_entity_id: id,
            p_action_type: 'rejected',
            p_admin_comment: reason || 'Signalement traité - contenu modéré'
          });

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Signalement traité - action prise sur le contenu' 
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
        } else if (type === 'report' && id) {
          // Examine report - get detailed report information
          const { data: baseReport, error: reportError } = await supabase
            .from('content_reports')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (reportError) throw reportError;

          if (!baseReport) {
            return new Response(JSON.stringify({ success: true, data: null }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Get reporter info and reported content details
          const [
            { data: reporter },
            reportedContentData
          ] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, email, user_id')
              .eq('user_id', baseReport.reported_by)
              .maybeSingle(),
            // Get reported content based on type
            baseReport.reported_content_type === 'review'
              ? supabase
                  .from('reviews')
                  .select('rating, comment, client_id, provider_id')
                  .eq('id', baseReport.reported_content_id)
                  .maybeSingle()
              : baseReport.reported_content_type === 'provider'
              ? supabase
                  .from('providers')
                  .select('business_name, description, user_id')
                  .eq('id', baseReport.reported_content_id)
                  .maybeSingle()
              : { data: null }
          ]);

          const result = {
            ...baseReport,
            reporter: reporter
              ? { first_name: reporter.first_name, last_name: reporter.last_name, email: reporter.email }
              : null,
            reported_content_details: reportedContentData.data,
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