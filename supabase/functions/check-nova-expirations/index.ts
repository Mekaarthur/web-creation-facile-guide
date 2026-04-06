import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-NOVA-EXPIRATIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - daily Nova expiration check");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // === Prestataires avec Nova expiré ===
    const { data: expiredProviders, error: expError } = await supabaseAdmin
      .from("providers")
      .select("id, business_name, nova_status, nova_expires_at, user_id")
      .eq("nova_status", "validated")
      .lt("nova_expires_at", now.toISOString())
      .not("nova_expires_at", "is", null);

    if (expError) {
      logStep("Error fetching expired nova", { error: expError.message });
    } else if (expiredProviders && expiredProviders.length > 0) {
      logStep(`Found ${expiredProviders.length} providers with expired Nova`);

      for (const provider of expiredProviders) {
        // Mettre à jour le statut Nova
        await supabaseAdmin
          .from("providers")
          .update({ nova_status: "expired", updated_at: new Date().toISOString() })
          .eq("id", provider.id);

        // Alerte admin
        await supabaseAdmin.functions.invoke("create-admin-notification", {
          body: {
            type: "nova_expired",
            title: "🔴 Agrément Nova expiré",
            message: `L'agrément Nova de ${provider.business_name || 'Prestataire'} (ID: ${provider.id}) a expiré le ${new Date(provider.nova_expires_at!).toLocaleDateString('fr-FR')}. Ce prestataire ne peut plus effectuer de missions ouvrant droit au crédit d'impôt.`,
            data: { provider_id: provider.id, expired_at: provider.nova_expires_at },
            priority: "urgent",
          },
        });

        // Notification email au prestataire
        if (provider.user_id) {
          try {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, first_name")
              .eq("user_id", provider.user_id)
              .single();

            if (profile?.email) {
              await supabaseAdmin.functions.invoke("send-notification-email", {
                body: {
                  to: profile.email,
                  subject: "🔴 Votre agrément Nova a expiré - Action requise",
                  html: `
                    <p>Bonjour ${profile.first_name || ''},</p>
                    <p>Votre agrément Nova a expiré le <strong>${new Date(provider.nova_expires_at!).toLocaleDateString('fr-FR')}</strong>.</p>
                    <p><strong>Conséquence :</strong> Vous ne pouvez plus effectuer de missions ouvrant droit au crédit d'impôt pour vos clients tant que votre agrément n'est pas renouvelé.</p>
                    <p>Veuillez renouveler votre agrément Nova dès que possible et nous transmettre le nouveau document via votre espace prestataire.</p>
                    <p>L'équipe Bikawo</p>
                  `,
                },
              });
            }
          } catch (emailErr) {
            logStep("Failed to send email to provider", { providerId: provider.id, error: String(emailErr) });
          }
        }
      }
    }

    // === Prestataires avec Nova expirant dans 30 jours ===
    const { data: expiringProviders, error: expiringSoonError } = await supabaseAdmin
      .from("providers")
      .select("id, business_name, nova_status, nova_expires_at, user_id")
      .eq("nova_status", "validated")
      .gt("nova_expires_at", now.toISOString())
      .lt("nova_expires_at", in30Days.toISOString());

    if (expiringSoonError) {
      logStep("Error fetching expiring nova", { error: expiringSoonError.message });
    } else if (expiringProviders && expiringProviders.length > 0) {
      logStep(`Found ${expiringProviders.length} providers with Nova expiring soon`);

      for (const provider of expiringProviders) {
        const daysLeft = Math.ceil((new Date(provider.nova_expires_at!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        // Alerte admin seulement à J-30, J-14 et J-7
        if (daysLeft === 30 || daysLeft === 14 || daysLeft === 7) {
          await supabaseAdmin.functions.invoke("create-admin-notification", {
            body: {
              type: "nova_expiring",
              title: `🟡 Agrément Nova expire dans ${daysLeft}j`,
              message: `L'agrément Nova de ${provider.business_name || 'Prestataire'} expire le ${new Date(provider.nova_expires_at!).toLocaleDateString('fr-FR')} (dans ${daysLeft} jours).`,
              data: { provider_id: provider.id, days_left: daysLeft, expires_at: provider.nova_expires_at },
              priority: daysLeft <= 7 ? "high" : "normal",
            },
          });

          // Notification email au prestataire
          if (provider.user_id) {
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email, first_name")
                .eq("user_id", provider.user_id)
                .single();

              if (profile?.email) {
                await supabaseAdmin.functions.invoke("send-notification-email", {
                  body: {
                    to: profile.email,
                    subject: `⚠️ Votre agrément Nova expire dans ${daysLeft} jours`,
                    html: `
                      <p>Bonjour ${profile.first_name || ''},</p>
                      <p>Votre agrément Nova expire le <strong>${new Date(provider.nova_expires_at!).toLocaleDateString('fr-FR')}</strong> (dans ${daysLeft} jours).</p>
                      <p>Pensez à renouveler votre agrément pour continuer à effectuer des missions ouvrant droit au crédit d'impôt.</p>
                      <p>L'équipe Bikawo</p>
                    `,
                  },
                });
              }
            } catch (emailErr) {
              logStep("Failed to send expiring email", { providerId: provider.id, error: String(emailErr) });
            }
          }
        }
      }
    }

    const summary = {
      expired: expiredProviders?.length || 0,
      expiring_soon: expiringProviders?.length || 0,
    };

    logStep("Nova check completed", summary);

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
