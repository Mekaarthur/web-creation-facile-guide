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
import ServiceSubgrid from "@/components/ServiceSubgrid";
import { servicesData } from "@/utils/servicesData";

const BikaVie = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const serviceData = servicesData.vie;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

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
    "offers": serviceData.subservices.map(service => ({
      "@type": "Offer",
      "name": service.title,
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
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Conciergerie & Assistance
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,8/5 - 1 200+ avis vérifiés</span>
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
                    <span className="text-lg">Assistants experts et discrets</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Démarches administratives simplifiées</span>
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
                    Devenir assistant Bikawo
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-vie-full.jpg" 
                    alt="Service conciergerie Bika Vie" 
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
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est discret</h3>
                <p className="text-gray-600">
                  Nos assistants sont formés à la confidentialité et gèrent vos affaires avec la plus grande discrétion.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-purple-50 to-violet-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est organisé</h3>
                <p className="text-gray-600">
                  Gestion d'agenda, rappels, suivi des démarches - nous organisons votre vie administrative.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est réactif</h3>
                <p className="text-gray-600">
                  Appels d'urgence, démarches express, nous sommes toujours disponibles pour vous aider.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="vie" />

        {/* Services List - SUPPRIMÉ */}
        <RelatedServices currentService="vie" />
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