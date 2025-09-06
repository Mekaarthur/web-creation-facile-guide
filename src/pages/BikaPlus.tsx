import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import ServiceBookingForm from "@/components/ServiceBookingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Crown, CheckCircle, Briefcase, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { servicesData } from "@/utils/servicesData";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import { useAuth } from "@/hooks/useAuth";

const BikaPlus = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const serviceData = servicesData.plus;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const features = [
    // Projets personnalisés
    {
      name: "Étude besoins clients",
      description: "Étude besoins clients, solutions sur mesure"
    },
    {
      name: "Coordination équipes",
      description: "Coordination équipes, suivi projet A–Z"
    },
    
    // Services exclusifs
    {
      name: "Majordome personnel",
      description: "Majordome personnel, gestion patrimoine familial"
    },
    {
      name: "Organisation grands événements",
      description: "Organisation grands événements, coordinateur résidences multiples"
    },
    
    // Formules premium
    {
      name: "Service 24h/7",
      description: "Service 24h/7, équipe dédiée à une famille"
    },
    {
      name: "Urgences prioritaires",
      description: "Urgences prioritaires, accès partenaires exclusifs"
    },
    {
      name: "Reporting personnalisé",
      description: "Reporting détaillé et personnalisé"
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
          content="Service premium familial Île-de-France. Chef Family Officer dédié, ligne prioritaire, organisation planning familial. À partir de 1500€/mois. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="service premium familial ile de france, chef family officer, conciergerie haut de gamme, ligne prioritaire famille, organisation planning" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-plus-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Plus - Service Premium 7j/7" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-yellow-50 to-amber-50 py-20">
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
                  Bika Plus
                  <br />
                  <span className="text-amber-600">Service Premium 7j/7</span>
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-4 py-2">
                    <Crown className="w-4 h-4 mr-2" />
                    Service Premium
                  </Badge>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  L'excellence du service premium familial avec Chef Family Officer dédié. 
                  Organisation complète + ligne prioritaire + accès illimité tous services. 
                  Sérénité absolue garantie.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="text-sm text-gray-600">Chef dédié 24h/24</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm text-gray-600">WhatsApp prioritaire</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-600">Accès illimité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-rose-600" />
                    </div>
                    <span className="text-sm text-gray-600">Service sur-mesure</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-8 py-3"
                  >
                    Découvrir Bika Plus →
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-amber-200 text-amber-600 hover:bg-amber-50 px-8 py-3"
                  >
                    Demander une présentation
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-amber-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-rose-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">Familles VIP</span>
                  </div>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-premium-full.jpg" 
                    alt="Service premium Bika Plus" 
                    className="w-full h-auto"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ⭐ Premium
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">5.0</div>
                      <div className="text-xs text-gray-500">Excellence garantie</div>
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
                    className="bg-white border-amber-200 text-amber-600 hover:bg-amber-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Inclusions */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Service Bika Plus - Inclusions</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Un service premium sur-mesure avec votre Chef Family Officer dédié
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceData.subservices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-amber-100">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white w-full mt-4"
                      size="sm"
                    >
                      Découvrir ce service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button 
                size="lg"
                onClick={() => setIsBookingFormOpen(true)}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-8 py-3"
              >
                Découvrir Bika Plus
              </Button>
            </div>
          </div>
        </section>

        <RelatedServices currentService="plus" />
      </main>

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <ServiceBookingForm
          service={selectedService}
          packageTitle="Bika Plus"
          onClose={() => setIsBookingFormOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaPlus;