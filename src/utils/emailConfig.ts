export interface EmailTemplateConfig {
  subject: string;
  title: string;
  greeting: string;
  content: string;
  buttonText: string;
  footer: string;
  signature: string;
}

export interface NotificationConfig {
  title: string;
  message: string;
  actionText?: string;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplateConfig> = {
  confirmation: {
    subject: "🎉 Bienvenue sur Bikawo - Confirmez votre email",
    title: "Bienvenue sur Bikawo !",
    greeting: "Bonjour et bienvenue !",
    content: "Merci de vous être inscrit sur Bikawo. Pour finaliser votre inscription et accéder à tous nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.",
    buttonText: "Confirmer mon email",
    footer: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
    signature: "L'équipe Bikawo"
  },
  booking_request: {
    subject: "Nouvelle demande de réservation - {serviceName}",
    title: "Nouvelle demande de réservation",
    greeting: "Bonjour,",
    content: "Vous avez reçu une nouvelle demande de réservation pour vos services. Voici les détails :",
    buttonText: "Gérer ma demande",
    footer: "Connectez-vous à votre espace prestataire pour accepter ou refuser cette demande.",
    signature: "L'équipe Bikawo"
  },
  booking_accepted: {
    subject: "Réservation confirmée - {serviceName}",
    title: "Réservation confirmée !",
    greeting: "Excellente nouvelle !",
    content: "Votre réservation a été acceptée par le prestataire. Vous recevrez bientôt ses coordonnées pour finaliser les détails.",
    buttonText: "Voir mes réservations",
    footer: "Le prestataire vous contactera prochainement pour confirmer les détails.",
    signature: "L'équipe Bikawo"
  },
  booking_rejected: {
    subject: "Réservation non disponible - {serviceName}",
    title: "Réservation non disponible",
    greeting: "Nous sommes désolés,",
    content: "Malheureusement, le prestataire n'est pas disponible pour votre créneau demandé. Nous vous encourageons à essayer un autre créneau ou un autre prestataire.",
    buttonText: "Rechercher d'autres créneaux",
    footer: "Notre équipe reste à votre disposition pour vous aider à trouver une solution.",
    signature: "L'équipe Bikawo"
  },
  payment_processed: {
    subject: "Paiement reçu - {serviceName}",
    title: "Paiement confirmé",
    greeting: "Bonjour,",
    content: "Le paiement pour votre prestation a été traité avec succès. Les fonds seront versés sur votre compte selon les conditions convenues.",
    buttonText: "Voir mes gains",
    footer: "Consultez votre espace prestataire pour plus de détails sur vos revenus.",
    signature: "L'équipe Bikawo"
  },
  review_request: {
    subject: "Laissez votre avis - {serviceName}",
    title: "Comment s'est passée votre prestation ?",
    greeting: "Bonjour,",
    content: "Votre prestation est terminée ! Aidez les autres clients en partageant votre expérience avec ce prestataire.",
    buttonText: "Laisser un avis",
    footer: "Votre avis est important pour maintenir la qualité de nos services.",
    signature: "L'équipe Bikawo"
  },
  chat_message: {
    subject: "Nouveau message - {serviceName}",
    title: "Nouveau message reçu",
    greeting: "Bonjour,",
    content: "Vous avez reçu un nouveau message concernant votre réservation. Connectez-vous pour voir tous les messages et répondre.",
    buttonText: "Voir les messages",
    footer: "Restez en contact avec votre prestataire pour une expérience optimale.",
    signature: "L'équipe Bikawo"
  },
  request_accepted: {
    subject: "Votre demande de service a été acceptée - {serviceName}",
    title: "✅ Excellente nouvelle ! Votre demande a été acceptée",
    greeting: "Bonjour,",
    content: "Nous avons le plaisir de vous informer que votre demande de service a été acceptée par un de nos prestataires qualifiés. Votre prestataire va vous contacter prochainement pour finaliser les détails.",
    buttonText: "Voir le suivi de ma demande",
    footer: "Si vous avez des questions, n'hésitez pas à nous contacter.",
    signature: "L'équipe Bikawo"
  }
};

export const NOTIFICATION_TEMPLATES: Record<string, NotificationConfig> = {
  new_booking: {
    title: "Nouvelle réservation",
    message: "Vous avez reçu une nouvelle demande de réservation",
    actionText: "Voir les détails"
  },
  booking_confirmed: {
    title: "Réservation confirmée",
    message: "Votre réservation a été confirmée par le prestataire",
    actionText: "Voir ma réservation"
  },
  payment_received: {
    title: "Paiement reçu",
    message: "Un paiement a été traité pour votre prestation",
    actionText: "Voir mes gains"
  },
  new_message: {
    title: "Nouveau message",
    message: "Vous avez reçu un nouveau message",
    actionText: "Lire le message"
  },
  review_reminder: {
    title: "Laissez votre avis",
    message: "N'oubliez pas de laisser un avis sur votre prestation",
    actionText: "Laisser un avis"
  }
};

// Fonction pour remplacer les variables dans les templates
export const replaceTemplateVariables = (template: string, variables: Record<string, any>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value));
  });
  return result;
};

// Configuration par défaut de l'entreprise
export const COMPANY_CONFIG = {
  name: "Bikawo",
  domain: "bikawo.com",
  email: "contact@bikawo.com",
  supportEmail: "support@bikawo.com",
  websiteUrl: "https://bikawo.com",
  logoUrl: "https://bikawo.com/logo.png",
  colors: {
    primary: "#2563eb",
    secondary: "#059669",
    accent: "#dc2626"
  }
};