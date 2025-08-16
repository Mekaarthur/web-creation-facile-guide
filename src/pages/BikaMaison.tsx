import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaMaison = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Courses planifiées",
      price: "22€/h",
      description: "Courses hebdomadaires selon votre liste personnalisée et vos habitudes"
    },
    {
      name: "Courses express",
      price: "27€/h",
      description: "Courses urgentes réalisées en moins de 2h pour vos besoins imprévus"
    },
    {
      name: "Récupération colis",
      price: "24€/h",
      description: "Récupération colis, pressing, cordonnerie et toutes commissions"
    },
    {
      name: "Petits travaux",
      price: "28€/h",
      description: "Montage de meubles simples, changement d'ampoules, petites réparations"
    },
    {
      name: "Garde d'animaux",
      price: "23€/h",
      description: "Garde courte durée de vos animaux domestiques pendant vos absences"
    },
    {
      name: "Rangement",
      price: "25€/h",
      description: "Rangement dressing, tri des jouets, organisation optimale de vos espaces"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Maison - Logistique quotidienne",
    "provider": {
      "@type": "Organization",
      "name": "Bikawo",
      "url": "https://bikawo.fr"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Île-de-France"
    },
    "offers": services.map(service => ({
      "@type": "Offer",
      "name": service.name,
      "description": service.description,
      "price": service.price.replace("€/h", ""),
      "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Maison - Services logistique quotidienne Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services de logistique quotidienne en Île-de-France. Courses, commissions, petits travaux et organisation. Notre service le plus populaire. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="courses domicile ile de france, commission paris, logistique quotidienne, aide menagere, petit travaux domicile, service populaire" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-maison-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Maison - Logistique Quotidienne" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <Badge variant="default" className="text-sm py-2 px-4 bg-yellow-500 text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Service le plus populaire
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Bika Maison - Logistique quotidienne Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Maison, notre service populaire qui révolutionne votre quotidien ! Libérez-vous de toutes les tâches 
                chronophages et concentrez-vous sur l'essentiel grâce à notre équipe de logisticiens experts en Île-de-France.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Clock className="w-4 h-4 mr-2" />
                  Intervention 7j/7
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Logisticiens experts
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  Toute l'Île-de-France
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Calculator className="w-4 h-4 mr-2" />
                  Crédit d'impôt 50%
                </Badge>
              </div>
              <Button 
                size="lg" 
                onClick={() => navigate('/custom-request')}
                className="bg-primary hover:bg-primary/90"
              >
                Demander un devis gratuit
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Maison</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-primary font-semibold">
                        {service.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Popular Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Pourquoi Bika Maison est-il si populaire ?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Adaptation parfaite</h3>
                  <p className="text-muted-foreground">
                    Notre service s'adapte parfaitement au rythme effréné des familles franciliennes. Nos logisticiens 
                    connaissent parfaitement les commerces de proximité et optimisent chaque déplacement pour votre 
                    économie de temps.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Flexibilité totale</h3>
                  <p className="text-muted-foreground">
                    Intervention possible 7j/7 dans toute l'Île-de-France avec une réactivité exceptionnelle pour les 
                    demandes express. Notre équipe mobile intervient de Paris aux communes de grande couronne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Economies Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Économies garanties</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Crédit d'impôt de 50% applicable sur l'ensemble des prestations Bika Maison, rendant ces services 
                essentiels très accessibles financièrement.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <p className="text-sm text-muted-foreground">
                  Exemple : 3h de courses + commissions à 24€/h = 72€ → Coût réel après crédit d'impôt : 36€
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Ce que disent nos clients</h2>
              <blockquote className="text-lg italic text-muted-foreground mb-6">
                "Bika Maison a révolutionné mon quotidien ! Plus de courses le samedi matin, plus de stress pour 
                récupérer mes colis. Je peux enfin me concentrer sur ma famille le week-end."
              </blockquote>
              <cite className="text-sm font-semibold">- Sophie M., maman de 2 enfants, Paris 15e</cite>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Révolutionnez votre quotidien avec Bika Maison
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez les milliers de familles qui ont déjà adopté notre service le plus populaire
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
            >
              Obtenir mon devis gratuit
            </Button>
          </div>
        </section>

        <RelatedServices currentService="maison" />
      </main>

      <Footer />
    </div>
  );
};

export default BikaMaison;