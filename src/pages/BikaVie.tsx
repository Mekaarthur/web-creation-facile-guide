import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, FileText, CheckCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import { useAuth } from "@/hooks/useAuth";
import serviceVieCalendar from "@/assets/service-vie-calendar.jpg";
import serviceVieEvents from "@/assets/service-vie-events.jpg";

const BikaVie = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    // a) Services administratifs familiaux (25€/h)
    {
      name: "Gestion courrier et documents",
      price: 25,
      description: "Gestion courrier et documents, prise rdv médicaux/administratifs"
    },
    {
      name: "Suivi abonnements",
      price: 25,
      description: "Suivi abonnements, archivage documents"
    },
    {
      name: "Accompagnement rendez-vous",
      price: 25,
      description: "Accompagnement aux rendez-vous, archivage et classement documents personnels"
    },
    
    // b) Services personnels (25€/h)
    {
      name: "Pressing et cordonnerie",
      price: 25,
      description: "Dépôt/retrait pressing & cordonnerie"
    },
    {
      name: "Réservations",
      price: 25,
      description: "Réservations restaurants / spectacles"
    },
    
    // Assistance quotidienne
    {
      name: "Gestion planning",
      price: 25,
      description: "Gestion planning personnel, interface avec administrations"
    },
    {
      name: "Résolution problèmes",
      price: 25,
      description: "Résolution de problèmes du quotidien"
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
      "price": service.price,
      "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Vie - Conciergerie et administration Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services de conciergerie et administration en Île-de-France. Rendez-vous médicaux, dossiers administratifs, organisation événements. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="conciergerie ile de france, aide administrative paris, gestion agenda familial, organisation evenements, rendez vous medicaux" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-vie-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Vie - Conciergerie & Administration" />
      
      <main className="pt-20">
        {user ? (
          <>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-20">
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
                      Bika Vie
                      <br />
                      <span className="text-purple-600">Conciergerie & Administration</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Services administratifs experts avec le même conseiller de confiance. 
                      Rendez-vous médicaux + dossiers administratifs + organisation événements. 
                      Libération totale de votre charge mentale.
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <FileText className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-600">Expert administratif</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Gestion d'agenda</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm text-gray-600">Conseiller dédié</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-pink-600" />
                        </div>
                        <span className="text-sm text-gray-600">Suivi personnalisé</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        size="lg" 
                        onClick={() => navigate('/custom-request')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3"
                      >
                        Démarrer maintenant →
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={() => navigate('/custom-request')}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-3"
                      >
                        Envoyer une demande personnalisée
                      </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
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
                        src="/src/assets/service-vie-full.jpg" 
                        alt="Service conciergerie Bika Vie" 
                        className="w-full h-auto"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        🟢 En ligne
                      </div>
                      {/* Rating Badge */}
                      <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">4.9</div>
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
                        className="bg-white border-purple-200 text-purple-600 hover:bg-purple-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Services List */}
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Vie</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {services.map((service, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge variant="outline" className="text-purple-600 border-purple-200 font-semibold">
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
                          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
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
            <RelatedServices currentService="vie" />
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
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "vie" }}
          packageTitle="Bika Vie"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaVie;