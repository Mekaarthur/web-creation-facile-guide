import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, MapPin, Calculator, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaSeniors = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Aide quotidienne",
      price: "24€/h",
      description: "Assistance dans les activités quotidiennes, toilette, habillage, préparation repas"
    },
    {
      name: "Accompagnement médical",
      price: "27€/h",
      description: "Accompagnement aux rendez-vous médicaux, suivi des traitements"
    },
    {
      name: "Courses seniors",
      price: "26€/h",
      description: "Courses alimentaires et pharmaceutiques adaptées aux besoins spécifiques"
    },
    {
      name: "Compagnie",
      price: "24€/h",
      description: "Temps de compagnie, conversation, jeux, lecture, sorties de proximité"
    },
    {
      name: "Aide mobilité",
      price: "28€/h",
      description: "Aide à la mobilité, transferts sécurisés, assistance pour les repas"
    }
  ];

  const benefits = [
    {
      title: "Maintien à domicile",
      description: "Permet aux seniors de rester dans leur environnement familier"
    },
    {
      title: "Soutien aux aidants",
      description: "Temps de répit pour les familles et coordination avec les équipes soignantes"
    },
    {
      title: "Dignité préservée",
      description: "Respect de l'autonomie et de la dignité de chaque personne âgée"
    },
    {
      title: "Lien social",
      description: "Lutte contre l'isolement par la présence et l'écoute bienveillante"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Seniors - Aide personnes âgées",
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
        <title>Bika Seniors - Aide personnes âgées Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Aide à domicile personnes âgées Île-de-France. Accompagnement médical, aide quotidienne, compagnie, maintien autonomie. Auxiliaires formées. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="aide domicile personnes agees ile de france, accompagnement seniors paris, aide quotidienne senior, maintien domicile, auxiliaire vie sociale" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-seniors-ile-de-france" />
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
                Bika Seniors - Aide personnes âgées Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Seniors accompagne les personnes âgées avec bienveillance et professionnalisme. Notre équipe 
                spécialisée permet aux seniors de conserver leur autonomie à domicile tout en offrant un précieux 
                soutien aux familles en Île-de-France.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Heart className="w-4 h-4 mr-2" />
                  Approche bienveillante
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Users className="w-4 h-4 mr-2" />
                  Soutien aux familles
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Seniors</h2>
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

        {/* Human Approach Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Approche humaine Bikawo</h2>
              <p className="text-lg text-center text-muted-foreground mb-12">
                Nos auxiliaires Bika Seniors sont formées à l'accompagnement des personnes âgées avec une attention 
                particulière portée au respect de la dignité et de l'autonomie. Relation de confiance privilégiée.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Formation spécialisée</h3>
                  <p className="text-muted-foreground">
                    Nos intervenantes sont formées aux spécificités de l'accompagnement des seniors : patience, 
                    écoute active, adaptation au rythme de la personne, respect des habitudes de vie.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Continuité des soins</h3>
                  <p className="text-muted-foreground">
                    Affectation d'intervenantes régulières pour créer une relation de confiance durable. 
                    Coordination avec les professionnels de santé et la famille.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Les bénéfices de Bika Seniors</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {benefit.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Family Support Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Soutien aux familles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Temps de répit</h3>
                  <p className="text-muted-foreground">
                    Service de répit pour les aidants familiaux, leur permettant de souffler, de s'occuper d'eux-mêmes 
                    ou de leurs autres obligations professionnelles et personnelles.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Communication transparente</h3>
                  <p className="text-muted-foreground">
                    Coordination avec les équipes soignantes, rapports réguliers sur l'évolution de la situation. 
                    Accompagnement global de la famille dans cette période délicate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flexibility Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Flexibilité adaptée</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Interventions ponctuelles ou régulières selon les besoins évolutifs de la personne âgée. 
                Adaptation du service en fonction de l'état de santé et des souhaits de la famille.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Types d'interventions :</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>• Ponctuelle (urgence)</div>
                  <div>• Quotidienne</div>
                  <div>• Hebdomadaire</div>
                  <div>• Post-hospitalisation</div>
                  <div>• Évolutive selon besoins</div>
                  <div>• Coordination médicale</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Benefit Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Avantage fiscal majeur</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Crédit d'impôt de 50% sur tous nos services d'aide à domicile, réduisant considérablement le coût 
                de l'accompagnement des seniors.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-800 mb-4">Exemple pour 20h d'aide par mois à 25€/h :</p>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Coût mensuel (20h × 25€)</span>
                    <span className="font-semibold">500€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédit d'impôt 50%</span>
                    <span className="font-semibold">-250€</span>
                  </div>
                  <hr className="my-2 border-green-300" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Coût réel mensuel</span>
                    <span>250€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Témoignage</h2>
              <blockquote className="text-lg italic text-muted-foreground mb-6">
                "Depuis que Mme Dupont de Bika Seniors accompagne ma mère, elle a retrouvé le sourire. 
                Une présence rassurante et professionnelle qui nous permet enfin de souffler en famille."
              </blockquote>
              <cite className="text-sm font-semibold">- Jean-Paul M., fils d'une bénéficiaire, Neuilly-sur-Seine</cite>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Accompagnement bienveillant avec Bika Seniors
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Préservez l'autonomie et la dignité de vos proches âgés
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

export default BikaSeniors;