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
import { useState } from "react";

const BikaPlus = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const features = [
    {
      name: "Chef Family Officer dédié",
      description: "Votre interlocuteur unique qui coordonne tous vos besoins familiaux"
    },
    {
      name: "Ligne prioritaire + WhatsApp instantané",
      description: "Contact direct 24h/24 pour toutes vos urgences"
    },
    {
      name: "Organisation complète planning familial",
      description: "Gestion totale des agendas, rendez-vous, activités"
    },
    {
      name: "Garde soir, week-end, nuit",
      description: "Disponibilité maximale pour tous vos besoins de garde"
    },
    {
      name: "Accès illimité",
      description: "Utilisation libre de tous les autres services Bikawo sans limitation"
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
                    <span className="text-sm text-gray-600">Familles privilégiées Bika Plus</span>
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
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🟢 En ligne
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">4.9</div>
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
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                  <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-600 hover:bg-amber-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-600 hover:bg-amber-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-600 hover:bg-amber-50">
                    <Calculator className="w-4 h-4 mr-2" />
                    Devis
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Votre service Bika Plus inclut</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Chef Family Officer</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Votre interlocuteur unique dédié qui coordonne tous vos besoins familiaux
                  </CardDescription>
                  <div className="text-sm font-medium text-amber-600">✓ Inclus</div>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Ligne prioritaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    WhatsApp instantané + ligne prioritaire 24h/24 pour toutes urgences
                  </CardDescription>
                  <div className="text-sm font-medium text-amber-600">✓ Inclus</div>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Accès illimité</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Utilisation libre de tous les services Bikawo sans limitation
                  </CardDescription>
                  <div className="text-sm font-medium text-amber-600">✓ Inclus</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Premium Features */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-medium mb-2">L'excellence Bikawo</p>
              <h2 className="text-3xl font-bold text-gray-900">Service d'exception</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start">
                      <Star className="w-5 h-5 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
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
              <p className="text-amber-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">L'excellence premium à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-premium.jpg" 
                    alt="Service premium Bika Plus" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chef Family Officer</h3>
                <p className="text-gray-600">
                  Votre interlocuteur unique dédié qui coordonne tous vos besoins familiaux
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-premium-concierge.jpg" 
                    alt="Conciergerie premium" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Conciergerie d'exception</h3>
                <p className="text-gray-600">
                  Service de conciergerie haut de gamme avec ligne prioritaire 24h/24
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/diverse-family.jpg" 
                    alt="Service familial personnalisé" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Suivi personnalisé</h3>
                <p className="text-gray-600">
                  Accompagnement familial sur-mesure avec accès illimité à tous nos services
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Bika Plus vs Services standards</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Services standards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">• Interlocuteurs multiples</p>
                    <p className="text-sm text-gray-600">• Horaires limités</p>
                    <p className="text-sm text-gray-600">• Services facturés séparément</p>
                    <p className="text-sm text-gray-600">• Pas de suivi personnalisé</p>
                  </CardContent>
                </Card>
                
                <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-700 flex items-center">
                      <Crown className="w-5 h-5 mr-2" />
                      Bika Plus Premium
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm font-medium">• Chef Family Officer dédié</p>
                    <p className="text-sm font-medium">• Disponibilité 24h/24, 7j/7</p>
                    <p className="text-sm font-medium">• Accès illimité tous services</p>
                    <p className="text-sm font-medium">• Suivi personnalisé permanent</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Section */}
        <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Investissement maîtrisé</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-amber-700">Tarification transparente</h3>
                  <p className="text-3xl font-bold text-amber-600 mb-2">À partir de 1500€/mois</p>
                  <p className="text-sm text-gray-600">
                    Facturation mensuelle transparente sans surprise
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-green-700">Après crédit d'impôt</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">750€/mois réels</p>
                  <p className="text-sm text-green-600">
                    Crédit d'impôt de 50% applicable
                  </p>
                </div>
              </div>
              <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-600">
                  Avec Bika Plus, votre charge mentale familiale disparaît totalement. 
                  Concentrez-vous sur l'essentiel pendant que nous gérons tout le reste.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Réservation */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-amber-600">
              Réserver un service maintenant
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Choisissez votre service et planifiez votre intervention en quelques clics
            </p>
            <Button 
              size="lg" 
              onClick={() => handleOpenBooking({ name: "Service Premium Bika Plus", price: "1500€/mois", description: "Service premium avec Chef Family Officer dédié" })}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Découvrez l'excellence du service premium
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez le cercle privilégié des familles Bika Plus
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
              className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-3"
            >
              Demander une présentation
            </Button>
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