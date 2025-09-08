import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Users, CheckCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import serviceSeniors from "@/assets/service-seniors.jpg";
import serviceSeniorsAssistance from "@/assets/service-seniors-assistance.jpg";
import serviceseniorsCare from "@/assets/service-seniors-care.jpg";
import serviceSeniorsImage from "@/assets/service-seniors.jpg";
import { servicesData } from "@/utils/servicesData";
import ServiceSubgrid from "@/components/ServiceSubgrid";

const BikaSeniors = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const serviceData = servicesData.seniors;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const structuredData = {
    "@context": "https://schema.org", "@type": "Service", "name": "Bika Seniors - Aide personnes âgées",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": serviceData.subservices.map(service => ({ "@type": "Offer", "name": service.title, "description": service.description, "price": service.price, "priceCurrency": "EUR" }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Seniors - Aide personnes âgées Île-de-France | Bikawo</title>
        <meta name="description" content="Aide personnes âgées Île-de-France. Auxiliaires expérimentées, accompagnement médical, aide quotidienne. Maintien à domicile avec bienveillance. Crédit d'impôt 50%." />
        <meta name="keywords" content="aide personne agee ile de france, auxiliaire vie paris, accompagnement seniors, maintien domicile, aide quotidienne senior" />
        <link rel="canonical" href="https://bikawo.fr/bika-seniors-ile-de-france" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Seniors - Aide Personnes Âgées" />
      
      <main className="pt-20">
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Aide personnes âgées
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,9/5 - 1 500+ familles</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mb-2">
                    Dès 28€/h, soit 14€/h avec le crédit d'impôt
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Auxiliaires formées et bienveillantes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Maintien à domicile avec dignité</span>
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
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Réserver mon service
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                  >
                    Devenir auxiliaire Bikawo
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={serviceSeniorsImage} 
                    alt="Service seniors Bika Seniors" 
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
              <Card className="text-center border-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est bienveillant</h3>
                <p className="text-gray-600">
                  Auxiliaires formées à l'approche bienveillante pour un accompagnement respectueux.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-purple-50 to-violet-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est family</h3>
                <p className="text-gray-600">
                  Soutien aux familles avec communication régulière et accompagnement personnalisé.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est à domicile</h3>
                <p className="text-gray-600">
                  Maintien à domicile pour préserver l'autonomie et le cadre de vie familier.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="seniors" />


        {/* Services en action */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des professionnels bienveillants à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceSeniors} 
                    alt="Aide personnes âgées" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aide quotidienne</h3>
                <p className="text-gray-600">
                  Nos auxiliaires accompagnent avec bienveillance dans les activités du quotidien
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceSeniorsAssistance} 
                    alt="Accompagnement médical" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Accompagnement médical</h3>
                <p className="text-gray-600">
                  Suivi des rendez-vous médicaux et accompagnement personnalisé
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceseniorsCare} 
                    alt="Compagnie seniors" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Temps de compagnie</h3>
                <p className="text-gray-600">
                  Moments de convivialité et d'échange pour rompre l'isolement
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services List with Booking */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Seniors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceData.subservices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 font-semibold">
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
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
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

        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Accompagnement bienveillant pour vos proches</h2>
            <p className="text-xl mb-8 opacity-90">Préservez leur autonomie avec notre aide professionnelle</p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/custom-request')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
              Obtenir mon devis gratuit
            </Button>
          </div>
        </section>

        {/* Section Réservation */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-blue-600">
              Réserver un service maintenant
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Choisissez votre service et planifiez votre intervention en quelques clics
            </p>
            <Button 
              size="lg" 
              onClick={() => handleOpenBooking(serviceData.subservices[0])}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        <RelatedServices currentService="seniors" />
      </main>

      <ClientSpace />

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "seniors" }}
          packageTitle="Bika Seniors"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaSeniors;