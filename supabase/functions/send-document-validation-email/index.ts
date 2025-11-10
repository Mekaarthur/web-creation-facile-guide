import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  documentType: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const documentLabels: Record<string, string> = {
  identity_document: 'Pièce d\'identité',
  criminal_record: 'Casier judiciaire',
  siret_document: 'Document SIRET',
  rib_iban: 'RIB / IBAN',
  cv: 'Curriculum Vitae',
  certifications: 'Certifications'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { applicationId, documentType, status, rejectionReason }: EmailRequest = await req.json();

    // Récupérer les infos du candidat
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('first_name, last_name, email')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application non trouvée');
    }

    const documentLabel = documentLabels[documentType] || documentType;
    const candidateName = `${application.first_name} ${application.last_name}`;

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = `✅ Document approuvé - ${documentLabel}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Document approuvé</h2>
          <p>Bonjour ${application.first_name},</p>
          <p>Bonne nouvelle ! Votre document <strong>${documentLabel}</strong> a été approuvé par notre équipe.</p>
          <p>Nous continuons l'examen de votre candidature et vous tiendrons informé(e) de la suite du processus.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Cordialement,<br>
            L'équipe Bikawo
          </p>
        </div>
      `;
    } else {
      subject = `❌ Document à corriger - ${documentLabel}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Document à corriger</h2>
          <p>Bonjour ${application.first_name},</p>
          <p>Nous avons examiné votre document <strong>${documentLabel}</strong>, mais nous avons besoin que vous le soumettiez à nouveau.</p>
          ${rejectionReason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>Raison :</strong></p>
              <p style="margin: 10px 0 0 0; color: #991b1b;">${rejectionReason}</p>
            </div>
          ` : ''}
          <p>Merci de vous reconnecter à votre espace candidat pour soumettre un nouveau document.</p>
          <p style="margin-top: 30px;">
            <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/provider-signup" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder à mon espace
            </a>
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Cordialement,<br>
            L'équipe Bikawo
          </p>
        </div>
      `;
    }

    // Envoyer l'email via Resend
    const emailResponse = await resend.emails.send({
      from: "Bikawo <onboarding@resend.dev>", // À remplacer par votre domaine validé
      to: [application.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email envoyé:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erreur envoi email validation document:", error);
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
