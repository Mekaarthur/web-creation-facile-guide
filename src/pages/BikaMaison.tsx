import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, ShoppingCart, CheckCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import serviceMaisonErrands from "@/assets/service-maison-errands.jpg";
import serviceMaisonRepairs from "@/assets/service-maison-repairs.jpg";

const BikaMaison = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    {
      name: "Courses & Approvisionnement",
      price: 25,
      description: "Courses alimentaires hebdomadaires, courses de première nécessité, achats spécialisés (bio, sans gluten), gestion des stocks"
    },
    {
      name: "Courses urgentes et de nuit",
      price: 25,
      description: "Courses urgentes (livraison express), courses de nuit et livraison"
    },
    {
      name: "Logistique & Organisation",
      price: 25,
      description: "Retrait des colis et livraisons, gestion des rendez-vous artisans/techniciens, coordination des travaux"
    },
    {
      name: "Aide au déménagement",
      price: 30,
      description: "Faire les cartons, aide au transport des cartons et meubles, rangement et organisation d'espaces"
    },
    {
      name: "Entretien jardins",
      price: 25,
      description: "Entretien des jardins et espaces verts (sur demande)"
    },
    {
      name: "Maintenance",
      price: 25,
      description: "Aide au montage des meubles, aide à la plomberie de base"
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
      "price": service.price,
      "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Maison - Logistique quotidienne Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Service logistique quotidienne en Île-de-France. Courses, commissions, rangement, petits travaux. Notre service le plus populaire. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="courses domicile ile de france, commissions paris, logistique quotidienne, courses express, recuperation colis, rangement maison" 
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
        <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-6">
                <div className="text-sm text-blue-600 font-medium">
                  ⭐ Services BIKA #1 en France
                </div>
                <div className="text-lg text-pink-500 italic">
                  "La charge mentale en moins, la sérénité en plus"
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Bika Maison
                  <br />
                  <span className="text-green-600">Logistique Quotidienne</span>
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-yellow-100 text-yellow-800">⭐ Service populaire</Badge>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Notre service qui révolutionne votre quotidien ! Courses + commissions + rangement 
                  avec le même prestataire de confiance. Libérez-vous de toutes les tâches chronophages.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Courses personnalisées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Express 2h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Home className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Petits travaux</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-sm text-gray-600">Flexibilité totale</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    Démarrer maintenant →
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-green-200 text-green-600 hover:bg-green-50 px-8 py-3"
                  >
                    Envoyer une demande personnalisée
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                  </div>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-maison-full.jpg" 
                    alt="Service logistique Bika Maison" 
                    className="w-full h-auto"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🟢 En ligne
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4.9</div>
                      <div className="text-xs text-gray-500">Note moyenne</div>
                      <div className="flex justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions rapides */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <CallToActionButtons 
                    size="sm" 
                    variant="outline" 
                    className="bg-white border-green-200 text-green-600 hover:bg-green-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Commencez dès maintenant</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Courses regulières</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Planifiez vos courses hebdomadaires avec votre logisticien personnel
                  </CardDescription>
                  <Button 
                    onClick={() => navigate('/custom-request')}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    Planifier maintenant
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Express 2h</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Besoin urgent ? Nous intervenons en moins de 2 heures
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full"
                  >
                    Demande express
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Sur mesure</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Décrivez vos besoins spécifiques pour un service personnalisé
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 w-full"
                  >
                    Service sur mesure
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Services en action */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-green-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des logisticiens experts à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-maison.jpg" 
                    alt="Courses et logistique" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Courses personnalisées</h3>
                <p className="text-gray-600">
                  Nos logisticiens connaissent vos habitudes et préférences pour des courses optimales
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceMaisonErrands} 
                    alt="Commissions et démarches" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Toutes commissions</h3>
                <p className="text-gray-600">
                  Pressing, pharmacie, récupération de colis - nous nous occupons de tout
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceMaisonRepairs} 
                    alt="Petits travaux maison" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Petits travaux</h3>
                <p className="text-gray-600">
                  Montage, réparations simples, rangement - votre logisticien fait tout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Maison</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-200 font-semibold">
                        {`${service.price}€/h`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4">
                      {service.description}
                    </CardDescription>
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                      size="sm"
                    >
                      Réserver ce service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popularity Section */}
        <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <Badge className="bg-yellow-500 text-white px-4 py-2 text-lg">
                  ⭐ Service le plus populaire
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Pourquoi Bika Maison est-il si populaire ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Notre service s'adapte parfaitement au rythme effréné des familles franciliennes. 
                Nos logisticiens connaissent parfaitement les commerces de proximité et optimisent 
                chaque déplacement pour votre économie de temps.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">Flexibilité totale</h3>
                  <p className="text-sm text-gray-600">
                    Intervention 7j/7 avec réactivité exceptionnelle pour les demandes express
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">Économies garanties</h3>
                  <p className="text-sm text-gray-600">
                    Crédit d'impôt de 50% + optimisation de vos achats et déplacements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Réservation */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-green-600">
              Réserver un service maintenant
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Choisissez votre service et planifiez votre intervention en quelques clics
            </p>
            <Button 
              size="lg" 
              onClick={() => handleOpenBooking(services[0])}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Rejoignez les milliers de familles satisfaites
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Adoptez notre service le plus populaire dès aujourd'hui
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3"
            >
              Obtenir mon devis gratuit
            </Button>
          </div>
        </section>

      <RelatedServices currentService="maison" />
      </main>

      <ClientSpace />

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "maison" }}
          packageTitle="Bika Maison"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaMaison;