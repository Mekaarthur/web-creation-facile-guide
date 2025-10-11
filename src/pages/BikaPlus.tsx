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
import servicePremiumImage from "@/assets/service-premium.jpg";

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
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-hero py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-primary-foreground space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Service Premium 7j/7
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary-foreground text-primary-foreground" />
                      ))}
                    </div>
                    <span className="text-primary-foreground/90 font-medium">5,0/5 - Excellence garantie</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mb-2">
                    À partir de 1500€/mois, crédit d'impôt applicable
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                    <span className="text-lg">Chef Family Officer dédié 24h/7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                    <span className="text-lg">Accès illimité à tous nos services</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                    <span className="text-lg">Ligne prioritaire et service sur-mesure</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Découvrir Bika Plus
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg font-semibold"
                  >
                    Demander une présentation
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={servicePremiumImage} 
                    alt="Service premium Bika Plus" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi nous choisir - Style Wecasa */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Vous allez nous aimer</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center border-0 bg-gradient-subtle p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">On est premium</h3>
                <p className="text-muted-foreground">
                  Chef Family Officer dédié 24h/7 pour une qualité de service exceptionnelle.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-subtle p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">On est disponible</h3>
                <p className="text-muted-foreground">
                  Ligne prioritaire WhatsApp et accès illimité à tous nos services.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-subtle p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">On est sur-mesure</h3>
                <p className="text-muted-foreground">
                  Service entièrement personnalisé selon vos besoins familiaux spécifiques.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Service Inclusions */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Service Bika Plus - Inclusions</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Un service premium sur-mesure avec votre Chef Family Officer dédié
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceData.subservices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-accent/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-accent" />
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
                      className="bg-gradient-accent hover:opacity-90 text-accent-foreground w-full mt-4"
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
                className="bg-gradient-accent hover:opacity-90 text-accent-foreground px-8 py-3"
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