import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Cart, { useCart } from "@/components/Cart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { servicesData } from "@/utils/servicesData";
import { serviceTranslations } from "@/utils/serviceTranslations";

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
  const { i18n } = useTranslation();

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
  
  const iconMapping = {
    kids: Baby,
    maison: Home,
    vie: FileText,
    travel: Plane,
    animals: PawPrint,
    seniors: UserCheck,
    pro: Briefcase,
    plus: Crown
  };

  const imageMapping = {
    kids: serviceChildcareEducation,
    maison: serviceHouseLogistics,
    vie: serviceAdminSupport,
    travel: serviceTravelAssistance,
    animals: servicePetCare,
    seniors: serviceSeniorsAssistance,
    pro: serviceBusinessExecutive,
    plus: servicePremiumConcierge
  };

  const packages = Object.values(servicesData).map((serviceCategory) => {
    const isEn = i18n.language?.startsWith('en');
    const localizedCategoryTitle = isEn
      ? serviceTranslations[serviceCategory.key]?.title ?? serviceCategory.title
      : serviceCategory.title;
    const subtitle = localizedCategoryTitle.split(' - ')[1] || localizedCategoryTitle;
    const description = isEn
      ? `${serviceCategory.subservices.length} services available in this category`
      : `${serviceCategory.subservices.length} services disponibles dans cette catégorie`;

    const services = serviceCategory.subservices.map((sub) => {
      const subTrans = isEn
        ? serviceTranslations[serviceCategory.key]?.subservices?.[sub.slug]
        : undefined;
      const name = subTrans?.title ?? sub.title;
      const desc = (subTrans?.description ?? sub.description).split('.')[0] + '.';
      return { name, description: desc, price: sub.price };
    });

    return {
      id: serviceCategory.key,
      icon: iconMapping[serviceCategory.key],
      title: serviceCategory.packageTitle,
      subtitle,
      description,
      image: imageMapping[serviceCategory.key],
      services,
      color:
        serviceCategory.key === 'maison' ||
        serviceCategory.key === 'seniors' ||
        serviceCategory.key === 'travel' ||
        serviceCategory.key === 'pro'
          ? 'accent'
          : 'primary',
      popular: serviceCategory.key === 'maison',
      price:
        serviceCategory.subservices[0]?.priceDisplay ||
        `À partir de ${serviceCategory.subservices[0]?.price}€/h`,
    };
  });

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

                </div>
               </Card>
             );
           })}
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