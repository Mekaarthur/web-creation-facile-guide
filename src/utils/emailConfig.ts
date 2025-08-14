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
  // E-mails Clients
  client_confirmation: {
    subject: "Merci de nous faire confiance 💛",
    title: "Votre demande a bien été reçue",
    greeting: "Bonjour {prenom_client},",
    content: "Votre demande pour {type_prestation} a bien été reçue. Nous mettons tout en œuvre pour trouver la personne idéale qui prendra soin de votre mission comme si c'était la sienne. 📅 {date} 📍 {lieu}.",
    buttonText: "Suivre ma demande",
    footer: "Nous vous tiendrons informé(e) de l'évolution de votre demande.",
    signature: "Avec toute notre attention, L'équipe Bikawo"
  },
  client_provider_found: {
    subject: "Nous avons trouvé votre perle rare ✨",
    title: "Excellente nouvelle !",
    greeting: "Bonjour {prenom_client},",
    content: "Bonne nouvelle ! {prenom_prestataire} est disponible pour vous aider. 📅 {date} à {heure} 💰 {prix}.",
    buttonText: "Confirmer ma mission",
    footer: "Cliquez pour confirmer votre mission ou contactez-nous si vous avez des questions.",
    signature: "Avec douceur et efficacité, L'équipe Bikawo"
  },
  client_mission_reminder: {
    subject: "Nous avons hâte de vous retrouver demain 🕊️",
    title: "Rappel de votre mission",
    greeting: "Bonjour {prenom_client},",
    content: "Petit rappel pour votre mission demain avec {prenom_prestataire}. 📅 {date} à {heure} 📍 {lieu}. Nous vous souhaitons une expérience fluide et sereine.",
    buttonText: "Voir les détails",
    footer: "En cas d'imprévu, n'hésitez pas à nous contacter.",
    signature: "À très bientôt, L'équipe Bikawo"
  },
  client_review_request: {
    subject: "Votre avis compte pour nous 🌸",
    title: "Comment s'est passée votre mission ?",
    greeting: "Bonjour {prenom_client},",
    content: "Nous espérons que {prenom_prestataire} a rendu votre journée plus simple. Votre avis nous aide à grandir et à offrir encore plus de douceur à nos clients.",
    buttonText: "Donner mon avis",
    footer: "Votre retour est précieux pour maintenir la qualité de nos services.",
    signature: "Merci pour votre confiance, L'équipe Bikawo"
  },
  
  // E-mails Prestataires
  provider_new_mission: {
    subject: "Une mission vous attend 💼",
    title: "Nouvelle mission disponible",
    greeting: "Bonjour {prenom_prestataire},",
    content: "Une mission est disponible près de chez vous : {type_prestation} – {lieu} ⏱ {duree} 💰 {tarif}. Cliquez vite, le premier qui accepte remporte la mission !",
    buttonText: "Accepter la mission",
    footer: "Cette mission est disponible pour un temps limité.",
    signature: "Merci d'être un pilier de notre communauté, L'équipe Bikawo"
  },
  provider_mission_reminder: {
    subject: "Rendez-vous demain avec {prenom_client} 🌟",
    title: "Rappel de votre mission",
    greeting: "Bonjour {prenom_prestataire},",
    content: "Vous avez rendez-vous demain avec {prenom_client} pour {type_prestation}. 📅 {date} à {heure} 📍 {lieu}. Merci de mettre tout votre savoir-faire et votre bienveillance dans cette mission.",
    buttonText: "Voir les détails",
    footer: "En cas d'imprévu, contactez-nous immédiatement.",
    signature: "Avec gratitude, L'équipe Bikawo"
  },
  provider_review_request: {
    subject: "Comment s'est passée votre mission ? 🤝",
    title: "Votre retour nous intéresse",
    greeting: "Bonjour {prenom_prestataire},",
    content: "Votre retour sur {prenom_client} nous aide à bâtir une communauté toujours plus fiable et chaleureuse.",
    buttonText: "Donner mon avis",
    footer: "Votre feedback contribue à l'amélioration continue de nos services.",
    signature: "Merci d'être l'âme de Bikawo, L'équipe Bikawo"
  },
  
  // E-mails système existants
  confirmation: {
    subject: "🎉 Bienvenue sur Bikawo - Confirmez votre email",
    title: "Bienvenue sur Bikawo !",
    greeting: "Bonjour et bienvenue !",
    content: "Merci de vous être inscrit sur Bikawo. Pour finaliser votre inscription et accéder à tous nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.",
    buttonText: "Confirmer mon email",
    footer: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
    signature: "Avec tendresse, l'équipe Bikawo"
  },
  payment_processed: {
    subject: "Paiement reçu - {serviceName}",
    title: "Paiement confirmé",
    greeting: "Bonjour,",
    content: "Le paiement pour votre prestation a été traité avec succès. Les fonds seront versés sur votre compte selon les conditions convenues.",
    buttonText: "Voir mes gains",
    footer: "Consultez votre espace prestataire pour plus de détails sur vos revenus.",
    signature: "Avec tendresse, l'équipe Bikawo"
  }
};

export const NOTIFICATION_TEMPLATES: Record<string, NotificationConfig> = {
  // Notifications Clients
  client_confirmation: {
    title: "Demande reçue",
    message: "✅ Merci {prenom_client} ! Nous cherchons la personne parfaite pour votre mission.",
    actionText: "Suivre"
  },
  client_provider_found: {
    title: "Prestataire trouvé",
    message: "🎉 {prenom_prestataire} est disponible pour vous aider le {date}.",
    actionText: "Confirmer"
  },
  client_mission_reminder: {
    title: "Rappel mission",
    message: "⏰ N'oubliez pas votre mission demain avec {prenom_prestataire}.",
    actionText: "Détails"
  },
  
  // Notifications Prestataires
  provider_new_mission: {
    title: "Nouvelle mission",
    message: "💼 Nouvelle mission dispo à {lieu} : {type_prestation} ({tarif}).",
    actionText: "Accepter"
  },
  provider_mission_reminder: {
    title: "Rappel mission",
    message: "⏰ Mission demain avec {prenom_client} – {type_prestation}.",
    actionText: "Détails"
  },
  
  // Notifications communes
  review_request_client: {
    title: "Votre avis compte",
    message: "🌸 Votre avis compte pour nous. Partagez votre expérience.",
    actionText: "Donner avis"
  },
  review_request_provider: {
    title: "Votre retour",
    message: "🌸 Votre avis compte pour nous. Partagez votre expérience.",
    actionText: "Donner avis"
  },
  
  // Notifications système existantes
  new_booking: {
    title: "Nouvelle réservation",
    message: "Vous avez reçu une nouvelle demande de réservation",
    actionText: "Voir les détails"
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
    primary: "#667eea",
    secondary: "#764ba2",
    accent: "#dc2626"
  },
  tonality: {
    enabled: true,
    style: "tendre", // tendre, professionnel, décontracté
    useEmojis: true,
    warmGreetings: true
  }
};