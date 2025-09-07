import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Briefcase, CheckCircle, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import { useAuth } from "@/hooks/useAuth";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import { servicesData } from "@/utils/servicesData";

const BikaPro = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const serviceData = servicesData.pro;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const structuredData = {
    "@context": "https://schema.org", "@type": "Service", "name": "Bika Pro - Services aux entreprises",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": serviceData.subservices.map(service => ({ "@type": "Offer", "name": service.title, "description": service.description, "price": service.price, "priceCurrency": "EUR" }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Pro - Services aux entreprises Île-de-France | Bikawo</title>
        <meta name="description" content="Services B2B Île-de-France. Experts administratifs, executive support, organisation événements. Optimisez vos équipes. Services déductibles." />
        <meta name="keywords" content="services entreprise ile de france, expert administratif paris, executive support, organisation evenement corporate, assistant direction" />
        <link rel="canonical" href="https://bikawo.fr/bika-pro-ile-de-france" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Pro - Services aux Entreprises" />
      
      <main className="pt-20">
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-slate-400 via-gray-500 to-blue-600 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Services aux entreprises
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,9/5 - 150+ entreprises</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mb-2">
                    Dès 40€/h, services déductibles
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Consultants B2B expérimentés</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Solutions sur mesure et avantages sociaux</span>
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
                    className="bg-white text-slate-600 hover:bg-gray-100 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Réserver mon service
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                  >
                    Devenir consultant Bikawo
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-business-full.jpg" 
                    alt="Service entreprise Bika Pro" 
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
              <Card className="text-center border-0 bg-gradient-to-br from-slate-50 to-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-500 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est professionnel</h3>
                <p className="text-gray-600">
                  Consultants B2B expérimentés, formés aux exigences du monde de l'entreprise.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est performant</h3>
                <p className="text-gray-600">
                  Solutions sur mesure qui optimisent vos équipes et offrent de vrais avantages sociaux.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est partenaire</h3>
                <p className="text-gray-600">
                  Relation de confiance durable avec vos équipes et services déductibles.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="pro" />

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Pro</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceData.subservices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge variant="outline" className="text-slate-600 border-slate-200 font-semibold">{`${service.price}€/h`}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4">{service.description}</CardDescription>
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className="bg-slate-600 hover:bg-slate-700 text-white w-full"
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
        <RelatedServices currentService="pro" />
      </main>

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "pro" }}
          packageTitle="Bika Pro"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaPro;