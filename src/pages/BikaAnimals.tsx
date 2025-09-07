import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, PawPrint, CheckCircle, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import serviceAnimals from "@/assets/service-animals.jpg";
import servicePetCare from "@/assets/service-pet-care.jpg";
import serviceseniorsCare from "@/assets/service-seniors-care.jpg";
import { servicesData } from "@/utils/servicesData";
import ServiceSubgrid from "@/components/ServiceSubgrid";

const BikaAnimals = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const serviceData = servicesData.animals;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Animals - Services pour animaux",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": serviceData.subservices.map(service => ({
      "@type": "Offer", "name": service.title, "description": service.description,
      "price": service.price, "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Animals - Services pour animaux Île-de-France | Bikawo</title>
        <meta name="description" content="Services pour animaux en Île-de-France. Pet-sitting, promenades, vétérinaire, toilettage. Nos experts chouchoutent vos compagnons. Crédit d'impôt 50%." />
        <meta name="keywords" content="pet sitting ile de france, garde animaux paris, promenade chien, veterinaire accompagnement, toilettage animaux domicile" />
        <link rel="canonical" href="https://bikawo.fr/bika-animals-ile-de-france" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Animals - Services pour Animaux" />
      
      <main className="pt-20">
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Services pour animaux
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,9/5 - 1 000+ propriétaires</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mb-2">
                    Dès 30€/h, soit 15€/h avec le crédit d'impôt
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Experts animaliers passionnés</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Service 7j/7 avec photos & nouvelles</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Paris & Île-de-France</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Réserver mon service
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                  >
                    Devenir pet-sitter Bikawo
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-animals-full.jpg" 
                    alt="Service animaux Bika Animals" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi nous choisir - Style Wecasa */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous allez nous aimer</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est passionné</h3>
                <p className="text-gray-600">
                  Experts animaliers qui aiment vraiment les animaux et connaissent leurs besoins.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-emerald-50 to-teal-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est connecté</h3>
                <p className="text-gray-600">
                  Photos et nouvelles régulières de vos compagnons pour votre tranquillité.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-teal-50 to-blue-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est attentionné</h3>
                <p className="text-gray-600">
                  Service 7j/7 avec attention particulière aux habitudes de chaque animal.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="animals" />

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Animals</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceData.subservices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-200 font-semibold">{`${service.price}€/h`}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4">{service.description}</CardDescription>
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
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

        {/* Services en action */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-green-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des experts animaliers à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceAnimals} 
                    alt="Service animaux professionnels" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Promenades expertes</h3>
                <p className="text-gray-600">
                  Nos experts animaliers connaissent parfaitement les besoins de chaque animal
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={servicePetCare} 
                    alt="Garde d'animaux" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Garde d'animaux</h3>
                <p className="text-gray-600">
                  Services de garde attentionnés respectant les habitudes de vos compagnons
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceseniorsCare} 
                    alt="Soins vétérinaires" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Accompagnement vétérinaire</h3>
                <p className="text-gray-600">
                  Accompagnement aux rendez-vous vétérinaires avec suivi attentif
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Offrez le meilleur à vos compagnons</h2>
            <p className="text-xl mb-8 opacity-90">Confiez vos animaux à nos experts pour leur bonheur et votre tranquillité</p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/custom-request')}
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3">
              Obtenir mon devis gratuit
            </Button>
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
              onClick={() => handleOpenBooking(serviceData.subservices[0])}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        <RelatedServices currentService="animals" />
      </main>

      <ClientSpace />

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "animals" }}
          packageTitle="Bika Animals"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaAnimals;