import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  identifier: string; // email, phone, ou IP
  action: string; // 'conversation_create', 'login_attempt', etc.
  maxAttempts?: number;
  windowMinutes?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { identifier, action, maxAttempts = 5, windowMinutes = 60 }: RateLimitRequest = await req.json();

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si bloqué
    const { data: blocked } = await supabase
      .from('rate_limit_tracking')
      .select('blocked_until')
      .eq('identifier', identifier)
      .eq('action_type', action)
      .gt('blocked_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (blocked) {
      return new Response(
        JSON.stringify({ 
          allowed: false,
          blocked_until: blocked.blocked_until,
          message: 'Rate limit exceeded. Please try again later.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compter les tentatives récentes
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', identifier)
      .gte('created_at', windowStart);

    if (error) {
      console.error('Error checking rate limit:', error);
      throw error;
    }

    const attemptCount = count || 0;

    // Si le seuil est dépassé
    if (attemptCount >= maxAttempts) {
      const blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await supabase
        .from('rate_limit_tracking')
        .insert({
          identifier,
          action_type: action,
          attempt_count: attemptCount,
          blocked_until: blockedUntil.toISOString()
        });

      // Logger dans audit log
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'rate_limit_exceeded',
          details: {
            identifier,
            action,
            attempts: attemptCount,
            blocked_until: blockedUntil
          }
        });

      return new Response(
        JSON.stringify({ 
          allowed: false,
          attempts: attemptCount,
          blocked_until: blockedUntil,
          message: `Rate limit exceeded. Maximum ${maxAttempts} attempts per ${windowMinutes} minutes.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        attempts: attemptCount,
        remaining: maxAttempts - attemptCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rate-limit-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
