import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0";

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  email: string;
  firstName: string;
  lastName: string;
  oldStatus: string;
  newStatus: string;
  comments?: string;
  language?: string;
}

const getStatusLabel = (status: string, lang = 'fr') => {
  const statusLabels = {
    fr: {
      'pending': 'En attente',
      'under_review': 'En cours d\'examen',
      'interview_scheduled': 'Entretien programmé',
      'approved': 'Approuvée',
      'rejected': 'Rejetée',
      'onboarding': 'En formation',
      'active': 'Actif'
    },
    en: {
      'pending': 'Pending',
      'under_review': 'Under Review',
      'interview_scheduled': 'Interview Scheduled',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'onboarding': 'Onboarding',
      'active': 'Active'
    }
  };
  
  return statusLabels[lang]?.[status] || status;
};

const getEmailContent = (data: StatusNotificationRequest) => {
  const isFrench = data.language === 'fr' || !data.language;
  const statusLabel = getStatusLabel(data.newStatus, data.language);
  
  if (isFrench) {
    return {
      subject: `Mise à jour de votre candidature - ${statusLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Bikawo</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Mise à jour de candidature</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.firstName} ${data.lastName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Nous vous informons que le statut de votre candidature a été mis à jour.
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Nouveau statut</h3>
              <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">
                ${statusLabel}
              </p>
            </div>
            
            ${data.comments ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">Commentaires de notre équipe :</h4>
                <p style="color: #333; margin-bottom: 0;">${data.comments}</p>
              </div>
            ` : ''}
            
            ${data.newStatus === 'approved' ? `
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #155724; margin-top: 0;">🎉 Félicitations !</h3>
                <p style="color: #333; margin-bottom: 15px;">
                  Votre candidature a été approuvée ! Notre équipe vous contactera prochainement pour les prochaines étapes.
                </p>
                <p style="color: #333; margin-bottom: 0;">
                  Préparez vos documents : SIREN, titre de séjour (si applicable), et casier judiciaire.
                </p>
              </div>
            ` : ''}
            
            ${data.newStatus === 'interview_scheduled' ? `
              <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0c5460; margin-top: 0;">📅 Entretien programmé</h3>
                <p style="color: #333; margin-bottom: 0;">
                  Un entretien a été programmé. Vous recevrez bientôt les détails de date et d'heure.
                </p>
              </div>
            ` : ''}
            
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
              Cordialement,<br>
              <strong>L'équipe Bikawo</strong>
            </p>
          </div>
        </div>
      `
    };
  } else {
    return {
      subject: `Application Status Update - ${statusLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Bikawo</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Application Update</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName} ${data.lastName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We would like to inform you that your application status has been updated.
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">New Status</h3>
              <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">
                ${statusLabel}
              </p>
            </div>
            
            ${data.comments ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">Comments from our team:</h4>
                <p style="color: #333; margin-bottom: 0;">${data.comments}</p>
              </div>
            ` : ''}
            
            ${data.newStatus === 'approved' ? `
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #155724; margin-top: 0;">🎉 Congratulations!</h3>
                <p style="color: #333; margin-bottom: 15px;">
                  Your application has been approved! Our team will contact you soon for the next steps.
                </p>
                <p style="color: #333; margin-bottom: 0;">
                  Please prepare your documents: SIREN, residence permit (if applicable), and criminal record.
                </p>
              </div>
            ` : ''}
            
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
    const { email, firstName, lastName, oldStatus, newStatus, comments, language }: StatusNotificationRequest = await req.json();

    console.log('Sending status notification to:', email, 'Status:', oldStatus, '->', newStatus);

    const emailContent = getEmailContent({ email, firstName, lastName, oldStatus, newStatus, comments, language });

    const emailResponse = await resend.emails.send({
      from: "Bikawo <contact@bikawo.com>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Status notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-job-status-notification function:", error);
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