import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  first_name: string;
  last_name: string;
  services: string;
  type: 'candidate' | 'admin';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Service email non configuré" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, first_name, last_name, services, type }: NotificationRequest = await req.json();

    const fromAddress = "Bikawo <contact@bikawo.com>";

    if (type === 'candidate') {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: "✅ Candidature reçue - Bikawo",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://bikawo.fr/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" width="180" height="auto" alt="Bikawo" style="margin: 0 auto;" />
              </div>
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #334155; margin-top: 0;">Bonjour ${first_name},</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Nous avons bien reçu votre candidature pour rejoindre l'équipe Bikawo en tant que prestataire.
                </p>
                <p style="color: #475569; line-height: 1.6;">
                  <strong>Services sélectionnés :</strong><br/>
                  ${services}
                </p>
                <div style="background: #dbeafe; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af; font-weight: 500;">
                    📧 Nous vous recontacterons sous 48h maximum
                  </p>
                </div>
                <p style="color: #475569; line-height: 1.6;">
                  Notre équipe va examiner votre candidature et vous contactera très prochainement.
                </p>
                <p style="color: #475569; line-height: 1.6;">
                  En cas de question, contactez-nous à contact@bikawo.com ou au 06 09 08 53 90.
                </p>
                <p style="color: #475569; line-height: 1.6;">
                  À très bientôt !<br/>
                  <strong>L'équipe Bikawo</strong>
                </p>
              </div>
              <div style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px;">
                <p>Bikawo - Votre assistant personnel au quotidien</p>
              </div>
            </div>
          `,
        }),
      });

      const result = await res.json();
      console.log("Email candidat envoyé:", JSON.stringify(result));

      if (!res.ok) {
        console.error("Erreur Resend candidat:", JSON.stringify(result));
      }
    } else if (type === 'admin') {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: ["contact@bikawo.com"],
          subject: `🚨 Nouvelle candidature - ${first_name} ${last_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #dc2626; font-size: 24px;">🚨 Nouvelle candidature prestataire</h1>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px;">
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Nom :</strong> ${first_name} ${last_name}</li>
                  <li><strong>Email :</strong> ${email}</li>
                  <li><strong>Services :</strong> ${services}</li>
                </ul>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://bikawo.fr/admin/applications" 
                     style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir dans l'admin
                  </a>
                </div>
              </div>
            </div>
          `,
        }),
      });

      const result = await res.json();
      console.log("Email admin envoyé:", JSON.stringify(result));
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erreur notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);