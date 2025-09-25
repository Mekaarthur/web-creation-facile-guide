import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ModernNotificationRequest {
  type: 
    // Client notifications
    | 'client_welcome'
    | 'booking_confirmation' 
    | 'booking_reminder_24h'
    | 'booking_reminder_2h'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'booking_rescheduled'
    | 'booking_cancelled'
    | 'mission_started'
    | 'mission_completed'
    | 'invoice_generated'
    | 'payment_confirmed'
    | 'review_request'
    | 'chat_message_client'
    
    // Provider notifications
    | 'provider_welcome'
    | 'new_mission_available'
    | 'mission_assigned'
    | 'mission_reminder'
    | 'client_modification'
    | 'payment_received'
    | 'remuneration_available'
    | 'chat_message_provider'
    
    // System notifications
    | 'system_maintenance'
    | 'newsletter'
    | 'technical_support';
    
  recipient: {
    email: string;
    name: string;
    firstName?: string;
  };
  
  data: {
    serviceName?: string;
    serviceDescription?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    address?: string;
    price?: number;
    providerName?: string;
    clientName?: string;
    bookingId?: string;
    message?: string;
    invoiceNumber?: string;
    amount?: number;
    rating?: number;
    reminderType?: '24h' | '2h';
    reason?: string;
    newDate?: string;
    newTime?: string;
  };
}

const getModernEmailTemplate = (type: string, recipient: any, data: any) => {
  const firstName = recipient.firstName || recipient.name.split(' ')[0] || 'Client';
  const bikawoSignature = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #9ca3af; font-size: 14px; font-style: italic;">
        💝 Avec toute notre tendresse,<br>
        <strong style="color: #2563eb;">L'équipe Bikawo</strong> ❤️
      </p>
    </div>
  `;

  const templates = {
    // 🌟 NOTIFICATIONS CLIENTS
    client_welcome: {
      subject: `🎉 Bienvenue dans la famille Bikawo, ${firstName} !`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; overflow: hidden;">
          <div style="background: white; margin: 4px; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🌟 Bienvenue ${firstName} !</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Vous faites maintenant partie de notre belle communauté</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Nous sommes ravis de vous accueillir sur Bikawo ! 🎊<br>
                Votre compte a été créé avec succès et vous pouvez dès maintenant découvrir tous nos services.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">✨ Ce qui vous attend :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Des services de qualité à domicile</li>
                  <li style="margin-bottom: 8px;">Des prestataires vérifiés et bienveillants</li>
                  <li style="margin-bottom: 8px;">Un suivi personnalisé de vos demandes</li>
                  <li style="margin-bottom: 8px;">Une équipe dédiée à votre satisfaction</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🚀 Découvrir nos services
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 25px;">
                Des questions ? Notre équipe est là pour vous accompagner !<br>
                📧 <a href="mailto:contact@bikawo.com" style="color: #667eea;">contact@bikawo.com</a> | 📞 01 23 45 67 89
              </p>
            </div>
            ${bikawoSignature}
          </div>
        </div>
      `
    },

    booking_confirmation: {
      subject: `✅ Votre réservation est confirmée - ${data.serviceName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✅ Réservation confirmée !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Tout est prêt pour votre prestation</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Excellente nouvelle ! Votre réservation a été confirmée avec succès. 🎉<br>
              Nous avons hâte de vous offrir un service exceptionnel !
            </p>
            
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #10b981;">
              <h3 style="color: #10b981; margin: 0 0 20px 0; font-size: 20px; text-align: center;">📋 Détails de votre réservation</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                  <strong style="color: #065f46;">Service :</strong>
                  <span style="color: #374151;">${data.serviceName}</span>
                </div>
                ${data.providerName ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                    <strong style="color: #065f46;">Prestataire :</strong>
                    <span style="color: #374151;">${data.providerName}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                  <strong style="color: #065f46;">Date :</strong>
                  <span style="color: #374151;">${data.bookingDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                  <strong style="color: #065f46;">Horaire :</strong>
                  <span style="color: #374151;">${data.startTime}${data.endTime ? ` - ${data.endTime}` : ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                  <strong style="color: #065f46;">Adresse :</strong>
                  <span style="color: #374151;">${data.address}</span>
                </div>
                ${data.price ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 18px;">
                    <strong style="color: #065f46;">Prix :</strong>
                    <strong style="color: #10b981;">${data.price}€</strong>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">📱 Prochaines étapes :</h4>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 5px;">Vous recevrez des rappels automatiques avant votre rendez-vous</li>
                <li style="margin-bottom: 5px;">Le prestataire pourra vous contacter si nécessaire</li>
                <li style="margin-bottom: 5px;">Après la prestation, vous pourrez laisser un avis</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}/espace-personnel" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                📱 Gérer mes réservations
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    booking_reminder_24h: {
      subject: `⏰ Rappel : Votre prestation ${data.serviceName} demain`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⏰ Rappel bienveillant</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Votre prestation a lieu demain !</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Nous espérons que vous allez bien ! 😊<br>
              Nous vous rappelons gentiment que votre prestation <strong>${data.serviceName}</strong> est programmée demain.
            </p>
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px solid #f59e0b;">
              <h3 style="color: #d97706; margin: 0 0 15px 0; text-align: center;">📅 Demain à ${data.startTime}</h3>
              <div style="text-align: center; color: #92400e;">
                <p style="margin: 5px 0;"><strong>Service :</strong> ${data.serviceName}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${data.address}</p>
                ${data.providerName ? `<p style="margin: 5px 0;"><strong>Prestataire :</strong> ${data.providerName}</p>` : ''}
              </div>
            </div>
            
            <div style="background: #f0f4ff; padding: 18px; border-radius: 10px; margin: 20px 0;">
              <h4 style="color: #3730a3; margin: 0 0 10px 0;">💡 Petits conseils pour demain :</h4>
              <ul style="margin: 5px 0; padding-left: 20px; color: #374151; font-size: 14px;">
                <li style="margin-bottom: 5px;">Assurez-vous d'être disponible à l'heure convenue</li>
                <li style="margin-bottom: 5px;">Préparez l'espace si nécessaire</li>
                <li style="margin-bottom: 5px;">Gardez votre téléphone à portée de main</li>
              </ul>
            </div>
            
            <p style="font-size: 15px; color: #6b7280; text-align: center;">
              Questions de dernière minute ? Nous sommes là ! 🤝<br>
              📧 contact@bikawo.com | 📞 01 23 45 67 89
            </p>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    booking_reminder_2h: {
      subject: `🔔 C'est bientôt ! Votre ${data.serviceName} dans 2h`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔔 C'est bientôt !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Plus que 2 heures avant votre prestation</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Le moment approche ! 🌟<br>
              Votre prestation <strong>${data.serviceName}</strong> commence dans seulement 2 heures.
            </p>
            
            <div style="background: #faf5ff; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px solid #8b5cf6; text-align: center;">
              <h3 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 20px;">⏰ Aujourd'hui à ${data.startTime}</h3>
              <p style="color: #581c87; margin: 10px 0; font-size: 16px;">${data.serviceName}</p>
              <p style="color: #6b46c1; margin: 5px 0;">📍 ${data.address}</p>
              ${data.providerName ? `<p style="color: #6b46c1; margin: 5px 0;">👤 ${data.providerName}</p>` : ''}
            </div>
            
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="color: #065f46; margin: 0; font-weight: 600;">
                🎯 Votre prestataire est en route ou va bientôt partir !
              </p>
            </div>
            
            <p style="font-size: 15px; color: #6b7280; text-align: center; margin-top: 25px;">
              Besoin d'aide urgente ?<br>
              📞 <strong>01 23 45 67 89</strong> (support immédiat)
            </p>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 NOTIFICATIONS PRESTATAIRES
    provider_welcome: {
      subject: `🎊 Bienvenue dans l'équipe Bikawo, ${firstName} !`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 26px;">🎊 Bienvenue dans l'équipe !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Vous êtes maintenant prestataire Bikawo</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Félicitations ! 🎉 Votre candidature a été acceptée et vous faites maintenant officiellement partie de notre belle équipe de prestataires.
            </p>
            
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #059669;">
              <h3 style="color: #059669; margin: 0 0 15px 0;">🌟 Vos avantages Bikawo :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">Missions régulières dans votre zone</li>
                <li style="margin-bottom: 8px;">Paiements sécurisés et rapides</li>
                <li style="margin-bottom: 8px;">Support dédié 7j/7</li>
                <li style="margin-bottom: 8px;">Formation continue et conseils personnalisés</li>
                <li style="margin-bottom: 8px;">Assurance responsabilité civile incluse</li>
              </ul>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">🚀 Prochaines étapes :</h4>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 5px;">Complétez votre profil prestataire</li>
                <li style="margin-bottom: 5px;">Définissez vos disponibilités</li>
                <li style="margin-bottom: 5px;">Activez les notifications de missions</li>
                <li style="margin-bottom: 5px;">Commencez à recevoir des demandes !</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}/espace-prestataire" 
                 style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                🏠 Accéder à mon espace
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    new_mission_available: {
      subject: `🎯 Nouvelle mission disponible - ${data.serviceName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎯 Nouvelle mission !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Une mission correspond à votre profil</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Excellente nouvelle ! 🌟<br>
              Une nouvelle mission correspondant parfaitement à vos compétences et votre zone d'intervention est disponible.
            </p>
            
            <div style="background: #dbeafe; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 20px 0; text-align: center;">📋 Détails de la mission</h3>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bfdbfe;">
                  <strong style="color: #1e3a8a;">Service :</strong>
                  <span style="color: #374151;">${data.serviceName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bfdbfe;">
                  <strong style="color: #1e3a8a;">Date :</strong>
                  <span style="color: #374151;">${data.bookingDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bfdbfe;">
                  <strong style="color: #1e3a8a;">Horaire :</strong>
                  <span style="color: #374151;">${data.startTime}${data.endTime ? ` - ${data.endTime}` : ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bfdbfe;">
                  <strong style="color: #1e3a8a;">Zone :</strong>
                  <span style="color: #374151;">${data.address}</span>
                </div>
                ${data.price ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 18px;">
                    <strong style="color: #1e3a8a;">Rémunération :</strong>
                    <strong style="color: #059669;">${data.price}€</strong>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 18px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="color: #92400e; margin: 0; font-weight: 600;">
                ⚡ Réagissez vite ! Les meilleures missions partent rapidement.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}/espace-prestataire" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                ✅ Accepter la mission
              </a>
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}/espace-prestataire" 
                 style="display: inline-block; background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                ❌ Décliner
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 TEMPLATE PAR DÉFAUT
    default: {
      subject: `📧 Notification Bikawo`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📧 Notification Bikawo</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Vous avez reçu une nouvelle notification de la part de l'équipe Bikawo.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.com'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                Voir sur Bikawo
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    }
  };

  return templates[type as keyof typeof templates] || templates.default;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestData: ModernNotificationRequest = await req.json();
    console.log(`[MODERN-NOTIFICATION] Processing ${requestData.type} for ${requestData.recipient.email}`);

    const template = getModernEmailTemplate(requestData.type, requestData.recipient, requestData.data);

    // Envoyer l'email via Resend
    const emailResult = await resend.emails.send({
      from: "Bikawo 💝 <notifications@bikawo.com>",
      to: [requestData.recipient.email],
      subject: template.subject,
      html: template.html,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    // Enregistrer dans les logs de notifications
    await supabase.from('notification_logs').insert({
      user_email: requestData.recipient.email,
      notification_type: 'email',
      subject: template.subject,
      content: template.html,
      entity_type: 'booking',
      entity_id: requestData.data.bookingId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      email_id: emailResult.data?.id
    });

    console.log(`[MODERN-NOTIFICATION] Email sent successfully:`, emailResult.data);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResult.data?.id,
      type: requestData.type,
      recipient: requestData.recipient.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[MODERN-NOTIFICATION] Error:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});