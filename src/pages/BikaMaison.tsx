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
import serviceMaison from "@/assets/service-maison.jpg";
import { servicesData } from "@/utils/servicesData";
import ServiceSubgrid from "@/components/ServiceSubgrid";

const BikaMaison = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const serviceData = servicesData.maison;

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

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
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Logistique à domicile
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,9/5 - 2 500+ avis vérifiés</span>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mb-2">
                    Dès 25€/h, soit 12,50€/h avec le crédit d'impôt
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Logisticiens experts et sélectionnés</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Simple, accessible, flexible</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Paris & Île-de-France (91, 92, 93, 94, 95, 78)</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Réserver mon service
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                  >
                    Devenir logisticien Bikawo
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-maison-full.jpg" 
                    alt="Service logistique Bika Home" 
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
              <Card className="text-center border-0 bg-gradient-to-br from-orange-50 to-red-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est efficace</h3>
                <p className="text-gray-600">
                  Oubliez les agences traditionnelles et l'emploi direct. Nos logisticiens sont formés et sélectionnés.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est flexible</h3>
                <p className="text-gray-600">
                  Un imprévu ? Changez, annulez, reportez vos créneaux à tout moment depuis votre espace client.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est accessible</h3>
                <p className="text-gray-600">
                  Avec l'avance immédiate de crédit d'impôt, vous payez seulement 50% du prix !
                </p>
              </Card>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="maison" />

        {/* Section Avis - Style Wecasa */}
        <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Les avis logistique</h2>
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="text-6xl font-bold text-yellow-500">4,9/5</div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-gray-600">Déjà 2 500 avis<br />collectés par eKomi</div>
                  </div>
                </div>
              </div>

              {/* Témoignages */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">5/5 • il y a 2 jours</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Logistique régulière parfaite</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    "Marie-Claude gère parfaitement mes courses hebdomadaires. Elle connaît mes habitudes et anticipe même mes besoins ! Un service indispensable."
                  </p>
                  <div className="text-xs text-gray-400">Sophie B. (Paris, 75011)</div>
                </Card>

                <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">5/5 • il y a 1 semaine</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Jardinage et maintenance au top</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    "Thomas s'occupe de mon jardin ET des petites réparations. Polyvalent, efficace et très sympa. Je recommande vivement !"
                  </p>
                  <div className="text-xs text-gray-400">Laurent M. (Boulogne, 92100)</div>
                </Card>
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
                    src={serviceMaison} 
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

        {/* Services List - SUPPRIMÉ */}

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
              onClick={() => navigate('/custom-request')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 via-blue-600 to-green-700 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-1/4 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-white rounded-full"></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <Badge className="bg-white/20 text-white px-6 py-2 text-lg mb-6 backdrop-blur-sm">
                🎯 Rejoignez notre communauté
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Rejoignez les milliers de familles 
                <br />
                <span className="text-yellow-300">satisfaites en Île-de-France</span>
              </h2>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Adoptez Bika Home, notre service le plus populaire, 
                et libérez-vous définitivement de la charge mentale du quotidien
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mb-10 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">2500+</div>
                  <div className="text-sm opacity-80">Clients actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">4.9/5</div>
                  <div className="text-sm opacity-80">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">50%</div>
                  <div className="text-sm opacity-80">Crédit d'impôt</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate('/custom-request')}
                  className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-xl"
                >
                  Obtenir mon devis gratuit
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/contact')}
                  className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg backdrop-blur-sm"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Nous contacter
                </Button>
              </div>
            </div>
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