import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Shield, MapPin, Calculator, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaTravel = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Aide pré-voyage",
      price: "25€/h",
      description: "Vérification documents, check-in en ligne, préparation valises optimale"
    },
    {
      name: "Transfert aéroport",
      price: "32€/h",
      description: "Transfert sécurisé domicile-aéroport avec service Fast-Track"
    },
    {
      name: "Veille de vols",
      price: "35€/h",
      description: "Surveillance de vos vols, rebooking automatique en cas d'imprévu"
    },
    {
      name: "Travel-Kids",
      price: "30€/h",
      description: "Service spécialisé familles : kit enfant, poussette voyage, divertissements"
    },
    {
      name: "Préparation retour",
      price: "27€/h",
      description: "Courses de première nécessité avant votre retour de voyage"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Travel - Services aux voyageurs",
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
        <title>Bika Travel - Services aux voyageurs Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Conciergerie voyage Île-de-France. Aide pré-voyage, transfert aéroport Roissy Orly, veille vols, service familles. Voyagez sans stress. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="conciergerie voyage ile de france, transfert aeroport roissy orly, aide pre voyage, veille vol, travel kids, service voyageur paris" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-travel-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Bika Travel - Services aux voyageurs Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Travel transforme vos voyages en expériences sereines. Notre service spécialisé accompagne les 
                voyageurs franciliens dans toutes les étapes de leurs déplacements, de la préparation au retour, 
                pour des voyages sans stress en famille ou en solo.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Plane className="w-4 h-4 mr-2" />
                  Expert aéroportuaire
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Suivi temps réel
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  CDG & Orly
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Travel</h2>
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

        {/* Innovation Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Innovation Bikawo</h2>
              <div className="text-center mb-8">
                <p className="text-lg text-muted-foreground">
                  Bika Travel est le seul service de conciergerie voyage personnalisé en Île-de-France. Notre équipe 
                  anticipe tous vos besoins et gère les imprévus en temps réel pendant vos déplacements.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Expertise aéroportuaire</h3>
                  <p className="text-muted-foreground">
                    Nos agents connaissent parfaitement Roissy-Charles de Gaulle et Orly, optimisant vos trajets et 
                    procédures d'embarquement. Service premium avec accès privilégiés.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Technologie avancée</h3>
                  <p className="text-muted-foreground">
                    Suivi en temps réel de vos vols, alertes automatiques, rebooking immédiat en cas de perturbations. 
                    Application mobile dédiée pour un suivi constant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Travel Process Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Votre voyage étape par étape</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">1</div>
                  <h3 className="font-semibold mb-2">Pré-voyage</h3>
                  <p className="text-sm text-muted-foreground">Vérification documents, check-in, préparation valises</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">2</div>
                  <h3 className="font-semibold mb-2">Transfert</h3>
                  <p className="text-sm text-muted-foreground">Transfert sécurisé domicile-aéroport avec Fast-Track</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">3</div>
                  <h3 className="font-semibold mb-2">Surveillance</h3>
                  <p className="text-sm text-muted-foreground">Veille vols, rebooking automatique si nécessaire</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">4</div>
                  <h3 className="font-semibold mb-2">Retour</h3>
                  <p className="text-sm text-muted-foreground">Préparation de votre retour, courses essentielles</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Family Travel Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Travel-Kids : voyager en famille facilité</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Service spécialisé pour les familles avec enfants : kit voyage enfant, matériel adapté, 
                divertissements préparés, accompagnement personnalisé.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Inclus dans Travel-Kids :</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>• Kit divertissement</div>
                  <div>• Poussette voyage</div>
                  <div>• Snacks adaptés</div>
                  <div>• Livres & jeux</div>
                  <div>• Produits hygiène</div>
                  <div>• Accompagnement</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Voyagez sereinement avec Bika Travel
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Le seul service de conciergerie voyage personnalisé en Île-de-France
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
      </main>

      <Footer />
    </div>
  );
};

export default BikaTravel;