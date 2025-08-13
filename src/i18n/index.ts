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
      
      // Hero section
      "hero.title": "Des Services à Domicile de Qualité",
      "hero.subtitle": "Trouvez des prestataires de confiance pour tous vos besoins du quotidien",
      "hero.cta": "Découvrir nos services",
      
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
      
      // Hero section
      "hero.title": "Quality Home Services",
      "hero.subtitle": "Find trusted service providers for all your daily needs",
      "hero.cta": "Discover our services",
      
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