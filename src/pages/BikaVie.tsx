import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaVie = () => {
  const navigate = useNavigate();

  const services = [
    {
      name: "Rendez-vous médicaux",
      price: "24€/h",
      description: "Prise, modification et gestion de tous vos rendez-vous médicaux"
    },
    {
      name: "Dossiers administratifs",
      price: "28€/h",
      description: "Constitution et dépôt de dossiers CAF, CPAM, préfecture"
    },
    {
      name: "Gestion d'agenda",
      price: "26€/h",
      description: "Gestion d'agenda partagé familial, rappels vaccins et échéances"
    },
    {
      name: "Organisation événements",
      price: "32€/h",
      description: "Organisation complète de fêtes familiales, baby-showers, célébrations"
    },
    {
      name: "Aide administrative",
      price: "30€/h",
      description: "Gestion administrative complète, suivi de dossiers complexes"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Vie - Conciergerie et administration",
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
        <title>Bika Vie - Conciergerie et administration Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services de conciergerie et aide administrative en Île-de-France. Gestion rendez-vous médicaux, dossiers CAF, CPAM, organisation événements. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="conciergerie ile de france, aide administrative paris, dossier caf cpam, rendez vous medical, organisation evenement familial, charge mentale" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-vie-ile-de-france" />
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
                Bika Vie - Conciergerie et administration Île-de-France
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Bika Vie simplifie votre vie administrative et organisationnelle. Notre équipe d'experts prend en charge 
                toutes vos démarches complexes et l'organisation de vos événements familiaux en Île-de-France, vous 
                libérant totalement de la charge mentale administrative.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <FileText className="w-4 h-4 mr-2" />
                  Experts administratifs
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Suivi personnalisé
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Vie</h2>
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
              <h2 className="text-3xl font-bold text-center mb-8">L'expertise administrative Bikawo</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Maîtrise des procédures</h3>
                  <p className="text-muted-foreground">
                    Nos conseillers Bika Vie maîtrisent parfaitement les rouages administratifs français et les 
                    spécificités franciliennes. Ils vous accompagnent avec méthode et efficacité dans toutes vos démarches.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Service personnalisé</h3>
                  <p className="text-muted-foreground">
                    Chaque famille bénéficie d'un suivi individualisé avec un interlocuteur dédié qui connaît 
                    parfaitement votre situation et vos besoins récurrents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Couverture complète</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Interventions dans toute l'Île-de-France (Paris et départements 91, 92, 93, 94, 95, 77, 78) avec 
                possibilité de déplacements dans toutes les administrations.
              </p>
              <div className="bg-primary/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Administrations partenaires :</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>• CAF</div>
                  <div>• CPAM</div>
                  <div>• Préfecture</div>
                  <div>• Mairies</div>
                  <div>• Pôle Emploi</div>
                  <div>• URSSAF</div>
                  <div>• Services fiscaux</div>
                  <div>• MDPH</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mental Load Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Libérez-vous de la charge mentale</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold mb-3">Avant Bika Vie</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Stress administratif constant</li>
                    <li>• Paperasse qui s'accumule</li>
                    <li>• Rendez-vous oubliés</li>
                    <li>• Démarches interminables</li>
                  </ul>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Avec Bika Vie</h3>
                  <ul className="text-sm space-y-2">
                    <li>• Sérénité totale</li>
                    <li>• Tout est géré pour vous</li>
                    <li>• Suivi personnalisé</li>
                    <li>• Résultats garantis</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold mb-3">Résultat</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Plus de temps en famille</li>
                    <li>• Moins de stress</li>
                    <li>• Efficacité maximale</li>
                    <li>• Crédit d'impôt 50%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Simplifiez votre vie avec Bika Vie
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Libérez-vous définitivement de la charge mentale administrative
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

export default BikaVie;