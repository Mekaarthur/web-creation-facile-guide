import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CallToActionButtons from "@/components/CallToActionButtons";
import ClientSpace from "@/components/ClientSpace";
import serviceKidsHomework from "@/assets/service-kids-homework.jpg";
import serviceKidsOutings from "@/assets/service-kids-outings.jpg";
import ServiceSubgrid from "@/components/ServiceSubgrid";

const BikaKids = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    // a) Garde d'enfants & Baby-sitting (25€/h)
    {
      name: "Garde ponctuelle",
      price: 25,
      description: "Garde ponctuelle, garde régulière (après-école, vacances scolaires)"
    },
    {
      name: "Garde partagée",
      price: 25,
      description: "Garde partagée entre familles, récupération quotidienne à la sortie d'école"
    },
    {
      name: "Transport et sorties",
      price: 25,
      description: "Transport vers activités extrascolaires, accompagnement aux activités sportives, sorties culturelles"
    },
    {
      name: "Aide aux devoirs",
      price: 25,
      description: "Aide aux devoirs personnalisée"
    },
    
    // b) Gardes de nuit ou d'urgence (30€/h)
    {
      name: "Gardes de nuit",
      price: 30,
      description: "Nuit complète / gardes urgentes (soirée, weekend)"
    },
    {
      name: "Accompagnement enfants malades",
      price: 30,
      description: "Accompagnement enfants malades, accompagnement aux rendez-vous médicaux"
    },
    
    // c) Anniversaires & Événements (30€/h)
    {
      name: "Animation anniversaires",
      price: 30,
      description: "Animation et jeux pour enfants, décoration thématique personnalisée"
    },
    {
      name: "Organisation événements",
      price: 30,
      description: "Gestion des invitations et logistique, photographe et souvenirs"
    },
    
    // d) Soutien scolaire (30€/h)
    {
      name: "Cours particuliers",
      price: 30,
      description: "Cours particuliers à domicile, préparation aux examens"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Kids - Services enfance et parentalité",
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
        <title>Bika Kids - Services enfance et parentalité Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Garde d'enfants professionnelle en Île-de-France. Services de garde ponctuelle, nuit, urgence et accompagnement scolaire. Crédit d'impôt 50%. Devis gratuit 24h." 
        />
        <meta 
          name="keywords" 
          content="garde enfants ile de france, baby sitter paris, garde nuit enfants, accompagnement scolaire, sortie educative enfant, creche ponctuelle" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-kids-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Kids - Enfants & Parentalité" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
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
                  Bika Kids
                  <br />
                  <span className="text-blue-600">Enfants & Parentalité</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Garde d'enfants professionnelle avec le même prestataire de confiance. 
                  Garde ponctuelle + aide aux devoirs + accompagnement scolaire. 
                  Réactivité et bienveillance garanties.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-sm text-gray-600">Même prestataire</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Réactivité 24h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Services combinés</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Flexibilité totale</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                  >
                    Démarrer maintenant →
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-3"
                  >
                    Envoyer une demande personnalisée
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                  </div>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-kids-full.jpg" 
                    alt="Service garde d'enfants Bika Kids" 
                    className="w-full h-auto"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🟢 En ligne
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">4.9</div>
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
                    className="bg-white border-pink-200 text-pink-600 hover:bg-pink-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <ServiceSubgrid categoryKey="kids" />

        {/* Quick Actions Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Commencez dès maintenant</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Réserver un service</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Accédez à nos services de garde d'enfants et réservez votre prestation en quelques clics
                  </CardDescription>
                  <Button 
                    onClick={() => navigate('/custom-request')}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  >
                    Réserver maintenant
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Demande personnalisée</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Décrivez vos besoins spécifiques et recevez une proposition sur mesure
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 w-full"
                  >
                    Demande personnalisée
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-pink-50 to-pink-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Urgence 24h</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Besoin d'une garde d'urgence ? Nous intervenons rapidement
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/contact')}
                    className="border-pink-200 text-pink-600 hover:bg-pink-50 w-full"
                  >
                    Contact urgence
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
              <p className="text-blue-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des professionnels à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-kids.jpg" 
                    alt="Garde d'enfants professionnelle" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Garde d'enfants</h3>
                <p className="text-gray-600">
                  Nos prestataires expérimentés prennent soin de vos enfants avec attention et bienveillance
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceKidsHomework} 
                    alt="Aide aux devoirs" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aide aux devoirs</h3>
                <p className="text-gray-600">
                  Accompagnement scolaire personnalisé pour la réussite de vos enfants
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src={serviceKidsOutings} 
                    alt="Sorties éducatives" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sorties éducatives</h3>
                <p className="text-gray-600">
                  Activités culturelles et ludiques pour l'épanouissement de vos enfants
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Kids</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
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

        {/* Innovation Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-medium mb-2">Innovation technologique</p>
              <h2 className="text-3xl font-bold text-gray-900">Technologies de nouvelle génération</h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Sélection rigoureuse</h3>
                  <p className="text-gray-600">
                    Nos intervenants Bika Kids sont sélectionnés pour leur expérience auprès des enfants et leur capacité 
                    à créer un environnement rassurant et éducatif.
                  </p>
                </div>
                <div>
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Disponibilité maximale</h3>
                  <p className="text-gray-600">
                    Services 7j/7 dans toute l'Île-de-France avec possibilité d'intervention en urgence. 
                    Réactivité garantie 24h.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credit d'impot Section */}
        <section className="py-16 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-green-800">Crédit d'impôt 50%</h2>
              <p className="text-lg text-green-700 mb-8">
                Tous nos services Bika Kids sont éligibles au crédit d'impôt, divisant par deux le coût réel 
                de vos prestations de garde d'enfants.
              </p>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-green-600 font-medium">
                  Exemple : Une garde de 4h à 22€/h = 88€ → Coût réel après crédit d'impôt : 44€
                </p>
              </div>
            </div>
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
              onClick={() => handleOpenBooking(services[0])}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à faire confiance à Bika Kids ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Demandez votre devis personnalisé en moins de 24h
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
            >
              Obtenir mon devis gratuit
            </Button>
          </div>
        </section>

      <RelatedServices currentService="kids" />
      </main>

      <ClientSpace />

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <BikaServiceBooking
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          service={{ name: selectedService.name, description: selectedService.description, price: selectedService.price, category: "kids" }}
          packageTitle="Bika Kids"
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaKids;