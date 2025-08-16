import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaKids = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Garde ponctuelle",
      price: "22€/h",
      description: "Garde d'enfants à domicile pour quelques heures, soirées ou après-midi"
    },
    {
      name: "Garde de nuit",
      price: "25€/h",
      description: "Surveillance et garde d'enfants toute la nuit pour vos déplacements"
    },
    {
      name: "Garde d'urgence",
      price: "27€/h",
      description: "Intervention rapide en cas d'imprévu ou urgence familiale"
    },
    {
      name: "Sorties éducatives",
      price: "24€/h",
      description: "Accompagnement au musée, médiathèque, parcs et activités culturelles"
    },
    {
      name: "Accompagnement scolaire",
      price: "23€/h",
      description: "Trajets école-maison-activités extrascolaires sécurisés"
    },
    {
      name: "Aide aux devoirs",
      price: "25€/h",
      description: "Soutien scolaire personnalisé et préparation du cartable"
    },
    {
      name: "Organisation anniversaire",
      price: "30€/h",
      description: "Pré-organisation complète d'anniversaires enfants"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Kids - Services enfance et parentalité",
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
        <title>Bika Kids - Services enfance et parentalité Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Garde d'enfants professionnelle en Île-de-France. Services de garde ponctuelle, nuit, urgence et accompagnement scolaire. Crédit d'impôt 50%. Devis gratuit 24h." 
        />
        <meta 
          name="keywords" 
          content="garde enfants ile de france, baby sitter paris, garde nuit enfants, accompagnement scolaire, sortie educative enfant, creche ponctuelle" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-kids-ile-de-france" />
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
                Bika Kids - Services enfance et parentalité Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Kids, votre partenaire de confiance pour la garde d'enfants et l'accompagnement parental en Île-de-France. 
                Notre équipe spécialisée prend soin de vos enfants avec professionnalisme et bienveillance, vous permettant de 
                concilier sereinement vie professionnelle et familiale.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Clock className="w-4 h-4 mr-2" />
                  Disponible 7j/7
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Intervenants sélectionnés
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Kids</h2>
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

        {/* Expertise Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">L'expertise Bikawo</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Sélection rigoureuse</h3>
                  <p className="text-muted-foreground">
                    Nos intervenants Bika Kids sont sélectionnés pour leur expérience auprès des enfants et leur capacité 
                    à créer un environnement rassurant. Chaque garde est adaptée aux besoins spécifiques de l'âge et du 
                    caractère de votre enfant.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Disponibilité maximale</h3>
                  <p className="text-muted-foreground">
                    Services 7j/7 dans toute l'Île-de-France (Paris, 91, 92, 93, 94, 95, 77, 78) avec possibilité 
                    d'intervention en urgence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credit d'impot Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Crédit d'impôt 50%</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Tous nos services Bika Kids sont éligibles au crédit d'impôt, divisant par deux le coût réel 
                de vos prestations de garde d'enfants.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <p className="text-sm text-muted-foreground">
                  Exemple : Une garde de 4h à 22€/h = 88€ → Coût réel après crédit d'impôt : 44€
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Prêt à faire confiance à Bika Kids ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Demandez votre devis personnalisé en moins de 24h
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

export default BikaKids;