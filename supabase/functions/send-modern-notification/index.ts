import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    | 'technical_support'
    // Custom requests
    | 'custom_request_received'
    | 'custom_request_admin'
    | 'custom_request_status_update'
    // Status-change notifications
    | 'provider_assigned'
    | 'dispute_opened';
    
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
                <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🚀 Découvrir nos services
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 25px;">
                Des questions ? Notre équipe est là pour vous accompagner !<br>
                📧 <a href="mailto:contact@bikawo.com" style="color: #667eea;">contact@bikawo.com</a> | 📞 06 09 08 53 90
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
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel" 
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
              📧 contact@bikawo.com | 📞 06 09 08 53 90
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
              📞 <strong>06 09 08 53 90</strong> (support immédiat)
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
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-prestataire" 
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
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-prestataire" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                ✅ Accepter la mission
              </a>
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-prestataire" 
                 style="display: inline-block; background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                ❌ Décliner
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 ACCUSÉ DE RÉCEPTION — DEMANDE PERSONNALISÉE (CLIENT)
    custom_request_received: {
      subject: `📩 Demande bien reçue — nous l'étudions pour vous`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📩 Demande bien reçue !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Notre équipe va l'étudier et vous répond très vite</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Merci pour votre confiance ! Votre demande personnalisée a bien été enregistrée.<br>
              Notre équipe va l'analyser et vous proposera une solution adaptée à vos besoins.
            </p>

            <div style="background: #fffbeb; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #f59e0b;">
              <h3 style="color: #d97706; margin: 0 0 20px 0; font-size: 18px; text-align: center;">📋 Récapitulatif de votre demande</h3>
              <div style="display: grid; gap: 10px;">
                ${data.serviceDescription ? `
                  <div style="padding: 10px 0; border-bottom: 1px solid #fde68a;">
                    <strong style="color: #92400e;">Votre besoin :</strong>
                    <p style="margin: 6px 0 0 0; color: #374151; line-height: 1.5;">${data.serviceDescription}</p>
                  </div>
                ` : ''}
                ${data.address ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a;">
                    <strong style="color: #92400e;">📍 Adresse :</strong>
                    <span style="color: #374151; text-align: right;">${data.address}</span>
                  </div>
                ` : ''}
                ${data.bookingDate && data.bookingDate !== 'À définir' ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a;">
                    <strong style="color: #92400e;">📅 Date souhaitée :</strong>
                    <span style="color: #374151;">${data.bookingDate}${data.startTime && data.startTime !== 'À définir' ? ' à ' + data.startTime : ''}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <strong style="color: #92400e;">🔖 Référence :</strong>
                  <span style="color: #9ca3af; font-size: 12px;">${data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
              <h4 style="color: #0369a1; margin: 0 0 12px 0;">🕐 Prochaines étapes :</h4>
              <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                <li>Notre équipe étudie votre demande sous <strong>24 à 48h</strong></li>
                <li>Nous vous contactons par email ou téléphone pour vous proposer une solution</li>
                <li>Une fois validée, vous recevrez une confirmation de réservation</li>
              </ul>
            </div>

            <div style="background: #fdf2f8; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="color: #9d174d; font-size: 14px; margin: 0;">
                💬 Une question ? Répondez simplement à cet email ou contactez-nous.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                📱 Suivre ma demande
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 NOTIFICATION ADMIN — NOUVELLE DEMANDE PERSONNALISÉE
    custom_request_admin: {
      subject: `🔔 Nouvelle demande personnalisée — ${data.clientName || 'Client'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">🔔 Nouvelle demande personnalisée</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">À traiter dans le back-office</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #f5f3ff; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #ddd6fe;">
              <h3 style="color: #5b21b6; margin: 0 0 15px 0;">👤 Client</h3>
              <p style="margin: 4px 0; color: #374151;"><strong>Nom :</strong> ${data.clientName}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>Référence :</strong> ${data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : 'N/A'}</p>
            </div>

            <div style="background: #fffbeb; padding: 20px; border-radius: 10px; border: 1px solid #fde68a;">
              <h3 style="color: #d97706; margin: 0 0 15px 0;">📋 Détails de la demande</h3>
              ${data.serviceDescription ? `<p style="margin: 4px 0; color: #374151; line-height: 1.5;"><strong>Description :</strong><br>${data.serviceDescription}</p>` : ''}
              ${data.address ? `<p style="margin: 8px 0 4px 0; color: #374151;"><strong>Adresse :</strong> ${data.address}</p>` : ''}
              ${data.bookingDate && data.bookingDate !== 'À définir' ? `<p style="margin: 4px 0; color: #374151;"><strong>Date souhaitée :</strong> ${data.bookingDate}${data.startTime && data.startTime !== 'À définir' ? ' à ' + data.startTime : ''}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/modern-admin/demandes"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                🔗 Traiter dans l'admin
              </a>
            </div>
          </div>
        </div>
      `
    },

    // 🌟 MISSION DÉMARRÉE (client)
    mission_started: {
      subject: `🚀 Votre prestation a commencé - ${data.serviceName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚀 C'est parti !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Votre prestation vient de commencer</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Excellente nouvelle ! <strong>${data.providerName || 'Votre prestataire'}</strong> vient de démarrer votre prestation <strong>${data.serviceName}</strong>. 🌟
            </p>
            <div style="background: #e0f2fe; padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px solid #0ea5e9; text-align: center;">
              <p style="color: #0369a1; font-size: 18px; font-weight: 600; margin: 0;">⏱️ Prestation en cours</p>
              ${data.providerName ? `<p style="color: #374151; margin: 8px 0 0 0;">Prestataire : <strong>${data.providerName}</strong></p>` : ''}
            </div>
            <div style="background: #f0f9ff; padding: 18px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <p style="color: #0369a1; margin: 0; font-size: 14px;">
                💬 Vous pouvez contacter votre prestataire via la messagerie si besoin.<br>
                À la fin de la prestation, vous recevrez un email pour donner votre avis.
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                📱 Suivre ma prestation
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 MISSION TERMINÉE (client)
    mission_completed: {
      subject: `✅ Prestation terminée - Donnez votre avis !`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Prestation terminée !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Merci de nous avoir fait confiance</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Votre prestation <strong>${data.serviceName}</strong> est terminée. Nous espérons que tout s'est parfaitement bien passé ! 🌟
            </p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px solid #10b981;">
              <div style="display: grid; gap: 8px;">
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
                ${data.price ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <strong style="color: #065f46;">Montant :</strong>
                    <strong style="color: #10b981;">${data.price}€</strong>
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="background: #fefce8; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #fbbf24; text-align: center;">
              <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">⭐ Votre avis compte énormément !</p>
              <p style="color: #78350f; font-size: 14px; margin: 0;">Aidez-nous à améliorer notre service en partageant votre expérience.</p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                ⭐ Laisser mon avis
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 PAIEMENT REÇU (prestataire)
    payment_received: {
      subject: `💳 Paiement reçu - ${data.serviceName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">💳 Paiement reçu !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Votre rémunération est disponible</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Bonne nouvelle ! Vous avez reçu un paiement pour votre mission <strong>${data.serviceName}</strong>. 🎉
            </p>
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #059669; text-align: center;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 8px 0;">Montant reçu</p>
              <p style="color: #059669; font-size: 36px; font-weight: 700; margin: 0;">${data.amount || data.price || '—'}€</p>
              ${data.serviceName ? `<p style="color: #374151; font-size: 14px; margin: 8px 0 0 0;">Mission : ${data.serviceName}</p>` : ''}
            </div>
            <div style="background: #eff6ff; padding: 18px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                ℹ️ Le virement sera effectué selon votre calendrier de paiement habituel (J+1 à J+3 ouvrés).
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-prestataire"
                 style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                💼 Voir mon espace
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 PRESTATAIRE ASSIGNÉ (client)
    provider_assigned: {
      subject: `👤 Votre prestataire est confirmé - ${data.serviceName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">👤 Prestataire assigné !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Tout est prêt pour votre prestation</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Super nouvelle ! Un prestataire a été assigné à votre réservation. 🎊
            </p>
            <div style="background: #eef2ff; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #6366f1;">
              <h3 style="color: #4338ca; margin: 0 0 18px 0; text-align: center; font-size: 18px;">📋 Votre prestation</h3>
              <div style="display: grid; gap: 10px;">
                ${data.serviceName ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
                    <strong style="color: #3730a3;">Service :</strong>
                    <span style="color: #374151;">${data.serviceName}</span>
                  </div>
                ` : ''}
                ${data.providerName ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
                    <strong style="color: #3730a3;">Prestataire :</strong>
                    <span style="color: #374151; font-weight: 600;">${data.providerName}</span>
                  </div>
                ` : ''}
                ${data.bookingDate ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
                    <strong style="color: #3730a3;">Date :</strong>
                    <span style="color: #374151;">${data.bookingDate}${data.startTime ? ' à ' + data.startTime : ''}</span>
                  </div>
                ` : ''}
                ${data.address ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <strong style="color: #3730a3;">Adresse :</strong>
                    <span style="color: #374151; text-align: right;">${data.address}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="color: #065f46; margin: 0; font-weight: 600;">
                🔔 Vous recevrez un rappel 24h et 2h avant votre prestation.
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                📱 Voir ma réservation
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 RÉSERVATION ACCEPTÉE (client)
    booking_accepted: {
      subject: `✅ Bonne nouvelle ! Votre réservation est acceptée`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✅ Réservation acceptée !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Le prestataire a confirmé votre demande</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Excellente nouvelle ! ${data.providerName ? `<strong>${data.providerName}</strong> a accepté` : 'Votre réservation a été acceptée'} et votre prestation est confirmée. 🎉
            </p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px solid #10b981;">
              <div style="display: grid; gap: 10px;">
                ${data.serviceName ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                    <strong style="color: #065f46;">Service :</strong>
                    <span>${data.serviceName}</span>
                  </div>
                ` : ''}
                ${data.bookingDate ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                    <strong style="color: #065f46;">Date :</strong>
                    <span>${data.bookingDate}${data.startTime ? ' à ' + data.startTime : ''}</span>
                  </div>
                ` : ''}
                ${data.address ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <strong style="color: #065f46;">Adresse :</strong>
                    <span>${data.address}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                📱 Voir ma réservation
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 RÉSERVATION REFUSÉE (client)
    booking_rejected: {
      subject: `😔 Votre réservation n'a pas pu être honorée`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">😔 Réservation non disponible</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Nous sommes navrés pour ce contretemps</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Nous sommes sincèrement désolés. Votre réservation pour <strong>${data.serviceName || 'votre service'}</strong>${data.bookingDate ? ` du ${data.bookingDate}` : ''} n'a pas pu être honorée.
            </p>
            ${data.reason ? `
              <div style="background: #fff7ed; padding: 16px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f97316;">
                <p style="color: #9a3412; margin: 0;"><strong>Raison :</strong> ${data.reason}</p>
              </div>
            ` : ''}
            <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">💡 Que faire maintenant ?</h4>
              <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                <li>Choisir un autre créneau disponible</li>
                <li>Contacter notre équipe pour trouver un prestataire alternatif</li>
                <li>Nous sommes là pour vous aider !</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}"
                 style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600; margin-right: 10px;">
                🔄 Nouvelle réservation
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
              Besoin d'aide ? 📧 contact@bikawo.com | 📞 06 09 08 53 90
            </p>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 RÉSERVATION ANNULÉE (client)
    booking_cancelled: {
      subject: `❌ Votre réservation a été annulée`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">❌ Réservation annulée</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Nous espérons vous revoir bientôt</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Votre réservation${data.serviceName ? ` pour <strong>${data.serviceName}</strong>` : ''}${data.bookingDate ? ` du ${data.bookingDate}` : ''} a été annulée.
            </p>
            ${data.reason ? `
              <div style="background: #f9fafb; padding: 16px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6b7280;">
                <p style="color: #4b5563; margin: 0;"><strong>Motif d'annulation :</strong> ${data.reason}</p>
              </div>
            ` : ''}
            <div style="background: #eff6ff; padding: 18px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                💳 Si vous avez payé, le remboursement sera effectué automatiquement sous 5 à 10 jours ouvrés.<br>
                Des questions ? Contactez-nous à <strong>contact@bikawo.com</strong>
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}"
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                🔄 Faire une nouvelle réservation
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 DEMANDE D'AVIS (client)
    review_request: {
      subject: `⭐ Donnez votre avis sur votre prestation Bikawo`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⭐ Votre avis compte !</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Aidez-nous à améliorer nos services</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Votre prestation <strong>${data.serviceName}</strong> s'est terminée. 🎉<br>
              Votre expérience est précieuse pour nous et pour la communauté Bikawo !
            </p>
            <div style="background: #fefce8; padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px solid #fbbf24; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
              <p style="color: #92400e; font-size: 16px; margin: 0;">
                Comment s'est passée votre prestation${data.providerName ? ` avec ${data.providerName}` : ''} ?
              </p>
            </div>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                💝 Votre avis aide les futurs clients à choisir les meilleurs prestataires.
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                ⭐ Laisser mon avis maintenant
              </a>
            </div>
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">
              Ce lien est valable 7 jours. Référence : ${data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : 'N/A'}
            </p>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 LITIGE OUVERT — NOTIFICATION ADMIN
    dispute_opened: {
      subject: `🚨 Nouveau litige ouvert — ${data.clientName || 'Client'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">🚨 Nouveau litige ouvert</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">À traiter sous 72h ouvrées</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #fecaca;">
              <h3 style="color: #b91c1c; margin: 0 0 12px 0;">👤 Client</h3>
              <p style="margin: 4px 0; color: #374151;"><strong>Nom :</strong> ${data.clientName || 'Non renseigné'}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>Référence réservation :</strong> ${data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : 'N/A'}</p>
            </div>
            <div style="background: #fff7ed; padding: 20px; border-radius: 10px; border: 1px solid #fed7aa;">
              <h3 style="color: #c2410c; margin: 0 0 12px 0;">📋 Détails du litige</h3>
              ${data.serviceDescription ? `<p style="margin: 4px 0; color: #374151; line-height: 1.5;"><strong>Description :</strong><br>${data.serviceDescription}</p>` : ''}
              ${data.message ? `<p style="margin: 8px 0 4px 0; color: #374151;"><strong>Type :</strong> ${data.message}</p>` : ''}
              ${data.address ? `<p style="margin: 4px 0; color: #374151;"><strong>Adresse :</strong> ${data.address}</p>` : ''}
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/modern-admin/litiges"
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                🔗 Traiter le litige
              </a>
            </div>
          </div>
        </div>
      `
    },

    // 🌟 MESSAGE CHAT — CLIENT
    chat_message_client: {
      subject: `💬 Nouveau message de ${data.providerName || 'votre prestataire'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">💬 Nouveau message</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">De la part de ${data.providerName || 'votre prestataire'}</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Vous avez reçu un message de <strong>${data.providerName || 'votre prestataire'}</strong> concernant votre prestation <strong>${data.serviceName}</strong>.
            </p>
            ${data.message ? `
              <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <p style="color: #1e40af; font-style: italic; margin: 0; line-height: 1.6;">"${data.message}"</p>
              </div>
            ` : ''}
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel"
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                💬 Répondre au message
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 MESSAGE CHAT — PRESTATAIRE
    chat_message_provider: {
      subject: `💬 Nouveau message de ${data.clientName || 'votre client'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">💬 Nouveau message</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">De la part de ${data.clientName || 'votre client'}</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Vous avez reçu un message de <strong>${data.clientName || 'votre client'}</strong> concernant la mission <strong>${data.serviceName}</strong>.
            </p>
            ${data.message ? `
              <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #059669;">
                <p style="color: #065f46; font-style: italic; margin: 0; line-height: 1.6;">"${data.message}"</p>
              </div>
            ` : ''}
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-prestataire"
                 style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                💬 Répondre au message
              </a>
            </div>
          </div>
          ${bikawoSignature}
        </div>
      `
    },

    // 🌟 MISE À JOUR STATUT DEMANDE PERSONNALISÉE
    custom_request_status_update: (() => {
      const statusStyles: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
        in_progress: { color: '#1d4ed8', bg: '#dbeafe', emoji: '⏳', label: 'En cours de traitement' },
        completed:   { color: '#065f46', bg: '#d1fae5', emoji: '✅', label: 'Traitée' },
        cancelled:   { color: '#374151', bg: '#f3f4f6', emoji: '❌', label: 'Annulée' },
      };
      const s = statusStyles[data.newStatus as string] || statusStyles.in_progress;
      return {
        subject: `${s.emoji} Votre demande Bikawo : ${s.label}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${s.color} 0%, ${s.color}cc 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">${s.emoji} Mise à jour de votre demande</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Statut : <strong>${s.label}</strong></p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #374151;">Bonjour ${firstName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Votre demande personnalisée a été mise à jour par notre équipe.
              </p>
              <div style="background: ${s.bg}; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${s.color};">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: ${s.color};">Demande :</p>
                <p style="margin: 0; color: #374151; line-height: 1.5;">${data.serviceDescription || 'Demande personnalisée'}</p>
                <p style="margin: 12px 0 0 0; font-weight: 600; color: ${s.color};">Nouveau statut : ${s.label}</p>
              </div>
              ${data.adminNote ? `
                <div style="background: #fffbeb; padding: 16px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0 0 6px 0; font-weight: 600; color: #92400e;">Message de l'équipe :</p>
                  <p style="margin: 0; color: #78350f; font-style: italic; line-height: 1.5;">"${data.adminNote}"</p>
                </div>
              ` : ''}
              <div style="text-align: center; margin: 25px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}/espace-personnel?tab=demandes"
                   style="display: inline-block; background: linear-gradient(135deg, ${s.color} 0%, ${s.color}cc 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                  Voir mes demandes
                </a>
              </div>
              <p style="font-size: 13px; color: #6b7280; text-align: center;">
                Des questions ? 📧 <a href="mailto:contact@bikawo.com" style="color: ${s.color};">contact@bikawo.com</a>
              </p>
            </div>
            ${bikawoSignature}
          </div>
        `
      };
    })(),

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
              <a href="${Deno.env.get('SITE_URL') || 'https://bikawo.fr'}" 
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
      from: "Bikawo - Votre assistant personnel au quotidien <notifications@bikawo.com>",
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