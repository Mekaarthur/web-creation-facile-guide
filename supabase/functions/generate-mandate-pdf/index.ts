import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { providerId, providerName, signatureData, mandateText } = await req.json();

    console.log('📄 Generating mandate PDF for provider:', providerId);

    // Ici vous pouvez intégrer une librairie de génération PDF
    // Pour l'instant, on stocke juste la signature et le texte
    // En production, utilisez jspdf, pdfkit ou une API externe comme DocRaptor

    // Créer un HTML simple pour le mandat
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
    .mandate-content { white-space: pre-wrap; line-height: 1.6; }
    .signature-section { margin-top: 40px; }
    .signature-image { max-width: 300px; border: 1px solid #ccc; padding: 10px; }
    .date { text-align: right; color: #666; }
  </style>
</head>
<body>
  <h1>MANDAT DE FACTURATION BIKAWO</h1>
  <div class="mandate-content">${mandateText}</div>
  <div class="signature-section">
    <p><strong>Signature du prestataire:</strong></p>
    <img src="${signatureData}" alt="Signature" class="signature-image" />
    <p class="date">Date: ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
</body>
</html>
    `;

    // Stocker le HTML dans le storage
    const fileName = `mandates/${providerId}_mandate_${Date.now()}.html`;
    
    const { error: uploadError } = await supabase.storage
      .from('provider-documents')
      .upload(fileName, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('provider-documents')
      .getPublicUrl(fileName);

    // Envoyer un email de notification
    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          type: 'provider_document_validated',
          recipientEmail: '', // À récupérer depuis le profil du provider
          recipientName: providerName,
          data: {
            providerName,
            documentType: 'Mandat de facturation',
            nextStep: 'Formation obligatoire'
          }
        }
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Ne pas bloquer si l'email échoue
    }

    console.log('✅ Mandate PDF generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        mandateUrl: publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error generating mandate PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
