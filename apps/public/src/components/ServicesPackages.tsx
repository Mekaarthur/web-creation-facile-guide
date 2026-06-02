import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { servicesData } from "@/utils/servicesData";
import { serviceTranslations } from "@/utils/serviceTranslations";

import serviceChildcareEducation from "@/assets/service-childcare-education.jpg";
import serviceHouseLogistics from "@/assets/service-house-logistics.jpg";
import serviceAdminSupport from "@/assets/service-admin-support.jpg";
import serviceTravelAssistance from "@/assets/service-travel-assistance.jpg";
import servicePremiumConcierge from "@/assets/service-premium-concierge.jpg";
import servicePetCare from "@/assets/service-pet-care.jpg";
import serviceSeniorsAssistance from "@/assets/service-seniors-assistance.jpg";
import serviceBusinessExecutive from "@/assets/service-business-executive.jpg";

import { Baby, Home, FileText, Plane, Crown, Briefcase, PawPrint, UserCheck } from "lucide-react";
import SubscriptionBooking from "@/components/SubscriptionBooking";

const ServicesPackages = () => {
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedServiceForSubscription, setSelectedServiceForSubscription] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

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

  const iconMapping: Record<string, React.ElementType> = {
    kids: Baby,
    maison: Home,
    vie: FileText,
    travel: Plane,
    animals: PawPrint,
    seniors: UserCheck,
    pro: Briefcase,
    plus: Crown
  };

  const imageMapping: Record<string, string> = {
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
                } animate-fade-in-up h-full flex flex-col cursor-pointer`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleSubscriptionReservation(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {t('servicesPackages.mostPopular')}
                  </div>
                )}

                <div className="space-y-3 lg:space-y-4 flex flex-col h-full">
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

                  <div className="space-y-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg ${
                      pkg.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                      {IconComponent && <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {pkg.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-accent line-clamp-1">{pkg.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 flex-grow">
                    {pkg.description}
                  </p>

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
                        +{pkg.services.length - 3} {t('servicesPackages.moreServices')}
                      </li>
                    )}
                  </ul>

                  <div className="pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">{pkg.price}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

      </div>

      <SubscriptionBooking
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
        selectedService={selectedServiceForSubscription}
      />
    </section>
  );
};

export default ServicesPackages;
