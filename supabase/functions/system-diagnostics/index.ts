import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticRequest {
  tests: string[];
}

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tests }: DiagnosticRequest = await req.json();
    const results: DiagnosticResult[] = [];

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: "Configuration Supabase manquante",
          results: [{
            test: "configuration",
            status: "error",
            message: "Variables d'environnement Supabase manquantes"
          }]
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test de connectivité base de données
    if (tests.includes('database')) {
      const startTime = Date.now();
      try {
        const { error } = await supabase.from('services').select('count').limit(1);
        results.push({
          test: 'database',
          status: error ? 'error' : 'success',
          message: error ? `Erreur DB: ${error.message}` : 'Base de données accessible',
          duration: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          test: 'database',
          status: 'error',
          message: `Erreur critique DB: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }

    // Test des secrets et configurations
    if (tests.includes('secrets')) {
      const startTime = Date.now();
      const requiredSecrets = ['RESEND_API_KEY', 'STRIPE_SECRET_KEY'];
      const missingSecrets = [];
      
      for (const secret of requiredSecrets) {
        if (!Deno.env.get(secret)) {
          missingSecrets.push(secret);
        }
      }
      
      results.push({
        test: 'secrets',
        status: missingSecrets.length === 0 ? 'success' : 'error',
        message: missingSecrets.length === 0 
          ? 'Tous les secrets requis sont configurés'
          : `Secrets manquants: ${missingSecrets.join(', ')}`,
        details: { missing: missingSecrets, checked: requiredSecrets },
        duration: Date.now() - startTime
      });
    }

    // Test du service d'email
    if (tests.includes('email')) {
      const startTime = Date.now();
      try {
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (!resendKey) {
          results.push({
            test: 'email',
            status: 'error',
            message: 'RESEND_API_KEY manquante',
            duration: Date.now() - startTime
          });
        } else {
          // Test de validation de la clé API Resend
          const resendResponse = await fetch('https://api.resend.com/domains', {
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (resendResponse.ok) {
            results.push({
              test: 'email',
              status: 'success',
              message: 'Service d\'email Resend accessible',
              duration: Date.now() - startTime
            });
          } else {
            results.push({
              test: 'email',
              status: 'error',
              message: `Erreur Resend API: ${resendResponse.status}`,
              details: await resendResponse.text(),
              duration: Date.now() - startTime
            });
          }
        }
      } catch (error) {
        results.push({
          test: 'email',
          status: 'error',
          message: `Erreur test email: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }

    // Test de Stripe
    if (tests.includes('stripe')) {
      const startTime = Date.now();
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
          results.push({
            test: 'stripe',
            status: 'error',
            message: 'STRIPE_SECRET_KEY manquante',
            duration: Date.now() - startTime
          });
        } else {
          // Test basique de l'API Stripe
          const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          
          if (stripeResponse.ok) {
            const accountData = await stripeResponse.json();
            results.push({
              test: 'stripe',
              status: 'success',
              message: `Stripe connecté (${accountData.country})`,
              details: { 
                country: accountData.country,
                charges_enabled: accountData.charges_enabled 
              },
              duration: Date.now() - startTime
            });
          } else {
            results.push({
              test: 'stripe',
              status: 'error',
              message: `Erreur Stripe API: ${stripeResponse.status}`,
              details: await stripeResponse.text(),
              duration: Date.now() - startTime
            });
          }
        }
      } catch (error) {
        results.push({
          test: 'stripe',
          status: 'error',
          message: `Erreur test Stripe: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }

    // Test des buckets de stockage
    if (tests.includes('storage')) {
      const startTime = Date.now();
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          results.push({
            test: 'storage',
            status: 'error',
            message: `Erreur storage: ${error.message}`,
            duration: Date.now() - startTime
          });
        } else {
          const bucketNames = buckets?.map(b => b.name) || [];
          const requiredBuckets = ['provider-documents', 'provider-applications', 'attestations'];
          const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));
          
          results.push({
            test: 'storage',
            status: missingBuckets.length === 0 ? 'success' : 'warning',
            message: missingBuckets.length === 0 
              ? 'Tous les buckets requis existent'
              : `Buckets manquants: ${missingBuckets.join(', ')}`,
            details: { 
              existing: bucketNames,
              required: requiredBuckets,
              missing: missingBuckets 
            },
            duration: Date.now() - startTime
          });
        }
      } catch (error) {
        results.push({
          test: 'storage',
          status: 'error',
          message: `Erreur test storage: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }

    // Test des notifications récentes
    if (tests.includes('notifications')) {
      const startTime = Date.now();
      try {
        const { data, error } = await supabase
          .from('notification_logs')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(10);

        if (error) {
          results.push({
            test: 'notifications',
            status: 'error',
            message: `Erreur logs notifications: ${error.message}`,
            duration: Date.now() - startTime
          });
        } else {
          const successCount = data?.filter(n => n.status === 'sent').length || 0;
          const errorCount = data?.filter(n => n.status === 'error').length || 0;
          
          results.push({
            test: 'notifications',
            status: errorCount > successCount ? 'warning' : 'success',
            message: `${data?.length || 0} notifications 24h (${successCount} réussies, ${errorCount} erreurs)`,
            details: { 
              total: data?.length || 0,
              success: successCount,
              errors: errorCount,
              recent: data?.slice(0, 3)
            },
            duration: Date.now() - startTime
          });
        }
      } catch (error) {
        results.push({
          test: 'notifications',
          status: 'error',
          message: `Erreur test notifications: ${error.message}`,
          duration: Date.now() - startTime
        });
      }
    }

    return new Response(
      JSON.stringify({ results, timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Erreur dans system-diagnostics:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        results: [{
          test: "system",
          status: "error",
          message: `Erreur système: ${error.message}`
        }]
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);