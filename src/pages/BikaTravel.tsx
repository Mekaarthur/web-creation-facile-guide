import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Plane, CheckCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import { useAuth } from "@/hooks/useAuth";
import serviceTravelAirport from "@/assets/service-travel-airport.jpg";
import serviceTravelKids from "@/assets/service-travel-kids.jpg";
import ServiceSubgrid from "@/components/ServiceSubgrid";

const BikaTravel = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    // a) Préparation voyage (30€/h)
    {
      name: "Réservations transports",
      price: 30,
      description: "Recherche et réservation billets avion/train"
    },
    {
      name: "Hébergements et activités",
      price: 30,
      description: "Réservation hébergements (hôtels, locations), activités & excursions"
    },
    {
      name: "Itinéraires personnalisés",
      price: 30,
      description: "Organisation itinéraires personnalisés"
    },
    
    // b) Formalités & Documents (30€/h)
    {
      name: "Passeports et visas",
      price: 30,
      description: "Assistance renouvellement passeports/visas, validité documents voyage"
    },
    {
      name: "Assurances et change",
      price: 30,
      description: "Assurances voyage & rapatriement, change devises"
    },
    
    // c) Assistance 24/7
    {
      name: "Gestion imprévus",
      price: 30,
      description: "Gestion imprévus & retards, modification réservation urgente"
    },
    {
      name: "Support multilingue",
      price: 30,
      description: "Support multilingue à destination"
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
      "price": service.price,
      "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Travel - Services aux voyageurs Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services aux voyageurs en Île-de-France. Aide pré-voyage, transferts aéroport, veille de vols, Travel-Kids. Voyagez sereinement. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="aide voyage ile de france, transfert aeroport paris, veille vol, travel kids, services voyageurs, concierge voyage" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-travel-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Travel - Services aux Voyageurs" />
      
      <main className="pt-20">
        {user ? (
          <>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-sky-50 to-blue-50 py-20">
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
                      Bika Travel
                      <br />
                      <span className="text-sky-600">Services aux Voyageurs</span>
                    </h1>
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-800">✈️ Innovation voyage</Badge>
                    </div>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Conciergerie voyage unique avec le même expert de confiance. 
                      Préparation + transferts + veille de vols + Travel-Kids. 
                      Voyages sans stress garantis.
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                          <Plane className="w-3 h-3 text-sky-600" />
                        </div>
                        <span className="text-sm text-gray-600">Expert voyage</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Suivi temps réel</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Shield className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm text-gray-600">CDG & Orly</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-600">Rebooking auto</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        size="lg" 
                        onClick={() => navigate('/custom-request')}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3"
                      >
                        Démarrer maintenant →
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={() => navigate('/custom-request')}
                        className="border-sky-200 text-sky-600 hover:bg-sky-50 px-8 py-3"
                      >
                        Envoyer une demande personnalisée
                      </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          <div className="w-6 h-6 bg-sky-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Image */}
                  <div className="relative">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                      <img 
                        src="/src/assets/service-travel-full.jpg" 
                        alt="Service voyage Bika Travel" 
                        className="w-full h-auto"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        🟢 En ligne
                      </div>
                      {/* Rating Badge */}
                      <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-sky-600">4.9</div>
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
                        className="bg-white border-sky-200 text-sky-600 hover:bg-sky-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <ServiceSubgrid categoryKey="travel" />

            {/* Services List */}
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Travel</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {services.map((service, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge variant="outline" className="text-sky-600 border-sky-200 font-semibold">
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
                          className="bg-sky-600 hover:bg-sky-700 text-white w-full"
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
            <RelatedServices currentService="travel" />
          </>
        ) : (
          <div className="py-20">
            <ClientSpace />
          </div>
        )}
      </main>

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "travel" }}
          packageTitle="Bika Travel"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaTravel;