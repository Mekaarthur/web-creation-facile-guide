import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Vérification des alertes zones...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Appeler la fonction de vérification des alertes
    const { error: checkError } = await supabase.rpc('check_and_create_zone_alerts');

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      throw checkError;
    }

    // Récupérer les statistiques des alertes
    const { data: alertStats, error: statsError } = await supabase
      .from('zone_alerts')
      .select('alert_type, severity, is_resolved')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (statsError) {
      console.error('Erreur récupération stats:', statsError);
    }

    const stats = {
      total: alertStats?.length || 0,
      critical: alertStats?.filter(a => a.severity === 'critical' && !a.is_resolved).length || 0,
      high: alertStats?.filter(a => a.severity === 'high' && !a.is_resolved).length || 0,
      resolved_today: alertStats?.filter(a => a.is_resolved).length || 0
    };

    console.log('✅ Vérification terminée:', stats);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Vérification des alertes zones terminée',
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erreur fonction check-zone-alerts:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});