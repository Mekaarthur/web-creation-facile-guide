import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, MapPin, Calculator, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaAnimals = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Promenade animaux",
      price: "20€/h",
      description: "Balades matinales et du soir adaptées aux besoins de votre animal"
    },
    {
      name: "Visite vétérinaire",
      price: "25€/h",
      description: "Accompagnement chez le vétérinaire, gestion des rendez-vous santé"
    },
    {
      name: "Courses animaux",
      price: "22€/h",
      description: "Achat nourriture, accessoires, produits d'hygiène spécialisés"
    },
    {
      name: "Garde d'animaux",
      price: "24€/h",
      description: "Garde ponctuelle à domicile respectant les habitudes de l'animal"
    },
    {
      name: "Toilettage",
      price: "30€/h",
      description: "Toilettage et soins de base, brossage, nettoyage oreilles et yeux"
    }
  ];

  const animalTypes = [
    { name: "Chiens", description: "Toutes races et tailles" },
    { name: "Chats", description: "Chats d'appartement et d'extérieur" },
    { name: "NAC", description: "Nouveaux animaux de compagnie" },
    { name: "Oiseaux", description: "Perroquets, canaris, perruches" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Animals - Services pour animaux",
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
        <title>Bika Animals - Services pour animaux Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Pet-sitting professionnel Île-de-France. Promenade, garde, soins vétérinaires, toilettage pour chiens, chats, NAC. Pet-sitters experts. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="pet sitting ile de france, garde animaux paris, promenade chien, visite veterinaire, pet sitter professionnel, garde chat domicile" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-animals-ile-de-france" />
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
                Bika Animals - Services pour animaux Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Animals chouchoute vos compagnons à quatre pattes. Notre équipe de pet-sitters professionnels offre 
                des services complets pour le bien-être de vos animaux domestiques en Île-de-France, vous permettant de 
                voyager ou travailler l'esprit tranquille.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Heart className="w-4 h-4 mr-2" />
                  Pet-sitters experts
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Camera className="w-4 h-4 mr-2" />
                  Suivi photos/nouvelles
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Animals</h2>
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

        {/* Animal Types Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Tous animaux</h2>
              <p className="text-lg text-center text-muted-foreground mb-12">
                Services pour chiens, chats, NAC (nouveaux animaux de compagnie), oiseaux. Nos pet-sitters s'adaptent 
                aux spécificités de chaque espèce avec bienveillance et professionnalisme.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {animalTypes.map((animal, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <CardTitle className="text-lg">{animal.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {animal.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Expertise animalière</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Formation spécialisée</h3>
                  <p className="text-muted-foreground">
                    Nos intervenants Bika Animals sont formés aux comportements canins et félins. Ils respectent le 
                    caractère unique de chaque animal et s'adaptent à ses besoins spécifiques pour son confort optimal.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Suivi personnalisé</h3>
                  <p className="text-muted-foreground">
                    Carnet de liaison détaillé après chaque intervention, photos et nouvelles régulières pendant vos 
                    absences. Respect scrupuleux des routines alimentaires et des traitements médicaux.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Care Process Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Notre protocole de soins</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">1</div>
                  <h3 className="font-semibold mb-2">Rencontre préalable</h3>
                  <p className="text-sm text-muted-foreground">Connaissance de votre animal, ses habitudes, ses besoins spécifiques</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">2</div>
                  <h3 className="font-semibold mb-2">Intervention adaptée</h3>
                  <p className="text-sm text-muted-foreground">Respect des routines, besoins spécifiques, traitements médicaux</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">3</div>
                  <h3 className="font-semibold mb-2">Compte-rendu détaillé</h3>
                  <p className="text-sm text-muted-foreground">Photos, nouvelles, carnet de liaison avec toutes les activités</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Disponibilité étendue</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Interventions 7j/7 dans toute l'Île-de-France (Paris, 91, 92, 93, 94, 95, 77, 78) avec service 
                d'urgence pour situations imprévisibles.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-semibold mb-2">Service d'urgence disponible</h3>
                <p className="text-sm text-red-700">
                  En cas d'imprévu (maladie, accident, urgence professionnelle), nous intervenons dans les plus brefs 
                  délais pour prendre soin de votre compagnon.
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
                "Luna, ma chatte très peureuse, a immédiatement adopté Marie de Bika Animals. Les photos quotidiennes 
                pendant mes vacances m'ont rassurée. Je recommande vivement !"
              </blockquote>
              <cite className="text-sm font-semibold">- Claire P., propriétaire de Luna, Paris 11e</cite>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Confiez vos compagnons à Bika Animals
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Pet-sitters professionnels pour le bien-être de vos animaux
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

export default BikaAnimals;