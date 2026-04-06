import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-URSSAF-EXPIRATIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // === PARTIE 1: Vérifier les déclarations URSSAF expirées (48h sans validation client) ===
    logStep("Checking expired URSSAF declarations");

    const { data: expiredDeclarations, error: expError } = await supabaseAdmin
      .from("urssaf_declarations")
      .select("id, client_email, client_name, booking_id, total_amount, client_validation_deadline, status")
      .in("status", ["sent", "pending_client_validation"])
      .lt("client_validation_deadline", new Date().toISOString())
      .not("client_validation_deadline", "is", null);

    if (expError) {
      logStep("Error fetching expired declarations", { error: expError.message });
    } else if (expiredDeclarations && expiredDeclarations.length > 0) {
      logStep(`Found ${expiredDeclarations.length} expired declarations`);
      
      for (const decl of expiredDeclarations) {
        // Marquer comme expirée
        await supabaseAdmin
          .from("urssaf_declarations")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", decl.id);

        // Créer une alerte admin
        await supabaseAdmin.functions.invoke("create-admin-notification", {
          body: {
            type: "urssaf_expired",
            title: "⏰ Déclaration URSSAF expirée",
            message: `La déclaration pour ${decl.client_name || decl.client_email} (${decl.total_amount}€) a expiré sans validation client dans les 48h.`,
            data: { declaration_id: decl.id, booking_id: decl.booking_id },
            priority: "high",
          },
        });
      }
    }

    // === PARTIE 2: Envoyer relances client à 36h (12h avant expiration) ===
    logStep("Checking declarations needing 36h reminder");

    const now = new Date();
    const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const { data: urgentDeclarations, error: urgentError } = await supabaseAdmin
      .from("urssaf_declarations")
      .select("id, client_email, client_name, booking_id, total_amount, client_validation_deadline, status")
      .in("status", ["sent", "pending_client_validation"])
      .lt("client_validation_deadline", in12h.toISOString())
      .gt("client_validation_deadline", now.toISOString());

    if (urgentError) {
      logStep("Error fetching urgent declarations", { error: urgentError.message });
    } else if (urgentDeclarations && urgentDeclarations.length > 0) {
      logStep(`Found ${urgentDeclarations.length} declarations needing reminder`);

      for (const decl of urgentDeclarations) {
        // Envoyer relance email au client
        try {
          await supabaseAdmin.functions.invoke("send-notification-email", {
            body: {
              to: decl.client_email,
              subject: "⚠️ Validez votre demande d'avance immédiate - Il reste moins de 12h",
              html: `
                <p>Bonjour ${decl.client_name || ''},</p>
                <p>Vous avez une demande d'avance immédiate URSSAF en attente de validation.</p>
                <p><strong>Montant total :</strong> ${decl.total_amount}€</p>
                <p><strong>⏰ Deadline :</strong> ${new Date(decl.client_validation_deadline!).toLocaleString('fr-FR')}</p>
                <p>Veuillez vous connecter sur <a href="https://www.particulier.urssaf.fr">particulier.urssaf.fr</a> pour valider cette demande avant l'expiration.</p>
                <p>Sans validation de votre part, la demande expirera et vous devrez payer le montant total.</p>
                <p>L'équipe Bikawo</p>
              `,
            },
          });
          logStep("Reminder sent to", { email: decl.client_email });
        } catch (emailErr) {
          logStep("Failed to send reminder", { email: decl.client_email, error: String(emailErr) });
        }
      }
    }

    // === PARTIE 3: Déclarations en erreur à relancer ===
    logStep("Checking declarations needing retry");

    const { data: retryDeclarations, error: retryError } = await supabaseAdmin
      .from("urssaf_declarations")
      .select("id, client_email, booking_id, retry_count, error_code, status")
      .eq("status", "rejected")
      .lt("retry_count", 3);

    if (retryError) {
      logStep("Error fetching retry declarations", { error: retryError.message });
    } else if (retryDeclarations && retryDeclarations.length > 0) {
      logStep(`Found ${retryDeclarations.length} declarations to retry`);
      
      for (const decl of retryDeclarations) {
        // Créer alerte admin pour intervention
        await supabaseAdmin.functions.invoke("create-admin-notification", {
          body: {
            type: "urssaf_retry",
            title: "🔄 Déclaration URSSAF à relancer",
            message: `Déclaration ${decl.id} rejetée (code: ${decl.error_code}). Tentative ${(decl.retry_count || 0) + 1}/3.`,
            data: { declaration_id: decl.id, booking_id: decl.booking_id, error_code: decl.error_code },
            priority: "high",
          },
        });
      }
    }

    const summary = {
      expired: expiredDeclarations?.length || 0,
      reminders_sent: urgentDeclarations?.length || 0,
      needs_retry: retryDeclarations?.length || 0,
    };

    logStep("Check completed", summary);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
