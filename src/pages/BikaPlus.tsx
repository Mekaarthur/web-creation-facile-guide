import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, MapPin, Calculator, MessageCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaPlus = () => {
  const navigate = useNavigate();

  const features = [
    {
      name: "Chef Family Officer dédié",
      description: "Votre interlocuteur unique qui coordonne tous vos besoins familiaux"
    },
    {
      name: "Ligne prioritaire + WhatsApp instantané",
      description: "Contact direct 24h/24 pour toutes vos urgences"
    },
    {
      name: "Organisation complète planning familial",
      description: "Gestion totale des agendas, rendez-vous, activités"
    },
    {
      name: "Garde soir, week-end, nuit",
      description: "Disponibilité maximale pour tous vos besoins de garde"
    },
    {
      name: "Accès illimité",
      description: "Utilisation libre de tous les autres services Bikawo sans limitation"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Plus - Service premium 7j/7",
    "provider": {
      "@type": "Organization",
      "name": "Bikawo",
      "url": "https://bikawo.fr"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Île-de-France"
    },
    "offers": {
      "@type": "Offer",
      "name": "Abonnement Bika Plus",
      "description": "Service premium familial avec Chef Family Officer dédié",
      "price": "1500",
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Plus - Service premium 7j/7 Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Service premium familial Île-de-France. Chef Family Officer dédié, ligne prioritaire 24h/24, accès illimité aux services. À partir de 1500€/mois. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="service premium familial ile de france, chef family officer, conciergerie haut de gamme paris, service 24h 7j/7, abonnement premium famille" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-plus-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-yellow-50 to-amber-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <Badge variant="default" className="text-sm py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Service Premium
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Bika Plus - Service premium 7j/7 Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Plus, l'excellence du service premium familial. Notre offre haut de gamme à partir de 1500€/mois 
                vous offre un accompagnement complet avec un Chef Family Officer dédié pour une gestion optimale de 
                votre vie familiale en Île-de-France.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact 24h/24
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Équipe dédiée
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Clock className="w-4 h-4 mr-2" />
                  Service 7j/7
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Calculator className="w-4 h-4 mr-2" />
                  Crédit d'impôt 50%
                </Badge>
              </div>
              <div className="bg-white/70 rounded-lg p-6 mb-8">
                <p className="text-2xl font-bold text-primary mb-2">À partir de 1500€/mois</p>
                <p className="text-sm text-muted-foreground">Crédit d'impôt 50% applicable • Facturation mensuelle transparente</p>
              </div>
              <Button 
                size="lg" 
                onClick={() => navigate('/custom-request')}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
              >
                Demander un devis premium
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Votre service Bika Plus inclut</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Excellence Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">L'excellence Bikawo</h2>
              <p className="text-lg text-center text-muted-foreground mb-12">
                Bika Plus s'adresse aux familles exigeantes recherchant un service d'exception. Votre Chef Family Officer 
                devient le véritable bras droit de votre organisation familiale, anticipant vos besoins et optimisant votre quotidien.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Service ultra-personnalisé</h3>
                  <p className="text-muted-foreground">
                    Chaque famille Bika Plus bénéficie d'un service sur-mesure adapté à son mode de vie, ses contraintes 
                    professionnelles et ses exigences particulières.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Disponibilité totale</h3>
                  <p className="text-muted-foreground">
                    Service 7j/7, 24h/24 dans toute l'Île-de-France avec intervention immédiate en cas d'urgence familiale. 
                    Équipe dédiée exclusivement aux abonnés Premium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Bika Plus vs Services ponctuels</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-center">Services ponctuels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-4 h-4 border border-gray-400 rounded mr-3"></span>
                      <span className="text-sm">Réservation à chaque besoin</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 border border-gray-400 rounded mr-3"></span>
                      <span className="text-sm">Interlocuteurs différents</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 border border-gray-400 rounded mr-3"></span>
                      <span className="text-sm">Disponibilité limitée</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 border border-gray-400 rounded mr-3"></span>
                      <span className="text-sm">Facturation à l'usage</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardHeader>
                    <CardTitle className="text-center text-primary">Bika Plus Premium</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-500 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                      <span className="text-sm">Accès immédiat 24h/24</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-500 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                      <span className="text-sm">Chef Family Officer dédié</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-500 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                      <span className="text-sm">Services illimités inclus</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-500 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                      <span className="text-sm">Tarif mensuel prévisible</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Serenity Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Sérénité absolue</h2>
              <p className="text-xl text-white/90 mb-8">
                Avec Bika Plus, votre charge mentale familiale disparaît totalement. Concentrez-vous sur l'essentiel 
                pendant que nous gérons tout le reste.
              </p>
              <blockquote className="text-lg italic text-white/80 mb-6">
                "Bika Plus a révolutionné notre vie de famille. Notre Chef Family Officer Marlène connaît tous nos besoins, 
                anticipe nos demandes et nous permet enfin de profiter pleinement de nos soirées et week-ends."
              </blockquote>
              <cite className="text-sm text-white/70">- Famille Dubois, abonnés Bika Plus depuis 2 ans</cite>
            </div>
          </div>
        </section>

        {/* Investment Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Investissement maîtrisé</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Crédit d'impôt de 50% applicable, réduisant significativement le coût de votre abonnement premium. 
                Facturation mensuelle transparente sans surprise.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-4">Exemple de calcul pour un abonnement à 2000€/mois :</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Coût mensuel</span>
                    <span className="font-semibold">2000€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédit d'impôt 50%</span>
                    <span className="font-semibold text-green-600">-1000€</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Coût réel mensuel</span>
                    <span>1000€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-500 to-amber-500">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Découvrez l'excellence Bika Plus
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez les familles d'exception qui ont choisi la sérénité absolue
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
            >
              Demander une présentation personnalisée
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BikaPlus;