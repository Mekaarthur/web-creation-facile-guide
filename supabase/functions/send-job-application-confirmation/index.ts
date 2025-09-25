import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0";

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  category: string;
  language?: string;
}

const getEmailContent = (data: JobApplicationRequest) => {
  const isFrench = data.language === 'fr' || !data.language;
  
  if (isFrench) {
    return {
      subject: "Candidature reçue - Bikawo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Bikawo</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Services à domicile de qualité</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.firstName} ${data.lastName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Nous avons bien reçu votre candidature pour le poste <strong>${data.category}</strong>. 
              Merci pour votre intérêt à rejoindre notre équipe !
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📋 Prochaines étapes</h3>
              <p style="color: #333; margin-bottom: 15px;">
                Pour finaliser votre candidature, veuillez préparer les documents suivants :
              </p>
              <ul style="color: #333; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>SIREN auto-entrepreneur</strong> - Votre numéro d'identification</li>
                <li style="margin-bottom: 8px;"><strong>Titre de séjour</strong> - Si applicable</li>
                <li style="margin-bottom: 8px;"><strong>Casier judiciaire</strong> - Extrait de bulletin n°3</li>
                <li style="margin-bottom: 8px;"><strong>CV actualisé</strong></li>
                <li style="margin-bottom: 8px;"><strong>Certificats de formation</strong> - Si applicable</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Notre équipe RH examinera votre dossier dans les prochains jours. 
              Nous vous recontacterons rapidement pour la suite du processus de recrutement.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:recrutement@bikawo.com" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        display: inline-block;">
                Nous contacter
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              À bientôt,<br>
              <strong>L'équipe Bikawo</strong>
            </p>
          </div>
        </div>
      `
    };
  } else {
    return {
      subject: "Application Received - Bikawo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Bikawo</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Quality Home Services</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName} ${data.lastName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We have received your application for the <strong>${data.category}</strong> position. 
              Thank you for your interest in joining our team!
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📋 Next Steps</h3>
              <p style="color: #333; margin-bottom: 15px;">
                To complete your application, please prepare the following documents:
              </p>
              <ul style="color: #333; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>SIREN auto-entrepreneur</strong> - Your identification number</li>
                <li style="margin-bottom: 8px;"><strong>Residence permit</strong> - If applicable</li>
                <li style="margin-bottom: 8px;"><strong>Criminal record</strong> - Extract bulletin n°3</li>
                <li style="margin-bottom: 8px;"><strong>Updated CV</strong></li>
                <li style="margin-bottom: 8px;"><strong>Training certificates</strong> - If applicable</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Our HR team will review your application in the coming days. 
              We will contact you soon for the next steps in the recruitment process.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:recruitment@bikawo.com" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        display: inline-block;">
                Contact Us
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              Best regards,<br>
              <strong>The Bikawo Team</strong>
            </p>
          </div>
        </div>
      `
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, category, language }: JobApplicationRequest = await req.json();

    console.log('Sending job application confirmation to:', email);

    const emailContent = getEmailContent({ firstName, lastName, email, category, language });

    // Email service temporarily disabled
    console.log('Job application confirmation email temporarily disabled for:', email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email service temporarily disabled'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-job-application-confirmation function:", error);
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