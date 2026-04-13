import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  criminal_record: 'Casier judiciaire (facultatif)',
  siret_document: 'Justificatif auto-entrepreneur',
  rib_iban: 'RIB / IBAN',
  certifications: 'Agrément Nova',
  certifications_other: 'Certifications',
  insurance: 'Assurance RC Pro'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY non configurée");
      return new Response(
        JSON.stringify({ success: false, error: "Email service non configuré" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { applicationId, documentType, status, rejectionReason }: EmailRequest = await req.json();

    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('first_name, last_name, email')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application non trouvée');
    }

    const documentLabel = documentLabels[documentType] || documentType;

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = `✅ Document approuvé - ${documentLabel}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://bikawo.fr/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" width="180" alt="Bikawo" />
          </div>
          <h2 style="color: #16a34a;">Document approuvé</h2>
          <p>Bonjour ${application.first_name},</p>
          <p>Bonne nouvelle ! Votre document <strong>${documentLabel}</strong> a été approuvé par notre équipe.</p>
          <p>Nous continuons l'examen de votre candidature et vous tiendrons informé(e).</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe Bikawo</p>
        </div>
      `;
    } else {
      subject = `❌ Document à corriger - ${documentLabel}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://bikawo.fr/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" width="180" alt="Bikawo" />
          </div>
          <h2 style="color: #dc2626;">Document à corriger</h2>
          <p>Bonjour ${application.first_name},</p>
          <p>Nous avons examiné votre document <strong>${documentLabel}</strong>, mais nous avons besoin que vous le soumettiez à nouveau.</p>
          ${rejectionReason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>Raison :</strong> ${rejectionReason}</p>
            </div>
          ` : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe Bikawo</p>
        </div>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bikawo <contact@bikawo.com>",
        to: [application.email],
        subject,
        html: htmlContent,
      }),
    });

    const result = await res.json();
    console.log("Email validation document envoyé:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erreur envoi email validation document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
