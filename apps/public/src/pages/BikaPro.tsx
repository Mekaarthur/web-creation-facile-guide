import SEOComponent from "@/components/SEOComponent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import EnterpriseQuoteForm from "@/components/pro/EnterpriseQuoteForm";
import { Building2, CheckCircle, Clock, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SERVICES = [
  {
    title: "Ménage bureaux (≤100m²)",
    price: "25€/h",
    description: "Entretien complet des espaces de travail, parties communes et sanitaires",
    badge: null,
  },
  {
    title: "Ménage bureaux (100-200m²)",
    price: "28€/h",
    description: "Entretien intensif adapté aux plateaux open-space et grandes surfaces",
    badge: "Populaire",
  },
  {
    title: "Ménage bureaux (>200m²)",
    price: "Sur devis",
    description: "Devis personnalisé pour les grands espaces, centres commerciaux, entrepôts",
    badge: "Devis",
  },
  {
    title: "Matériel de ménage professionnel",
    price: "5€ / forfait",
    description: "Produits ménagers certifiés professionnels fournis à chaque intervention",
    badge: null,
  },
  {
    title: "Support administratif",
    price: "40€/h",
    description: "Assistants qualifiés pour la gestion administrative et le support aux PME",
    badge: null,
  },
  {
    title: "Assistance dirigeants",
    price: "60€/h",
    description: "Support de haut niveau pour dirigeants et cadres supérieurs",
    badge: "Premium",
  },
  {
    title: "Conciergerie d'entreprise",
    price: "50€/h",
    description: "Services personnels pour salariés, pressing, réservations, organisation événements",
    badge: null,
  },
  {
    title: "Assistance administrative",
    price: "30€/h",
    description: "Courrier, classement, archivage, saisie de données, permanence téléphonique",
    badge: null,
  },
];

const AVANTAGES = [
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: "Prestataires vérifiés",
    description: "Chaque intervenant est contrôlé, assuré et formé aux environnements professionnels.",
  },
  {
    icon: <Clock className="w-6 h-6 text-primary" />,
    title: "Planification flexible",
    description: "Interventions tôt le matin, en soirée ou le week-end pour zéro perturbation de vos équipes.",
  },
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: "Réactivité 24h",
    description: "Devis sous 24h, premier intervenant sous 48h ouvrées.",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Interlocuteur dédié",
    description: "Un gestionnaire de compte unique pour tous vos sites et contrats.",
  },
  {
    icon: <Building2 className="w-6 h-6 text-primary" />,
    title: "Multi-sites",
    description: "Couvre plusieurs adresses avec une facturation centralisée.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-primary" />,
    title: "Conformité garantie",
    description: "Toutes les obligations légales employeur prises en charge (assurance, déclarations).",
  },
];

const ETAPES = [
  { num: "01", title: "Devis en ligne", desc: "Remplissez le formulaire ci-dessous — 2 minutes." },
  { num: "02", title: "Étude & chiffrage", desc: "Notre équipe vous rappelle sous 24h avec un devis personnalisé." },
  { num: "03", title: "Signature contrat", desc: "Contrat cadre, planning et prestataire attribué." },
  { num: "04", title: "Première intervention", desc: "Démarrage sous 48h ouvrées après signature." },
];

const BikaPro = () => {
  const scrollToForm = () => {
    document.getElementById("enterprise-quote-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Bikawo Pro — Services d'entretien et administratifs pour entreprises"
        description="Nettoyage de bureaux, assistance administrative et conciergerie pour PME et grandes entreprises en Île-de-France. Devis sous 24h."
        keywords="nettoyage bureaux entreprise Paris, ménage professionnel PME, assistance administrative entreprises Île-de-France, conciergerie entreprise"
        url="/bika-pro"
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/20 text-primary-foreground border-primary/30">
            Exclusivement pour les entreprises
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Des services pros,<br />pour votre entreprise
          </h1>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
            Ménage de bureaux, assistance administrative, conciergerie d'entreprise —
            des intervenants qualifiés, planifiés selon vos horaires.
          </p>
          <p className="text-slate-400 mb-8">
            Devis personnalisé sous 24h · Contrat sur mesure · Multi-sites
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={scrollToForm} className="bg-primary hover:bg-primary/90 text-white">
              Demander un devis gratuit
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = "tel:+33XXXXXXXXX"}>
              Nous appeler
            </Button>
          </div>
        </div>
      </section>

      {/* Section A — Services */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Nos services entreprise</h2>
          <p className="text-muted-foreground text-center mb-12">
            Tous nos tarifs sont hors TVA. Les contrats incluent un forfait matériel en option.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((svc) => (
              <div key={svc.title}
                className="relative border border-border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
                {svc.badge && (
                  <Badge className="absolute top-3 right-3 text-xs" variant="secondary">
                    {svc.badge}
                  </Badge>
                )}
                <p className="text-2xl font-bold text-primary mb-1">{svc.price}</p>
                <h3 className="font-semibold text-foreground mb-2">{svc.title}</h3>
                <p className="text-sm text-muted-foreground">{svc.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Tarifs indicatifs — le devis final est établi après visite de site pour les surfaces &gt;200m².
          </p>
        </div>
      </section>

      {/* Section B — Avantages */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi Bikawo Pro ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {AVANTAGES.map((a) => (
              <div key={a.title} className="flex gap-4">
                <div className="mt-1 flex-shrink-0">{a.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section C — Comment ça marche */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ETAPES.map((e) => (
              <div key={e.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg
                  flex items-center justify-center mx-auto mb-4">
                  {e.num}
                </div>
                <h3 className="font-semibold mb-2">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section D — Formulaire devis */}
      <section id="enterprise-quote-form" className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Demandez votre devis gratuit</h2>
          <p className="text-muted-foreground text-center mb-10">
            Réponse garantie sous 24h ouvrées. Aucun engagement.
          </p>
          <EnterpriseQuoteForm />
        </div>
      </section>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaPro;
