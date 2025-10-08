import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      "nav.home": "Accueil",
      "nav.services": "Services",
      "nav.about": "À propos",
      "nav.contact": "Contact",
      "nav.help": "Aide",
      "nav.login": "Connexion",
      "nav.signup": "Inscription",
      "nav.jobs": "Nous Recrutons",
      "nav.blog": "Blog",
      "nav.providerSpace": "Espace Prestataire",
      
      // Hero section
      "hero.title": "Débordé(e) par",
      "hero.titleHighlight": "le quotidien ?",
      "hero.subtitle": "Déléguer vos missions quotidiennes n'a jamais été aussi simple",
      "hero.ctaPrimary": "Déléguer mes missions",
      "hero.ctaSecondary": "Postuler",
      "hero.statsNumber": "2,500+",
      "hero.statsLabel": "familles sereines",
      "hero.badge": "Disponible 24h/7j",
      
      // Services
      "services.title": "Nos Services",
      "services.titleHighlight": "BIKAWO",
      "services.subtitle": "Découvrez nos solutions personnalisées pour vous accompagner au quotidien",
      
      // Footer
      "footer.title": "Bikawô",
      "footer.description": "Votre partenaire familial de confiance dans toute la France. Nous vous accompagnons avec humanité pour un quotidien plus serein.",
      "footer.phone": "Téléphone",
      "footer.email": "Email",
      "footer.address": "Adresse",
      "footer.services": "Services",
      "footer.company": "Entreprise",
      "footer.support": "Support",
      "footer.about": "À propos",
      "footer.careers": "Carrières",
      "footer.partners": "Partenaires",
      "footer.helpCenter": "Centre d'aide",
      "footer.faq": "FAQ",
      "footer.status": "Status",
      "footer.copyright": "© 2024 Bikawô. Tous droits réservés.",
      "footer.privacy": "Confidentialité",
      "footer.terms": "CGU",
      "footer.legal": "Mentions légales",
      "footer.support24": "Support 24h/7j",
      
      // About
      "about.badge": "À propos de nous",
      "about.title": "Votre partenaire familial",
      "about.titleHighlight": "de confiance",
      "about.subtitle": "Bikawo vous accompagne dans votre quotidien avec douceur, fiabilité et humanité, pour un foyer plus léger, plus serein et plus harmonieux.",
      "about.statsLabel1": "Familles aidées",
      "about.statsDesc1": "et toujours plus chaque jour",
      "about.statsLabel2": "Service disponible",
      "about.statsDesc2": "24h/24 pour vous accompagner",
      "about.statsLabel3": "Satisfaction client",
      "about.statsDesc3": "Un taux qui nous rend fiers",
      "about.statsLabel4": "France couverte",
      "about.statsDesc4": "Partout où vous êtes",
      "about.storyTitle": "Notre histoire",
      "about.value1": "Humanité",
      "about.value1Desc": "Nous privilégions l'approche humaine dans chaque interaction, avec empathie et compréhension de vos besoins familiaux.",
      "about.value2": "Fiabilité",
      "about.value2Desc": "Nos experts Bika sont rigoureusement sélectionnés et formés pour vous offrir un service de qualité constant.",
      "about.value3": "Personnalisation",
      "about.value3Desc": "Chaque famille est unique. Nous adaptons nos services à votre rythme de vie et vos besoins spécifiques.",
      "about.valuesTitle": "Nos valeurs",
      "about.ctaServices": "Découvrir nos services",
      "about.ctaJoin": "Rejoindre l'équipe",
      
      // Contact
      "contact.badge": "Contact",
      "contact.title": "Besoin d'aide ?",
      "contact.titleHighlight": "Contactez-nous",
      "contact.subtitle": "Notre équipe d'experts est disponible 24h/24 pour répondre à toutes vos questions et vous accompagner dans vos projets.",
      "contact.methodsTitle": "Plusieurs façons de nous joindre",
      "contact.phone": "Téléphone",
      "contact.phoneTime": "Lun-Dim, 24h/24",
      "contact.email": "Email",
      "contact.emailTime": "Réponse sous 1h",
      "contact.chat": "Chat en direct",
      "contact.chatStatus": "Disponible maintenant",
      "contact.chatTime": "Réponse immédiate",
      "contact.address": "Adresse",
      "contact.addressDetails": "123 Rue de la Tech, Paris",
      "contact.addressTime": "Rendez-vous sur demande",
      "contact.hoursTitle": "Heures d'ouverture",
      "contact.hoursSubtitle": "Support disponible",
      "contact.weekdays": "Lundi - Vendredi",
      "contact.weekend": "Weekend",
      "contact.emergency": "Urgences",
      "contact.alwaysAvailable": "Toujours disponible",
      "contact.formTitle": "Envoyez-nous un message",
      "contact.formSubtitle": "Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.",
      "contact.civility": "Civilité",
      "contact.selectCivility": "Sélectionnez votre civilité",
      "contact.mr": "Monsieur",
      "contact.mrs": "Madame",
      "contact.fullName": "Nom complet",
      "contact.yourName": "Votre nom",
      "contact.emailLabel": "Email",
      "contact.yourEmail": "votre@email.com",
      "contact.subject": "Sujet",
      "contact.subjectPlaceholder": "De quoi voulez-vous parler ?",
      "contact.message": "Message",
      "contact.messagePlaceholder": "Décrivez votre demande en détail...",
      "contact.sending": "Envoi en cours...",
      "contact.send": "Envoyer le message",
      "contact.privacy": "Nous respectons votre vie privée et ne partageons jamais vos données",
      "contact.faqTitle": "Questions fréquentes",
      "contact.faqSubtitle": "Avant de nous contacter, consultez notre FAQ. Vous y trouverez peut-être déjà la réponse à votre question.",
      "contact.faqButton": "Consulter la FAQ",
      "contact.success": "✨ Message envoyé avec succès !",
      "contact.successMessage": "Notre équipe vous contactera dans les plus brefs délais.",
      
      // FAQ
      "faq.badge": "Tout savoir sur BIKAWO",
      "faq.title": "Questions fréquentes",
      "faq.titleHighlight": "sur nos services",
      "faq.subtitle": "Retrouvez toutes les réponses à vos questions sur nos services, tarifs et fonctionnement.",
      "faq.ctaTitle": "Une question spécifique ?",
      "faq.ctaSubtitle": "Notre équipe est là pour vous accompagner et répondre à toutes vos questions avec la douceur et l'attention que mérite votre famille.",
      "faq.ctaContact": "Nous contacter",
      "faq.ctaAppointment": "Prendre rendez-vous",
      
      // Why Bikawo
      "why.title": "Bikawo, c'est surtout…",
      "why.benefit1": "Pour nos clients : Zéro charge mentale",
      "why.benefit1Desc": "Confiez vos tâches et libérez votre esprit pour l'essentiel",
      "why.benefit2": "Pour nos prestataires : Revenus complémentaires",
      "why.benefit2Desc": "Opportunités flexibles pour étudiants, actifs, retraités, parents",
      "why.benefit3": "Pour tous : Épanouissement mutuel",
      "why.benefit3Desc": "Une communauté qui grandit ensemble, clients satisfaits et prestataires valorisés",
      
      // New Hero
      "newHero.title1": "Bikawo, votre assistant",
      "newHero.title2": "personnel au quotidien",
      "newHero.subtitle": "Nous vous libérons de la charge mentale pour que vous profitiez de ce qui compte vraiment.",
      "newHero.ctaReserve": "Réserver dès maintenant",
      "newHero.ctaProvider": "Devenir prestataire",
      "newHero.rating": "4,9/5 - 2500+ avis",
      "newHero.service": "Service 7j/7",
      "newHero.taxCredit": "Crédit d'impôt 50%",
      
      // CTAs
      "cta.book": "Réserver",
      "cta.becomeProvider": "Devenir pro",
      
      // Final CTA
      "finalCta.title": "Rejoignez la communauté Bikawo dès aujourd'hui !",
      "finalCta.subtitle": "Que vous ayez besoin d'accompagnement ou souhaitez valoriser vos compétences, Bikawo est fait pour vous !",
      "finalCta.client": "🛒 Je réserve un service",
      "finalCta.provider": "💼 Je propose mes services",
      "finalCta.members": "Déjà plus de 2500 membres actifs dans notre communauté",
      
      // Testimonials
      "testimonials.title": "Témoignages",
      
      // Job application
      "jobs.title": "Rejoignez Notre Équipe",
      "jobs.subtitle": "Devenez prestataire de services et développez votre activité",
      "jobs.apply": "Postuler",
      "jobs.form.firstName": "Prénom",
      "jobs.form.lastName": "Nom",
      "jobs.form.email": "Email",
      "jobs.form.phone": "Téléphone",
      "jobs.form.experience": "Années d'expérience",
      "jobs.form.availability": "Disponibilité",
      "jobs.form.motivation": "Motivation",
      "jobs.form.transport": "J'ai un moyen de transport",
      "jobs.form.certifications": "Certifications",
      "jobs.form.submit": "Envoyer ma candidature",
      "jobs.success": "Candidature envoyée !",
      "jobs.successMessage": "Votre candidature a été envoyée avec succès. Nous vous recontacterons rapidement.",
      "jobs.error": "Erreur",
      "jobs.errorMessage": "Veuillez remplir tous les champs obligatoires",
      "jobs.submitError": "Impossible d'envoyer votre candidature. Veuillez réessayer.",
      
      // Auth
      "auth.login": "Connexion",
      "auth.signup": "Inscription",
      "auth.email": "Email",
      "auth.password": "Mot de passe",
      "auth.fullName": "Nom complet",
      "auth.loginButton": "Se connecter",
      "auth.signupButton": "S'inscrire",
      "auth.signupSuccess": "Inscription réussie ! 🎉",
      "auth.signupSuccessMessage": "Un email de confirmation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.",
      "auth.loginError": "Erreur de connexion",
      "auth.signupError": "Erreur d'inscription",
      
      // Admin
      "admin.jobApplications": "Candidatures d'emploi",
      "admin.newApplications": "Nouvelles candidatures",
      "admin.viewDetails": "Voir détails",
      "admin.status": "Statut",
      "admin.pending": "En attente",
      "admin.approved": "Approuvée",
      "admin.rejected": "Rejetée",
      
      // Email confirmation
      "email.applicationReceived": "Candidature reçue avec succès",
      "email.prepareDocuments": "Préparez vos documents requis"
    }
  },
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.services": "Services",
      "nav.about": "About",
      "nav.contact": "Contact",
      "nav.help": "Help",
      "nav.login": "Login",
      "nav.signup": "Sign Up",
      "nav.jobs": "We're Hiring",
      "nav.blog": "Blog",
      "nav.providerSpace": "Provider Space",
      
      // Hero section
      "hero.title": "Overwhelmed by",
      "hero.titleHighlight": "daily life?",
      "hero.subtitle": "Delegating your daily tasks has never been easier",
      "hero.ctaPrimary": "Delegate my tasks",
      "hero.ctaSecondary": "Apply",
      "hero.statsNumber": "2,500+",
      "hero.statsLabel": "peaceful families",
      "hero.badge": "Available 24/7",
      
      // Services
      "services.title": "Our Services",
      "services.titleHighlight": "BIKAWO",
      "services.subtitle": "Discover our personalized solutions to support you daily",
      
      // Footer
      "footer.title": "Bikawô",
      "footer.description": "Your trusted family partner throughout France. We support you with humanity for a more peaceful daily life.",
      "footer.phone": "Phone",
      "footer.email": "Email",
      "footer.address": "Address",
      "footer.services": "Services",
      "footer.company": "Company",
      "footer.support": "Support",
      "footer.about": "About",
      "footer.careers": "Careers",
      "footer.partners": "Partners",
      "footer.helpCenter": "Help Center",
      "footer.faq": "FAQ",
      "footer.status": "Status",
      "footer.copyright": "© 2024 Bikawô. All rights reserved.",
      "footer.privacy": "Privacy",
      "footer.terms": "Terms",
      "footer.legal": "Legal Notice",
      "footer.support24": "24/7 Support",
      
      // About
      "about.badge": "About us",
      "about.title": "Your trusted",
      "about.titleHighlight": "family partner",
      "about.subtitle": "Bikawo supports you in your daily life with gentleness, reliability and humanity, for a lighter, more peaceful and harmonious home.",
      "about.statsLabel1": "Families helped",
      "about.statsDesc1": "and growing every day",
      "about.statsLabel2": "Service available",
      "about.statsDesc2": "24/7 to support you",
      "about.statsLabel3": "Customer satisfaction",
      "about.statsDesc3": "A rate we're proud of",
      "about.statsLabel4": "France covered",
      "about.statsDesc4": "Wherever you are",
      "about.storyTitle": "Our story",
      "about.value1": "Humanity",
      "about.value1Desc": "We prioritize the human approach in every interaction, with empathy and understanding of your family needs.",
      "about.value2": "Reliability",
      "about.value2Desc": "Our Bika experts are rigorously selected and trained to offer you consistent quality service.",
      "about.value3": "Personalization",
      "about.value3Desc": "Every family is unique. We adapt our services to your lifestyle and specific needs.",
      "about.valuesTitle": "Our values",
      "about.ctaServices": "Discover our services",
      "about.ctaJoin": "Join the team",
      
      // Contact
      "contact.badge": "Contact",
      "contact.title": "Need help?",
      "contact.titleHighlight": "Contact us",
      "contact.subtitle": "Our team of experts is available 24/7 to answer all your questions and support you in your projects.",
      "contact.methodsTitle": "Several ways to reach us",
      "contact.phone": "Phone",
      "contact.phoneTime": "Mon-Sun, 24/7",
      "contact.email": "Email",
      "contact.emailTime": "Response within 1h",
      "contact.chat": "Live chat",
      "contact.chatStatus": "Available now",
      "contact.chatTime": "Immediate response",
      "contact.address": "Address",
      "contact.addressDetails": "123 Tech Street, Paris",
      "contact.addressTime": "By appointment",
      "contact.hoursTitle": "Opening hours",
      "contact.hoursSubtitle": "Support available",
      "contact.weekdays": "Monday - Friday",
      "contact.weekend": "Weekend",
      "contact.emergency": "Emergencies",
      "contact.alwaysAvailable": "Always available",
      "contact.formTitle": "Send us a message",
      "contact.formSubtitle": "Fill out the form below and we'll get back to you quickly.",
      "contact.civility": "Title",
      "contact.selectCivility": "Select your title",
      "contact.mr": "Mr",
      "contact.mrs": "Mrs",
      "contact.fullName": "Full name",
      "contact.yourName": "Your name",
      "contact.emailLabel": "Email",
      "contact.yourEmail": "your@email.com",
      "contact.subject": "Subject",
      "contact.subjectPlaceholder": "What would you like to discuss?",
      "contact.message": "Message",
      "contact.messagePlaceholder": "Describe your request in detail...",
      "contact.sending": "Sending...",
      "contact.send": "Send message",
      "contact.privacy": "We respect your privacy and never share your data",
      "contact.faqTitle": "Frequently asked questions",
      "contact.faqSubtitle": "Before contacting us, check our FAQ. You may already find the answer to your question.",
      "contact.faqButton": "View FAQ",
      "contact.success": "✨ Message sent successfully!",
      "contact.successMessage": "Our team will contact you shortly.",
      
      // FAQ
      "faq.badge": "All about BIKAWO",
      "faq.title": "Frequently asked",
      "faq.titleHighlight": "questions",
      "faq.subtitle": "Find all the answers to your questions about our services, rates and operations.",
      "faq.ctaTitle": "Have a specific question?",
      "faq.ctaSubtitle": "Our team is here to support you and answer all your questions with the care and attention your family deserves.",
      "faq.ctaContact": "Contact us",
      "faq.ctaAppointment": "Make an appointment",
      
      // Why Bikawo
      "why.title": "Bikawo, it's all about...",
      "why.benefit1": "For our clients: Zero mental load",
      "why.benefit1Desc": "Delegate your tasks and free your mind for what matters",
      "why.benefit2": "For our providers: Additional income",
      "why.benefit2Desc": "Flexible opportunities for students, workers, retirees, parents",
      "why.benefit3": "For everyone: Mutual fulfillment",
      "why.benefit3Desc": "A community that grows together, satisfied clients and valued providers",
      
      // New Hero
      "newHero.title1": "Bikawo, your",
      "newHero.title2": "personal assistant",
      "newHero.subtitle": "We free you from mental load so you can focus on what really matters.",
      "newHero.ctaReserve": "Book now",
      "newHero.ctaProvider": "Become a provider",
      "newHero.rating": "4.9/5 - 2500+ reviews",
      "newHero.service": "Service 24/7",
      "newHero.taxCredit": "50% tax credit",
      
      // CTAs
      "cta.book": "Book",
      "cta.becomeProvider": "Become a pro",
      
      // Final CTA
      "finalCta.title": "Join the Bikawo community today!",
      "finalCta.subtitle": "Whether you need support or want to showcase your skills, Bikawo is for you!",
      "finalCta.client": "🛒 I book a service",
      "finalCta.provider": "💼 I offer my services",
      "finalCta.members": "Already over 2500 active members in our community",
      
      // Testimonials
      "testimonials.title": "Testimonials",
      
      // Job application
      "jobs.title": "Join Our Team",
      "jobs.subtitle": "Become a service provider and grow your business",
      "jobs.apply": "Apply",
      "jobs.form.firstName": "First Name",
      "jobs.form.lastName": "Last Name",
      "jobs.form.email": "Email",
      "jobs.form.phone": "Phone",
      "jobs.form.experience": "Years of experience",
      "jobs.form.availability": "Availability",
      "jobs.form.motivation": "Motivation",
      "jobs.form.transport": "I have transportation",
      "jobs.form.certifications": "Certifications",
      "jobs.form.submit": "Submit Application",
      "jobs.success": "Application Sent!",
      "jobs.successMessage": "Your application has been sent successfully. We will contact you soon.",
      "jobs.error": "Error",
      "jobs.errorMessage": "Please fill in all required fields",
      "jobs.submitError": "Unable to send your application. Please try again.",
      
      // Auth
      "auth.login": "Login",
      "auth.signup": "Sign Up",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.fullName": "Full Name",
      "auth.loginButton": "Log In",
      "auth.signupButton": "Sign Up",
      "auth.signupSuccess": "Registration Successful! 🎉",
      "auth.signupSuccessMessage": "A confirmation email has been sent to your address. Please click the link to activate your account.",
      "auth.loginError": "Login Error",
      "auth.signupError": "Registration Error",
      
      // Admin
      "admin.jobApplications": "Job Applications",
      "admin.newApplications": "New applications",
      "admin.viewDetails": "View details",
      "admin.status": "Status",
      "admin.pending": "Pending",
      "admin.approved": "Approved",
      "admin.rejected": "Rejected",
      
      // Email confirmation
      "email.applicationReceived": "Application received successfully",
      "email.prepareDocuments": "Prepare your required documents"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;