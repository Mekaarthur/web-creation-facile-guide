import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Baby, 
  Home, 
  FileText, 
  Plane,
  Crown,
  Briefcase,
  ArrowRight,
  Clock,
  Shield,
  Star,
  Heart,
  Car,
  Calendar,
  Utensils,
  Gamepad2,
  ShoppingCart,
  Package,
  Phone,
  MapPin,
  Luggage,
  Users
} from "lucide-react";

const ServicesPackages = () => {
  const packages = [
    {
      id: "kids",
      icon: Baby,
      title: "Bika Kids",
      subtitle: "Enfants & Parentalité",
      description: "Garde, sorties éducatives, aide aux devoirs et organisation d'anniversaires pour vos enfants.",
      services: [
        "Garde ponctuelle / de nuit / urgence",
        "Sorties éducatives (musée, médiathèque)",
        "Accompagnement école-maison-activités", 
        "Aide aux devoirs, préparation cartable",
        "Pré-organisation d'anniversaire enfant"
      ],
      color: "primary",
      popular: false,
      price: "À partir de 25€/h"
    },
    {
      id: "maison",
      icon: Home,
      title: "Bika Maison",
      subtitle: "Logistique quotidienne",
      description: "Courses, récupération de colis, petits travaux et organisation pour alléger votre quotidien.",
      services: [
        "Courses planifiées ou express",
        "Récupération colis / pressing / cordonnerie",
        "Montage meuble simple, changement d'ampoule",
        "Garde courte d'animaux",
        "Rangement dressing, tri jouets"
      ],
      color: "accent",
      popular: true,
      price: "À partir de 25€/h"
    },
    {
      id: "vie",
      icon: FileText,
      title: "Bika Vie",
      subtitle: "Conciergerie & Administration",
      description: "Gestion de vos rendez-vous, démarches administratives et organisation d'événements familiaux.",
      services: [
        "Prise / report de rendez-vous médicaux",
        "Constitution et dépôt de dossiers CAF, CPAM",
        "Gestion d'agenda partagé, rappels vaccins",
        "Organisation fête familiale, baby-shower",
        "Gestion administrative complète"
      ],
      color: "primary",
      popular: false,
      price: "À partir de 25€/h"
    },
    {
      id: "travel",
      icon: Plane,
      title: "Bika Travel",
      subtitle: "Assistance Voyageurs",
      description: "Accompagnement complet pour vos voyages : avant, pendant et après votre déplacement.",
      services: [
        "Vérification documents, check-in en ligne",
        "Transfert domicile-aéroport, Fast-Track",
        "Veille vols, rebooking imprévu",
        "Service Travel-Kids : kit enfant, poussette",
        "Récupération courses avant retour"
      ],
      color: "accent",
      popular: false,
      price: "À partir de 30€/h"
    },
    {
      id: "plus",
      icon: Crown,
      title: "Bika Plus",
      subtitle: "Premium 7j/7",
      description: "Service haut de gamme avec Chef Family Officer dédié et assistance prioritaire.",
      services: [
        "Chef Family Officer dédié",
        "Ligne prioritaire + WhatsApp instantané",
        "Organisation complète planning familial",
        "Garde soir, week-end, nuit",
        "Accès à tous les autres services"
      ],
      color: "primary",
      popular: false,
      price: "À partir de 1500€/mois"
    },
    {
      id: "pro",
      icon: Briefcase,
      title: "Bika Pro",
      subtitle: "Assistance Entreprise",
      description: "Solutions d'assistance administrative et executive pour votre entreprise.",
      services: [
        "Assistants administratifs externalisés",
        "Executive assistant à la carte",
        "Organisation séminaires, boards",
        "Gestion déplacements d'équipe",
        "Support business personnalisé"
      ],
      color: "accent",
      popular: false,
      price: "Sur devis"
    }
  ];

  const pricingOptions = [
    {
      title: "À la carte",
      price: "25-30€/h",
      description: "Choisir n'importe quel service Assist selon vos besoins ponctuels",
      features: ["Facturation à l'heure", "Tous services Assist", "Réservation simple"],
      color: "outline"
    },
    {
      title: "Hebdo",
      price: "10h - 240€",
      description: "Panier libre d'heures combinant Kids + Maison + Travel selon vos besoins",
      features: ["Formule 10h/semaine", "Combinaisons illimitées", "Suivi personnalisé"],
      color: "primary",
      popular: true
    },
    {
      title: "Mensuel", 
      price: "40h - 900€",
      description: "Combinaisons illimitées avec suivi mensuel personnalisé",
      features: ["40h/mois", "Accès à tous les services", "Suivi mensuel dédié"],
      color: "accent"
    },
    {
      title: "Premium",
      price: "≥ 1500€",
      description: "Accès libre Assist'Plus & Assist'Travel prioritaire",
      features: ["Accès libre Assist'Plus", "Travel prioritaire", "Concierge 24h/7j"],
      color: "hero"
    }
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Nos services Bika</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Des solutions pour
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              chaque aspect de votre vie
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos 6 packages d'assistance conçus pour vous accompagner dans votre quotidien
            avec douceur, fiabilité et humanité.
          </p>
        </div>

        {/* Services Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {packages.map((pkg, index) => {
            const IconComponent = pkg.icon;
            return (
              <Card 
                key={pkg.id} 
                className={`relative p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] group border ${
                  pkg.popular ? 'border-accent' : 'border-border'
                } animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Le plus populaire
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Icon & Title */}
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-lg ${
                      pkg.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {pkg.title}
                      </h3>
                      <p className="text-sm font-medium text-accent">{pkg.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm">
                    {pkg.description}
                  </p>

                  {/* Services List */}
                  <ul className="space-y-2">
                    {pkg.services.slice(0, 3).map((service, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          pkg.color === 'primary' ? 'bg-primary' : 'bg-accent'
                        }`}></div>
                        <span className="text-muted-foreground">{service}</span>
                      </li>
                    ))}
                    {pkg.services.length > 3 && (
                      <li className="text-xs text-accent font-medium">
                        +{pkg.services.length - 3} autres services
                      </li>
                    )}
                  </ul>

                  {/* Price */}
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">{pkg.price}</span>
                  </div>

                  {/* CTA */}
                  <Button 
                    variant={pkg.popular ? "accent" : "outline"} 
                    className="w-full group/btn"
                  >
                    Réserver {pkg.title}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>


        {/* Nos formules */}
        <div className="mt-16">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Nos formules
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choisissez la formule qui correspond le mieux à vos besoins et votre rythme de vie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">À la carte</h4>
                <div className="text-2xl font-bold text-primary">25-30€/h</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Choisir n'importe quel service Zen selon vos besoins ponctuels.
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-accent">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Hebdo</h4>
                <div className="text-2xl font-bold text-primary">10h - 240€</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Panier libre d'heures (Kids + Maison + Travel, etc.).
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Mensuel</h4>
                <div className="text-2xl font-bold text-primary">40h - 900€</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Combinaisons illimitées + suivi mensuel personnalisé.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Premium</h4>
                <div className="text-2xl font-bold text-primary">≥ 1500€</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Accès libre Zen'Plus & Zen'Travel prioritaire à adapter selon vos besoins.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="bg-gradient-subtle rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Besoin d'une solution sur mesure ?
              </h3>
              <p className="text-muted-foreground">
                Contactez-nous pour créer un package personnalisé qui répond parfaitement 
                à vos besoins familiaux et professionnels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => {
                    const element = document.getElementById('demandes-personnalisees');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Demander un devis personnalisé
                </Button>
                <Button variant="outline" size="lg">
                  Parler à un conseiller
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Demandes personnalisées */}
        <div id="demandes-personnalisees" className="mt-20">
          <Card className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Demandes personnalisées
                  </h3>
                  <p className="text-muted-foreground">
                    Vous avez des besoins spécifiques ? Décrivez-nous votre situation et nous 
                    créerons une solution sur mesure adaptée à votre famille.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Réponse sous 24h</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Devis gratuit et sans engagement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Solution 100% personnalisée</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Votre nom et prénom"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="votre.email@exemple.com"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Décrivez vos besoins</label>
                  <textarea 
                    rows={4}
                    placeholder="Décrivez votre situation, vos besoins spécifiques, la fréquence souhaitée..."
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <Button variant="hero" className="w-full" size="lg">
                  Envoyer ma demande
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ServicesPackages;