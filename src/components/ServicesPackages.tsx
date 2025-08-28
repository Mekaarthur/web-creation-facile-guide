import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Cart, { useCart } from "@/components/Cart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

// Import des images
import serviceChildcareEducation from "@/assets/service-childcare-education.jpg";
import serviceHouseLogistics from "@/assets/service-house-logistics.jpg";
import serviceAdminSupport from "@/assets/service-admin-support.jpg";
import serviceTravelAssistance from "@/assets/service-travel-assistance.jpg";
import servicePremiumConcierge from "@/assets/service-premium-concierge.jpg";
import servicePetCare from "@/assets/service-pet-care.jpg";
import serviceSeniorsAssistance from "@/assets/service-seniors-assistance.jpg";
import serviceBusinessExecutive from "@/assets/service-business-executive.jpg";
import { PaymentLogos } from "@/components/PaymentLogos";
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
  MessageSquare,
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
import ServiceBookingForm from "@/components/ServiceBookingForm";
import SubscriptionBooking from "@/components/SubscriptionBooking";

const ServicesPackages = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedServiceForSubscription, setSelectedServiceForSubscription] = useState<any>(null);
  const { addToCart, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReservation = (pkg: any) => {
    if (!user) {
      navigate('/auth');
    } else {
      setSelectedPackage(pkg);
    }
  };

  const handleSubscriptionReservation = (pkg: any) => {
    if (!user) {
      navigate('/auth');
    } else {
      setSelectedServiceForSubscription({
        id: pkg.id,
        title: pkg.title,
        icon: pkg.icon,
        price: pkg.price
      });
      setShowSubscription(true);
    }
  };
  
  const packages = [
    {
      id: "kids",
      icon: Baby,
      title: "Bika Kids",
      subtitle: "Services dédiés aux enfants",
      description: "Garde, sorties éducatives, aide aux devoirs et organisation d'anniversaires pour vos enfants.",
      image: serviceChildcareEducation,
      services: [
        { name: "Garde ponctuelle", description: "Garde à domicile, après école, vacances", price: 25 },
        { name: "Garde partagée", description: "Entre familles, sortie d'école", price: 25 },
        { name: "Transport & sorties", description: "Activités extrascolaires, sport, culture", price: 25 },
        { name: "Aide aux devoirs", description: "Aide personnalisée et suivi", price: 25 },
        { name: "Gardes de nuit", description: "Nuit complète, urgences soir/week-end", price: 30 },
        { name: "Enfants malades", description: "Accompagnement et soins légers", price: 30 },
        { name: "Rendez-vous médicaux", description: "Accompagnement aux RDV", price: 30 },
        { name: "Anniversaires", description: "Animation, déco, logistique", price: 30 },
        { name: "Photographe & souvenirs", description: "Souvenirs photo/vidéo", price: 30 },
        { name: "Cours particuliers", description: "Soutien scolaire et examens", price: 30 }
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
      image: serviceHouseLogistics,
      services: [
        { name: "Courses alimentaires", description: "Hebdo, bio/sans gluten", price: 25 },
        { name: "Gestion stocks", description: "Frigo/placards, urgentes/nuit", price: 25 },
        { name: "Retrait colis", description: "Colis, livraisons, RDV artisans", price: 25 },
        { name: "Coordination travaux", description: "Travaux/rénovations", price: 30 },
        { name: "Déménagement léger", description: "Cartons, descente meubles/cartons", price: 30 },
        { name: "Rangement espaces", description: "Organisation et tri", price: 30 },
        { name: "Entretien jardins", description: "Espaces verts (sur demande)", price: 25 },
        { name: "Petits travaux", description: "Montage meubles, plomberie légère", price: 30 }
      ],
      color: "accent",
      popular: true,
      price: "25–30€/h"
    },
    {
      id: "vie",
      icon: FileText,
      title: "Bika Vie",
      subtitle: "Conciergerie complète",
      description: "Gestion de vos rendez-vous, démarches administratives et organisation d'événements familiaux.",
      image: serviceAdminSupport,
      services: [
        { name: "Courrier & documents", description: "Prise RDV médicaux/administratifs", price: 25 },
        { name: "Suivi abonnements", description: "Archivage documents", price: 25 },
        { name: "Accompagnement RDV", description: "Déplacements, classement", price: 25 },
        { name: "Pressing & cordonnerie", description: "Dépôt / retrait", price: 25 },
        { name: "Réservations", description: "Restaurants / spectacles", price: 25 },
        { name: "Gestion planning", description: "Interface administrations", price: 25 },
        { name: "Résolution problèmes", description: "Aide quotidienne", price: 25 }
      ],
      color: "primary",
      popular: false,
      price: "25€/h"
    },
    {
      id: "travel",
      icon: Plane,
      title: "Bika Travel",
      subtitle: "Assistance voyage",
      description: "Accompagnement complet pour vos voyages : avant, pendant et après votre déplacement.",
      image: serviceTravelAssistance,
      services: [
        { name: "Réservations transports", description: "Billets avion/train", price: 30 },
        { name: "Hébergements & activités", description: "Hôtels, locations, excursions", price: 30 },
        { name: "Itinéraires personnalisés", description: "Organisation détaillée", price: 30 },
        { name: "Passeports & visas", description: "Renouvellement, validité", price: 30 },
        { name: "Assurances & change", description: "Voyage/rapatriement, devises", price: 30 },
        { name: "Gestion imprévus", description: "Retards, rebooking urgent", price: 30 },
        { name: "Support multilingue", description: "À destination", price: 30 }
      ],
      color: "accent",
      popular: false,
      price: "30€/h"
    },
    {
      id: "plus",
      icon: Crown,
      title: "Bika Plus",
      subtitle: "Premium 7j/7",
      description: "Service haut de gamme avec Chef Family Officer dédié et aide prioritaire.",
      image: servicePremiumConcierge,
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
      subtitle: "Univers animalier",
      description: "Promenade, soins et accompagnement pour vos compagnons à quatre pattes.",
      image: servicePetCare,
      services: [
        { name: "Promenades", description: "Promenades régulières", price: 25 },
        { name: "Nourrissage & soins", description: "À domicile", price: 25 },
        { name: "Médicaments", description: "Administration et compagnie", price: 25 },
        { name: "Transport vétérinaire", description: "RDV et urgences", price: 30 },
        { name: "Suivi traitements", description: "Coordination soignants", price: 30 },
        { name: "Garde à domicile", description: "Ou famille agréée", price: 30 },
        { name: "Garde vacances", description: "+ Nouvelles/photos", price: 30 }
      ],
      color: "primary",
      popular: false,
      price: "25–30€/h"
    },
    {
      id: "seniors",
      icon: UserCheck,
      title: "Bika Seniors",
      subtitle: "Accompagnement personnes âgées",
      description: "Accompagnement bienveillant et aide quotidienne pour nos aînés.",
      image: serviceSeniorsAssistance,
      services: [
        { name: "Courses & repas", description: "Sorties & promenades", price: 30 },
        { name: "Toilette & hygiène", description: "Administration médicaments", price: 30 },
        { name: "Compagnie", description: "Présence et échanges", price: 30 },
        { name: "Rdv médicaux", description: "Suivi traitements", price: 30 },
        { name: "Coordination soignants", description: "Lien famille/médecins", price: 30 },
        { name: "Aménagement logement", description: "Équipements adaptés", price: 35 },
        { name: "Ménage & entretien", description: "Entretien domicile", price: 35 },
        { name: "Lien social", description: "Visites, activités", price: 30 },
        { name: "Technologies", description: "Aide outils + appels vidéo", price: 30 }
      ],
      color: "accent",
      popular: false,
      price: "30–35€/h"
    },
    {
      id: "pro",
      icon: Briefcase,
      title: "Bika Pro",
      subtitle: "Services aux entreprises",
      description: "Solutions d'aide administrative et executive pour votre entreprise.",
      image: serviceBusinessExecutive,
      services: [
        { name: "Agenda dirigeants", description: "Gestion et coordination", price: 50 },
        { name: "Déplacements", description: "Réservations & logistique", price: 50 },
        { name: "Interface partenaires", description: "Relations externes", price: 50 },
        { name: "Services personnels employés", description: "Pressing, courses", price: 50 },
        { name: "Resto d'affaires", description: "Réservations", price: 50 },
        { name: "Cadeaux clients", description: "Organisation", price: 50 }
      ],
      color: "accent",
      popular: false,
      price: "À partir de 50€/h"
    }
  ];

  const pricingOptions = [
    {
      title: "À la carte",
      price: "22-25€",
      description: "Choisir n'importe quel service Bika selon vos besoins ponctuels",
      features: ["Facturation à l'heure", "Tous services Bika", "Réservation simple"],
      color: "outline"
    },
    {
      title: "Formule Hebdo avec engagement",
      price: "10h - 200€",
      description: "Panier libre d'heures combinant Kids + Maison + Travel selon vos besoins - À interrompre à n'importe quel moment",
      features: ["Formule 10h/semaine", "Combinaisons illimitées", "Suivi personnalisé", "Résiliable à tout moment"],
      color: "primary",
      popular: true
    },
    {
      title: "Formule Mensuel avec engagement", 
      price: "40h - 800€",
      description: "Combinaisons illimitées avec suivi mensuel personnalisé - À interrompre à n'importe quel moment",
      features: ["40h/mois", "Accès à tous les services", "Suivi mensuel dédié", "Résiliable à tout moment"],
      color: "accent"
    },
    {
      title: "Premium",
      price: "≥ 1400€",
      description: "Accès libre Bikawo Plus & Bika Travel prioritaire",
      features: ["Accès libre Bikawo Plus", "Travel prioritaire", "Concierge 24h/7j"],
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
            Découvrez nos 8 packages d'aide conçus pour vous accompagner dans votre quotidien
            avec douceur, fiabilité et humanité.
          </p>
        </div>

        {/* Services Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 lg:mb-20">
          {packages.map((pkg, index) => {
            const IconComponent = pkg.icon;
            return (
              <Card 
                key={pkg.id} 
                className={`relative p-3 sm:p-4 lg:p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] group border ${
                  pkg.popular ? 'border-accent' : 'border-border'
                } animate-fade-in-up h-full flex flex-col`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Le plus populaire
                  </div>
                )}
                
                <div className="space-y-3 lg:space-y-4 flex flex-col h-full">
                  {/* Service Image - responsive height */}
                  {pkg.image && (
                    <div className="w-full h-24 sm:h-28 lg:h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={pkg.image} 
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {/* Icon & Title */}
                  <div className="space-y-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg ${
                      pkg.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {pkg.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-accent line-clamp-1">{pkg.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 flex-grow">
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

                     {/* CTA - Mobile optimized */}
                     <div className="space-y-2 mt-auto pt-2">
                         <Button 
                           variant={pkg.popular ? "accent" : "outline"} 
                           className="w-full group/btn min-h-10 text-xs sm:text-sm lg:text-base px-2 sm:px-4"
                           onClick={() => {
                             navigate(`/payment?service=${encodeURIComponent(pkg.title)}&price=${typeof pkg.services[0] === 'object' ? pkg.services[0].price : 22}&description=${encodeURIComponent(pkg.description)}&type=one-time&duration=1h`);
                           }}
                         >
                          <span className="truncate">Réserver à l'heure</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform group-hover/btn:translate-x-1 flex-shrink-0" />
                        </Button>
                        
                        <Button 
                          variant="secondary"
                          className="w-full group/btn min-h-10 text-xs sm:text-sm lg:text-base px-2 sm:px-4"
                          onClick={() => {
                            const subscriptionPrice = pkg.id === 'plus' ? 1500 : (pkg.id === 'pro' ? 800 : 200);
                            navigate(`/payment?service=${encodeURIComponent(pkg.title + ' - Abonnement')}&price=${subscriptionPrice}&description=${encodeURIComponent(pkg.description)}&type=subscription`);
                          }}
                        >
                          <span className="truncate">S'abonner</span>
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform group-hover/btn:translate-x-1 flex-shrink-0" />
                        </Button>
                      </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12 lg:mb-16">
            <Card className="p-4 lg:p-6 space-y-3 lg:space-y-4 card-mobile">
              <div className="space-y-2">
                <h4 className="text-base lg:text-lg font-semibold text-foreground">À la carte</h4>
                <div className="text-xl lg:text-2xl font-bold text-primary">22-25€/h</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Choisir n'importe quel service Bikawo selon vos besoins ponctuels.
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Bika Kids : garde ponctuelle, sorties éducatives, aide aux devoirs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Bika Maison : courses, récupération colis, petits travaux</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Bika Vie : rendez-vous médicaux, démarches administratives</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Bika Travel : assistance voyages, vérification documents</span>
                  </li>
                </ul>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/services')}
              >
                Réserver à la carte
              </Button>
            </Card>

            <Card className="p-6 space-y-4 border-accent relative">
              <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                Le plus populaire
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Hebdo</h4>
                <div className="text-2xl font-bold text-primary">10h - 200€</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Panier libre d'heures (Kids + Maison + Travel, etc.).
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                    <span>Combinaisons Bika Kids + Maison + Travel</span>
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
                 <Button 
                   variant="accent" 
                   className="w-full mt-4"
                   onClick={() => {
                     navigate(`/payment?service=${encodeURIComponent('Formule Hebdo')}&price=200&description=${encodeURIComponent('Panier libre d\'heures combinant Kids + Maison + Travel selon vos besoins')}&type=subscription`);
                   }}
                 >
                   Réserver Hebdo
                 </Button>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Mensuel</h4>
                <div className="text-2xl font-bold text-primary">40h - 800€</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Combinaisons illimitées + suivi mensuel personnalisé.
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Services inclus :</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Tous les services Bika Kids, Maison, Vie</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <span>Bika Travel complet avec priorité</span>
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
               <Button 
                 variant="default" 
                 className="w-full mt-4"
                 onClick={() => {
                   navigate(`/payment?service=${encodeURIComponent('Formule Mensuelle')}&price=800&description=${encodeURIComponent('Combinaisons illimitées + suivi mensuel personnalisé')}&type=subscription`);
                 }}
               >
                 Réserver Mensuel
               </Button>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Premium</h4>
                <div className="text-2xl font-bold text-primary">≥ 1400€</div>
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
                    <span>Accès à tous les services Bikawo</span>
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
               <Button 
                 variant="hero" 
                 className="w-full mt-4"
                 onClick={() => {
                   navigate(`/payment?service=${encodeURIComponent('Bika Plus Premium')}&price=1400&description=${encodeURIComponent('Accès libre Bikawo Plus & Bika Travel prioritaire')}&type=subscription`);
                 }}
               >
                 Réserver Premium
               </Button>
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

                <Link to="/demande-personnalisee">
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                  >
                    Envoyer ma demande
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Section Paiements sécurisés */}
      <div className="mt-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Paiements 100% sécurisés
          </h3>
          <p className="text-muted-foreground mb-6">
            Nous acceptons toutes les cartes bancaires avec une sécurité garantie
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <PaymentLogos size="lg" className="justify-center" />
            
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                🔒 SSL 256-bit
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                🛡️ 3D Secure
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                ⭐ PCI DSS
              </div>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                🏛️ Stripe
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground max-w-2xl">
              Vos données bancaires sont cryptées et sécurisées. Elles ne sont jamais stockées sur nos serveurs. 
              Le paiement est traité par Stripe, leader mondial de la sécurité des paiements en ligne.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Booking Modal */}
      <SubscriptionBooking
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
        selectedService={selectedServiceForSubscription}
      />
    </section>
  );
};

export default ServicesPackages;