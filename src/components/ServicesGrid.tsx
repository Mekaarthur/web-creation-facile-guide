import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { servicesData, ServiceCategoryKey } from "@/utils/servicesData";

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
  plus: servicePlus
};

const services = Object.values(servicesData).map(service => ({
  id: service.key,
  title: service.packageTitle,
  subtitle: service.title.replace(/🧸|🏠|🛒|✈️|🐾|👴|💼|💎/, '').trim().split(' - ')[1] || 'Services spécialisés',
  image: imageMap[service.key],
  path: `/${service.key === 'kids' ? 'bika-kids' : 
         service.key === 'maison' ? 'bika-maison' :
         service.key === 'vie' ? 'bika-vie' :
         service.key === 'travel' ? 'bika-travel' :
         service.key === 'animals' ? 'bika-animals' :
         service.key === 'seniors' ? 'bika-seniors' :
         service.key === 'pro' ? 'bika-pro' : 'bika-plus'}`
}));

const ServicesGrid = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Nos Services
        </h2>
        
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-4xl mx-auto">
          Que vous cherchiez de l'accompagnement ou souhaitiez proposer vos services, 
          découvrez nos 8 univers Bika adaptés à tous vos besoins quotidiens.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link key={service.id} to={service.path} className="group">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.subtitle}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;