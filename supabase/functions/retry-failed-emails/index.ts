import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getAdminCorsHeaders } from "../_shared/cors.ts";

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number; // en minutes
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { maxRetries = 3, retryDelay = 30 } = (await req.json()) as RetryConfig;

    console.log(`🔄 Starting email retry process (max retries: ${maxRetries})`);

    // Récupérer les communications échouées qui n'ont pas dépassé le nombre max de tentatives
    const { data: failedComms, error: fetchError } = await supabase
      .from('communications')
      .select('*')
      .eq('status', 'erreur')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(50); // Limiter à 50 par batch

    if (fetchError) {
      throw new Error(`Failed to fetch communications: ${fetchError.message}`);
    }

    if (!failedComms || failedComms.length === 0) {
      console.log('✅ No failed emails to retry');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No failed emails to retry',
        processed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📧 Found ${failedComms.length} failed emails to retry`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // Traiter chaque communication échouée
    for (const comm of failedComms) {
      try {
        // Vérifier si le délai de retry est respecté
        const lastAttempt = new Date(comm.updated_at);
        const now = new Date();
        const minutesSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60);

        if (minutesSinceLastAttempt < retryDelay) {
          console.log(`⏳ Skipping ${comm.id} - too soon (${minutesSinceLastAttempt.toFixed(0)}min < ${retryDelay}min)`);
          continue;
        }

        // Appeler la fonction d'envoi d'email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-email-notifications',
          {
            body: {
              email: comm.destinataire_email,
              subject: comm.sujet,
              message: comm.contenu,
              type: comm.type
            }
          }
        );

        if (emailError) {
          throw emailError;
        }

        // Mettre à jour le statut à succès
        await supabase
          .from('communications')
          .update({
            status: 'envoyé',
            sent_at: new Date().toISOString(),
            retry_count: comm.retry_count + 1,
            error_message: null
          })
          .eq('id', comm.id);

        successCount++;
        results.push({ id: comm.id, status: 'success' });
        console.log(`✅ Successfully retried email ${comm.id}`);

      } catch (error: any) {
        // Incrémenter le compteur de tentatives
        await supabase
          .from('communications')
          .update({
            retry_count: comm.retry_count + 1,
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', comm.id);

        failCount++;
        results.push({ id: comm.id, status: 'failed', error: error.message });
        console.error(`❌ Failed to retry email ${comm.id}:`, error.message);
      }
    }

    console.log(`📊 Retry summary: ${successCount} succeeded, ${failCount} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: failedComms.length,
      succeeded: successCount,
      failed: failCount,
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in retry-failed-emails function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
