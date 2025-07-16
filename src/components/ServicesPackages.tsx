import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  Users,
  PawPrint,
  UserCheck,
  Euro,
  Check
} from "lucide-react";
import ServicesBooking from "@/components/ServicesBooking";

const ServicesPackages = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  const packages = [
    {
      id: "kids",
      icon: Baby,
      title: "Bika Kids",
      subtitle: "Enfants & Parentalité",
      description: "Garde, sorties éducatives, aide aux devoirs et organisation d'anniversaires pour vos enfants.",
      image: "/src/assets/service-childcare-education.jpg",
      services: [
        { name: "Garde ponctuelle", description: "Garde d'enfant à domicile pour quelques heures", price: 22 },
        { name: "Garde de nuit", description: "Garde d'enfant toute la nuit", price: 25 },
        { name: "Garde d'urgence", description: "Garde d'enfant en cas d'urgence", price: 27 },
        { name: "Sorties éducatives", description: "Accompagnement au musée, médiathèque, etc.", price: 24 },
        { name: "Accompagnement scolaire", description: "Trajet école-maison-activités", price: 23 },
        { name: "Aide aux devoirs", description: "Aide aux devoirs et préparation cartable", price: 25 },
        { name: "Organisation anniversaire", description: "Pré-organisation d'anniversaire enfant", price: 30 }
      ],
      color: "primary",
      popular: false,
      price: "À partir de 22€/h"
    },
    {
      id: "maison",
      icon: Home,
      title: "Bika Maison",
      subtitle: "Logistique quotidienne",
      description: "Courses, récupération de colis, petits travaux et organisation pour alléger votre quotidien.",
      image: "/src/assets/service-house-logistics.jpg",
      services: [
        { name: "Courses planifiées", description: "Courses hebdomadaires selon votre liste", price: 22 },
        { name: "Courses express", description: "Courses urgentes en moins de 2h", price: 27 },
        { name: "Récupération colis", description: "Récupération colis, pressing, cordonnerie", price: 24 },
        { name: "Petits travaux", description: "Montage meuble simple, changement d'ampoule", price: 28 },
        { name: "Garde d'animaux", description: "Garde courte d'animaux domestiques", price: 23 },
        { name: "Rangement", description: "Rangement dressing, tri jouets", price: 25 }
      ],
      color: "accent",
      popular: true,
      price: "À partir de 22€/h"
    },
    {
      id: "vie",
      icon: FileText,
      title: "Bika Vie",
      subtitle: "Conciergerie & Administration",
      description: "Gestion de vos rendez-vous, démarches administratives et organisation d'événements familiaux.",
      image: "/src/assets/service-admin-support.jpg",
      services: [
        { name: "Rendez-vous médicaux", description: "Prise et report de rendez-vous médicaux", price: 24 },
        { name: "Dossiers administratifs", description: "Constitution et dépôt de dossiers CAF, CPAM", price: 28 },
        { name: "Gestion d'agenda", description: "Gestion d'agenda partagé, rappels vaccins", price: 26 },
        { name: "Organisation événements", description: "Organisation fête familiale, baby-shower", price: 32 },
        { name: "Assistance administrative", description: "Gestion administrative complète", price: 30 }
      ],
      color: "primary",
      popular: false,
      price: "24€/h"
    },
    {
      id: "travel",
      icon: Plane,
      title: "Bika Travel",
      subtitle: "Assistance Voyageurs",
      description: "Accompagnement complet pour vos voyages : avant, pendant et après votre déplacement.",
      image: "/src/assets/service-travel-assistance.jpg",
      services: [
        { name: "Assistance pré-voyage", description: "Vérification documents, check-in en ligne", price: 25 },
        { name: "Transfert aéroport", description: "Transfert domicile-aéroport, Fast-Track", price: 32 },
        { name: "Veille de vols", description: "Veille vols, rebooking imprévu", price: 35 },
        { name: "Travel-Kids", description: "Service Travel-Kids : kit enfant, poussette", price: 30 },
        { name: "Préparation retour", description: "Récupération courses avant retour", price: 27 }
      ],
      color: "accent",
      popular: false,
      price: "25€/h"
    },
    {
      id: "plus",
      icon: Crown,
      title: "Bika Plus",
      subtitle: "Premium 7j/7",
      description: "Service haut de gamme avec Chef Family Officer dédié et assistance prioritaire.",
      image: "/src/assets/service-premium-concierge.jpg",
      services: [
        { name: "Chef Family Officer", description: "Chef Family Officer dédié", price: 0 },
        { name: "Ligne prioritaire", description: "Ligne prioritaire + WhatsApp instantané", price: 0 },
        { name: "Planning familial", description: "Organisation complète planning familial", price: 0 },
        { name: "Garde premium", description: "Garde soir, week-end, nuit", price: 0 },
        { name: "Accès illimité", description: "Accès à tous les autres services", price: 0 }
      ],
      color: "primary",
      popular: false,
      price: "À partir de 1500€/mois"
    },
    {
      id: "animals",
      icon: PawPrint,
      title: "Bika Animals",
      subtitle: "Services pour animaux",
      description: "Promenade, soins et accompagnement pour vos compagnons à quatre pattes.",
      image: "/src/assets/service-pet-care.jpg",
      services: [
        { name: "Promenade animaux", description: "Balade matinale et du soir", price: 20 },
        { name: "Visite vétérinaire", description: "Accompagnement chez le vétérinaire", price: 25 },
        { name: "Courses animaux", description: "Courses pour animaux (nourriture, accessoires)", price: 22 },
        { name: "Garde d'animaux", description: "Garde ponctuelle d'animaux", price: 24 },
        { name: "Toilettage", description: "Toilettage et soins de base", price: 30 }
      ],
      color: "primary",
      popular: false,
      price: "À partir de 20€/h"
    },
    {
      id: "seniors",
      icon: UserCheck,
      title: "Bika Personnes Âgées",
      subtitle: "Assistance seniors",
      description: "Accompagnement bienveillant et aide quotidienne pour nos aînés.",
      image: "/src/assets/service-seniors-assistance.jpg",
      services: [
        { name: "Aide quotidienne", description: "Aide aux activités quotidiennes", price: 24 },
        { name: "Accompagnement médical", description: "Accompagnement aux rendez-vous médicaux", price: 27 },
        { name: "Courses seniors", description: "Courses et commissions", price: 26 },
        { name: "Compagnie", description: "Compagnie et conversation", price: 24 },
        { name: "Aide mobilité", description: "Aide à la mobilité et aux repas", price: 28 }
      ],
      color: "accent",
      popular: false,
      price: "24€/h"
    },
    {
      id: "pro",
      icon: Briefcase,
      title: "Bika Pro",
      subtitle: "Assistance Entreprise",
      description: "Solutions d'assistance administrative et executive pour votre entreprise.",
      image: "/src/assets/service-business-executive.jpg",
      services: [
        { name: "Assistant administratif", description: "Assistants administratifs externalisés", price: 35 },
        { name: "Executive assistant", description: "Executive assistant à la carte", price: 45 },
        { name: "Organisation événements", description: "Organisation séminaires, boards", price: 50 },
        { name: "Gestion déplacements", description: "Gestion déplacements d'équipe", price: 40 },
        { name: "Support business", description: "Support business personnalisé", price: 55 }
      ],
      color: "accent",
      popular: false,
      price: "Sur devis"
    }
  ];

  const pricingOptions = [
    {
      title: "À la carte",
      price: "25€/h",
      description: "Choisir n'importe quel service Assist selon vos besoins ponctuels",
      features: ["Facturation à l'heure", "Tous services Assist", "Réservation simple"],
      color: "outline"
    },
    {
      title: "Hebdo",
      price: "10h - 220€",
      description: "Panier libre d'heures combinant Kids + Maison + Travel selon vos besoins",
      features: ["Formule 10h/semaine", "Combinaisons illimitées", "Suivi personnalisé"],
      color: "primary",
      popular: true
    },
    {
      title: "Mensuel", 
      price: "40h - 880€",
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
            <span>Nos services</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Des solutions pour
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              chaque aspect de votre vie
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos 8 packages d'assistance conçus pour vous accompagner dans votre quotidien
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
                  {/* Service Image */}
                  {pkg.image && (
                    <div className="w-full h-32 rounded-lg overflow-hidden">
                      <img 
                        src={pkg.image} 
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
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
                         <span className="text-muted-foreground">{typeof service === 'string' ? service : service.name}</span>
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
                   <Dialog open={isBookingDialogOpen && selectedPackage?.id === pkg.id} onOpenChange={setIsBookingDialogOpen}>
                     <DialogTrigger asChild>
                       <Button 
                         variant={pkg.popular ? "accent" : "outline"} 
                         className="w-full group/btn"
                         onClick={() => {
                           setSelectedPackage(pkg);
                           setIsBookingDialogOpen(true);
                         }}
                       >
                         Réserver {pkg.title}
                         <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                       <DialogHeader>
                         <DialogTitle className="flex items-center gap-2">
                           <pkg.icon className="w-6 h-6 text-primary" />
                           Réserver - {pkg.title}
                         </DialogTitle>
                         <DialogDescription>
                           Choisissez le service spécifique que vous souhaitez réserver dans le package {pkg.title}
                         </DialogDescription>
                       </DialogHeader>

                       <div className="grid gap-6 py-4">
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {pkg.services.map((service: any, idx: number) => (
                             <Card key={idx} className="p-4 hover:shadow-md transition-all">
                               <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                   <h4 className="font-semibold text-foreground">
                                     {typeof service === 'string' ? service : service.name}
                                   </h4>
                                   {typeof service === 'object' && service.price > 0 && (
                                     <Badge variant="secondary" className="flex items-center gap-1">
                                       <Euro className="w-3 h-3" />
                                       {service.price}€/h
                                     </Badge>
                                   )}
                                 </div>
                                 
                                 {typeof service === 'object' && service.description && (
                                   <p className="text-sm text-muted-foreground">
                                     {service.description}
                                   </p>
                                 )}
                                 
                                 <Button size="sm" className="w-full" onClick={() => {
                                   setIsBookingDialogOpen(false);
                                   // Scroll to booking section with this specific service
                                   const bookingSection = document.getElementById('booking');
                                   if (bookingSection) {
                                     bookingSection.scrollIntoView({ behavior: 'smooth' });
                                     // Pass service data to booking component
                                     window.dispatchEvent(new CustomEvent('selectService', {
                                       detail: {
                                         id: `${pkg.id}-${idx}`,
                                         name: typeof service === 'string' ? service : service.name,
                                         description: typeof service === 'object' ? service.description : '',
                                         price_per_hour: typeof service === 'object' ? service.price : 25,
                                         category: pkg.subtitle,
                                         package: pkg.title
                                       }
                                     }));
                                   }
                                 }}>
                                   <Check className="w-4 h-4 mr-1" />
                                   Choisir ce service
                                 </Button>
                               </div>
                             </Card>
                           ))}
                         </div>
                       </div>
                     </DialogContent>
                   </Dialog>
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
              <p className="text-sm text-muted-foreground mb-3">
                Choisir n'importe quel service Zen selon vos besoins ponctuels.
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Zen Kids : garde ponctuelle, sorties éducatives, aide aux devoirs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Zen Maison : courses, récupération colis, petits travaux</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Zen Vie : rendez-vous médicaux, démarches administratives</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Zen Travel : assistance voyages, vérification documents</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-accent relative">
              <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                Le plus populaire
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Hebdo</h4>
                <div className="text-2xl font-bold text-primary">10h - 240€</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Panier libre d'heures (Kids + Maison + Travel, etc.).
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Combinaisons Zen Kids + Maison + Travel</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Garde ponctuelle et de nuit</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Sorties éducatives et accompagnements</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Courses et récupération colis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Assistance voyages basique</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Mensuel</h4>
                <div className="text-2xl font-bold text-primary">40h - 900€</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Combinaisons illimitées + suivi mensuel personnalisé.
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Tous les services Zen Kids, Maison, Vie</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Zen Travel complet avec priorité</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Organisation événements familiaux</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Suivi mensuel personnalisé</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Gestion administrative complète</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Premium</h4>
                <div className="text-2xl font-bold text-primary">≥ 1500€</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès libre Zen'Plus & Zen'Travel prioritaire à adapter selon vos besoins.
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Chef Family Officer dédié</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Ligne prioritaire + WhatsApp instantané</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Accès à tous les services Zen</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Garde soir, week-end, nuit prioritaire</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Organisation planning familial complet</span>
                  </li>
                </ul>
              </div>
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