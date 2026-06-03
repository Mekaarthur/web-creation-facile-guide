import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const documentLabels: Record<string, string> = {
  identity_document: "Pièce d'identité",
  criminal_record: "Casier judiciaire (facultatif)",
  siret_document: "Justificatif auto-entrepreneur",
  rib_iban: "RIB / IBAN",
  certifications: "Agrément Nova",
  certifications_other: "Certifications",
  insurance: "Assurance RC Pro",
};

// Thin wrapper — does DB lookup then delegates to send-modern-notification
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { applicationId, documentType, status, rejectionReason } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: application, error } = await supabase
      .from('job_applications')
      .select('first_name, last_name, email')
      .eq('id', applicationId)
      .single();

    if (error || !application) throw new Error('Application non trouvée');

    const documentLabel = documentLabels[documentType] || documentType;
    const notificationType = status === 'approved' ? 'document_approved' : 'document_rejected';

    const res = await fetch(`${supabaseUrl}/functions/v1/send-modern-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        type: notificationType,
        recipient: {
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
          firstName: application.first_name,
        },
        data: { documentLabel, rejectionReason }
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erreur envoi email validation document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
