import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { email, first_name, last_name, services, type }: NotificationRequest = await req.json();

    if (type === 'candidate') {
      // Email de confirmation au candidat
      const candidateEmailResponse = await resend.emails.send({
        from: "Bikawo <contact@bikawo.com>",
        to: [email],
        subject: "Candidature reçue - Bikawo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Bikawo</h1>
              <p style="color: #64748b; font-size: 16px;">Votre candidature a été reçue !</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #334155; margin-top: 0;">Bonjour ${first_name},</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Nous avons bien reçu votre candidature pour rejoindre l'équipe Bikawo en tant que prestataire.
              </p>
              
              <p style="color: #475569; line-height: 1.6;">
                <strong>Services sélectionnés :</strong><br>
                ${services}
              </p>
              
              <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;">
                  📧 Nous vous recontacterons sous 48h maximum
                </p>
              </div>
              
              <p style="color: #475569; line-height: 1.6;">
                Notre équipe va examiner votre candidature et vous contactera très prochainement 
                pour la suite du processus de sélection.
              </p>
              
              <p style="color: #475569; line-height: 1.6;">
                En cas de question, n'hésitez pas à nous contacter à contact@bikawo.com
              </p>
              
              <p style="color: #475569; line-height: 1.6;">
                À très bientôt !<br>
                <strong>L'équipe Bikawo</strong>
              </p>
            </div>
            
            <div style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px;">
              <p>Bikawo - Services à domicile pour les familles</p>
            </div>
          </div>
        `,
      });

      console.log("Email de confirmation candidat envoyé:", candidateEmailResponse);
    } else if (type === 'admin') {
      // Email de notification à l'admin
      const adminEmailResponse = await resend.emails.send({
        from: "Bikawo <contact@bikawo.com>",
        to: ["admin@bikawo.com"], // À remplacer par l'email admin réel
        subject: `Nouvelle candidature prestataire - ${first_name} ${last_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 24px; margin: 0;">🚨 Nouvelle candidature prestataire</h1>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px;">
              <h2 style="color: #b91c1c; margin-top: 0;">Détails du candidat :</h2>
              
              <ul style="color: #374151; line-height: 1.8;">
                <li><strong>Nom :</strong> ${first_name} ${last_name}</li>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Services :</strong> ${services}</li>
                <li><strong>Statut :</strong> En attente de documents</li>
              </ul>
              
              <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px;">
                <p style="margin: 0; color: #dc2626; font-weight: 500;">
                  ⏰ Action requise : Contacter le candidat sous 48h
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://votre-admin-panel.com/candidatures" 
                   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir dans l'admin
                </a>
              </div>
            </div>
          </div>
        `,
      });

      console.log("Email de notification admin envoyé:", adminEmailResponse);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification envoyée" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);