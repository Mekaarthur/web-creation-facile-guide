import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { servicesData, ServiceCategoryKey } from "@/utils/servicesData";
import { useTranslation } from "react-i18next";
import { serviceTranslations } from "@/utils/serviceTranslations";

// Import existing service images
import serviceKids from "@/assets/service-kids.jpg";
import serviceMaison from "@/assets/service-maison.jpg";
import serviceVie from "@/assets/service-vie-full.jpg";
import serviceTravel from "@/assets/service-travel.jpg";
import servicePlus from "@/assets/service-premium.jpg";
import serviceAnimals from "@/assets/service-animals.jpg";
import serviceSeniors from "@/assets/service-seniors.jpg";
import serviceBusiness from "@/assets/service-business.jpg";

const imageMap: Record<ServiceCategoryKey, string> = {
  kids: serviceKids,
  maison: serviceMaison,
  vie: serviceVie,
  travel: serviceTravel,
  animals: serviceAnimals,
  seniors: serviceSeniors,
  pro: serviceBusiness,
  plus: servicePlus,
};

const ServicesGrid = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  const servicesList = Object.values(servicesData).map((service) => {
    const localizedCategoryTitle = isEn
      ? serviceTranslations[service.key]?.title ?? service.title
      : service.title;

    const subtitle =
      localizedCategoryTitle
        .replace(/🧸|🏠|🛒|✈️|🐾|👴|💼|💎/, "")
        .trim()
        .split(" - ")[1] || (isEn ? "Specialized services" : "Services spécialisés");

    const path = `/${
      service.key === "kids"
        ? "bika-kids"
        : service.key === "maison"
        ? "bika-maison"
        : service.key === "vie"
        ? "bika-vie"
        : service.key === "travel"
        ? "bika-travel"
        : service.key === "animals"
        ? "bika-animals"
        : service.key === "seniors"
        ? "bika-seniors"
        : service.key === "pro"
        ? "bika-pro"
        : "bika-plus"
    }`;

    return {
      id: service.key,
      title: service.packageTitle,
      subtitle,
      image: imageMap[service.key],
      path,
    };
  });

  // Prix de départ par service
  const startingPrices: Record<string, string> = {
    kids: "25€/h",
    maison: "25€/h",
    vie: "25€/h",
    travel: "30€/h",
    animals: "20€/h",
    seniors: "25€/h",
    pro: "35€/h",
    plus: "40€/h",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {servicesList.map((service) => (
        <Link key={service.id} to={service.path} className="group">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer relative">
            <div className="aspect-[4/3] overflow-hidden relative">
              <img
                src={service.image}
                alt={`${service.title} - ${service.subtitle}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Badge prix */}
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                À partir de {startingPrices[service.id]}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground">{service.subtitle}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ServicesGrid;