import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchProvidersRequest {
  serviceType: string;
  location: string;
  urgency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { serviceType, location, urgency = 'normal' }: MatchProvidersRequest = await req.json();
    console.log('Matching providers for:', { serviceType, location, urgency });

    // Get matching providers using our function
    const { data: matchingProviders, error: matchError } = await supabaseClient
      .rpc('get_matching_providers', {
        p_service_type: serviceType,
        p_location: location,
        p_limit: urgency === 'urgent' ? 10 : 5
      });

    if (matchError) {
      console.error('Error matching providers:', matchError);
      throw matchError;
    }

    // Get recent client requests for context
    const { data: recentRequests, error: requestsError } = await supabaseClient
      .from('client_requests')
      .select('*')
      .eq('status', 'new')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      console.error('Error getting recent requests:', requestsError);
    }

    // Calculate demand metrics
    const demandMetrics = {
      total_requests_24h: recentRequests?.length || 0,
      service_demand: recentRequests?.filter(r => 
        r.service_type.toLowerCase().includes(serviceType.toLowerCase())
      ).length || 0,
      location_demand: recentRequests?.filter(r => 
        r.location.toLowerCase().includes(location.toLowerCase())
      ).length || 0
    };

    // Enhance provider matching with additional scoring
    const enhancedProviders = matchingProviders?.map(provider => ({
      ...provider,
      availability_score: provider.match_score + 
        (provider.rating * 10) + 
        (demandMetrics.service_demand < 3 ? 20 : 0), // Bonus for low competition
      recommended: provider.match_score >= 80 && provider.rating >= 4.0
    })) || [];

    console.log('Found matching providers:', enhancedProviders.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        providers: enhancedProviders,
        demand_metrics: demandMetrics,
        total_matches: enhancedProviders.length,
        search_criteria: { serviceType, location, urgency }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Provider matching error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to match providers',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});