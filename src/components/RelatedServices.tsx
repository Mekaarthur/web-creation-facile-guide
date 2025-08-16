import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RelatedService {
  name: string;
  href: string;
  description: string;
  price: string;
}

interface RelatedServicesProps {
  currentService: string;
}

const RelatedServices = ({ currentService }: RelatedServicesProps) => {
  const allServices = [
    {
      name: "Bika Kids",
      href: "/bika-kids-ile-de-france",
      description: "Services enfance et parentalité",
      price: "À partir de 22€/h"
    },
    {
      name: "Bika Maison",
      href: "/bika-maison-ile-de-france", 
      description: "Logistique quotidienne",
      price: "À partir de 22€/h"
    },
    {
      name: "Bika Vie",
      href: "/bika-vie-ile-de-france",
      description: "Conciergerie et administration",
      price: "À partir de 24€/h"
    },
    {
      name: "Bika Travel",
      href: "/bika-travel-ile-de-france",
      description: "Services aux voyageurs",
      price: "À partir de 25€/h"
    },
    {
      name: "Bika Plus",
      href: "/bika-plus-ile-de-france",
      description: "Service premium 7j/7",
      price: "À partir de 1500€/mois"
    },
    {
      name: "Bika Animals",
      href: "/bika-animals-ile-de-france",
      description: "Services pour animaux",
      price: "À partir de 20€/h"
    },
    {
      name: "Bika Seniors",
      href: "/bika-seniors-ile-de-france",
      description: "Aide personnes âgées",
      price: "À partir de 24€/h"
    },
    {
      name: "Bika Pro",
      href: "/bika-pro-ile-de-france",
      description: "Services aux entreprises",
      price: "À partir de 35€/h"
    }
  ];

  // Filtrer pour exclure le service actuel et prendre 3 services connexes
  const relatedServices = allServices
    .filter(service => !service.name.toLowerCase().includes(currentService.toLowerCase()))
    .slice(0, 3);

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Découvrez nos autres services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bikawo vous accompagne dans tous les aspects de votre vie quotidienne
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {relatedServices.map((service) => (
            <Card key={service.name} className="group transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {service.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-primary">
                    {service.price}
                  </span>
                  <Button asChild variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Link to={service.href} className="flex items-center">
                      Découvrir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="transition-all duration-300 hover:scale-105">
            <Link to="/services">
              Voir tous nos services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RelatedServices;