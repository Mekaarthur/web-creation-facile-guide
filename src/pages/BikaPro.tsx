import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Shield, MapPin, TrendingUp, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaPro = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Expert administratif",
      price: "35€/h",
      description: "Experts administratifs externalisés pour vos besoins ponctuels ou récurrents"
    },
    {
      name: "Executive expert",
      price: "45€/h",
      description: "Expert executive à la carte pour missions stratégiques et management"
    },
    {
      name: "Organisation événements",
      price: "50€/h",
      description: "Organisation professionnelle de séminaires, boards, événements corporate"
    },
    {
      name: "Gestion déplacements",
      price: "40€/h",
      description: "Gestion complète des déplacements d'équipe, logistique voyages d'affaires"
    },
    {
      name: "Support business",
      price: "55€/h",
      description: "Support business personnalisé, assistant de direction externalisé"
    }
  ];

  const advantages = [
    {
      title: "Flexibilité opérationnelle",
      description: "Ressources expertes disponibles selon vos besoins, sans contrainte RH"
    },
    {
      title: "Réduction des coûts",
      description: "Économies significatives vs recrutement et formation interne"
    },
    {
      title: "Expertise immédiate",
      description: "Professionnels expérimentés opérationnels dès la première mission"
    },
    {
      title: "Avantage social innovant",
      description: "Service proposable aux collaborateurs pour améliorer leur équilibre vie pro/perso"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Pro - Services aux entreprises",
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
        <title>Bika Pro - Services aux entreprises Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services B2B aux entreprises Île-de-France. Expert administratif, executive, organisation événements, support business. Avantage social collaborateurs. Déductible." 
        />
        <meta 
          name="keywords" 
          content="services entreprise ile de france, expert administratif b2b, executive assistant, organisation seminaire, support business, avantage social collaborateur" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-pro-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Bika Pro - Services aux entreprises Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Pro optimise la performance de vos équipes. Notre service B2B propose des solutions expertes aux 
                entreprises franciliennes pour améliorer l'efficacité opérationnelle et offrir des avantages sociaux 
                innovants à vos collaborateurs.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Excellence B2B
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance optimisée
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Users className="w-4 h-4 mr-2" />
                  Avantage social
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Confidentialité absolue
                </Badge>
              </div>
              <Button 
                size="lg" 
                onClick={() => navigate('/custom-request')}
                className="bg-slate-700 hover:bg-slate-800 text-white"
              >
                Demander une présentation
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Pro</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-slate-700 font-semibold border-slate-700">
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

        {/* Excellence B2B Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Excellence B2B</h2>
              <p className="text-lg text-center text-muted-foreground mb-12">
                Nos experts Bika Pro possèdent une expérience significative en entreprise et maîtrisent les enjeux du 
                monde professionnel. Solutions sur-mesure adaptées à votre secteur d'activité et vos contraintes spécifiques.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Expertise sectorielle</h3>
                  <p className="text-muted-foreground">
                    Nos experts proviennent de différents secteurs d'activité : finance, tech, conseil, industrie. 
                    Ils comprennent vos enjeux métiers et s'adaptent rapidement à votre environnement de travail.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Réactivité professionnelle</h3>
                  <p className="text-muted-foreground">
                    Intervention rapide pour vos urgences business, disponibilité étendue, confidentialité absolue 
                    respectant vos exigences de discrétion corporate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Advantages Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Avantages business</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {advantages.map((advantage, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-700">{advantage.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {advantage.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Social Benefit Section */}
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Avantage social innovant</h2>
              <p className="text-lg text-center text-muted-foreground mb-12">
                Proposez Bika Pro à vos salariés comme avantage social. Amélioration de l'équilibre vie professionnelle/vie 
                personnelle, réduction du stress, augmentation de la productivité.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Bien-être collaborateurs</h3>
                  <p className="text-sm text-muted-foreground">Réduction du stress lié à la charge mentale personnelle</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Productivité accrue</h3>
                  <p className="text-sm text-muted-foreground">Collaborateurs plus concentrés sur leurs missions</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Fidélisation talents</h3>
                  <p className="text-sm text-muted-foreground">Avantage social différenciant et apprécié</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Cas d'usage Bika Pro</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Pour votre entreprise</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Organisation de séminaires et événements corporate</li>
                    <li>• Support administratif pour projets spéciaux</li>
                    <li>• Gestion logistique des déplacements d'équipe</li>
                    <li>• Assistant executive temporaire</li>
                    <li>• Support business pour les dirigeants</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Pour vos collaborateurs</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Services Bika Maison (courses, commissions)</li>
                    <li>• Services Bika Kids (garde d'enfants)</li>
                    <li>• Services Bika Vie (démarches administratives)</li>
                    <li>• Services Bika Travel (organisation voyages)</li>
                    <li>• Tous services avec crédit d'impôt 50%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Optimization Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Optimisation fiscale</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Services déductibles pour les entreprises, CESU préfinancé accepté, crédit d'impôt famille 
                pour vos collaborateurs utilisateurs.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-4">Avantages fiscaux :</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                  <div>• Services B2B déductibles</div>
                  <div>• CESU préfinancé accepté</div>
                  <div>• Crédit d'impôt 50% collaborateurs</div>
                  <div>• Optimisation charges sociales</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Zones d'intervention</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Couverture complète Île-de-France (Paris, 91, 92, 93, 94, 95, 77, 78) pour tous vos sites 
                et collaborateurs.
              </p>
              <div className="flex justify-center">
                <Badge variant="outline" className="text-lg py-3 px-6">
                  <MapPin className="w-5 h-5 mr-2" />
                  Paris • La Défense • Roissy • Orly • Toute IDF
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Optimisez votre performance avec Bika Pro
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Solutions expertes B2B et avantage social innovant pour vos équipes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/custom-request')}
              >
                Demander une présentation
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-slate-700"
                onClick={() => navigate('/contact')}
              >
                Contacter notre équipe B2B
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BikaPro;