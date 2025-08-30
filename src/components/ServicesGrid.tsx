import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

// Import existing service images
import serviceKids from "@/assets/service-kids.jpg";
import serviceMaison from "@/assets/service-maison.jpg";
import serviceVie from "@/assets/service-vie-full.jpg";
import serviceTravel from "@/assets/service-travel.jpg";
import servicePlus from "@/assets/service-premium.jpg";
import serviceAnimals from "@/assets/service-animals.jpg";
import serviceSeniors from "@/assets/service-seniors.jpg";
import serviceBusiness from "@/assets/service-business.jpg";

const services = [
  {
    id: "kids",
    title: "Bika Kids",
    subtitle: "Garde d'enfants & activités",
    image: serviceKids,
    path: "/bika-kids"
  },
  {
    id: "maison",
    title: "Bika Maison", 
    subtitle: "Ménage, repassage & entretien",
    image: serviceMaison,
    path: "/bika-maison"
  },
  {
    id: "vie",
    title: "Bika Vie",
    subtitle: "Courses & démarches administratives", 
    image: serviceVie,
    path: "/bika-vie"
  },
  {
    id: "travel",
    title: "Bika Travel",
    subtitle: "Assistance voyage & conciergerie",
    image: serviceTravel,
    path: "/bika-travel"
  },
  {
    id: "plus",
    title: "Bika Plus",
    subtitle: "Services premium & sur-mesure",
    image: servicePlus,
    path: "/bika-plus"
  },
  {
    id: "animals",
    title: "Bika Animals",
    subtitle: "Garde & soins pour animaux",
    image: serviceAnimals,
    path: "/bika-animals"
  },
  {
    id: "seniors",
    title: "Bika Seniors", 
    subtitle: "Accompagnement personnes âgées",
    image: serviceSeniors,
    path: "/bika-seniors"
  },
  {
    id: "pro",
    title: "Bika Pro",
    subtitle: "Solutions pour entreprises",
    image: serviceBusiness,
    path: "/bika-pro"
  }
];

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