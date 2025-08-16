import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import ServiceBookingForm from "@/components/ServiceBookingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Plane, CheckCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const BikaTravel = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    {
      name: "Aide pré-voyage",
      price: "25€/h",
      description: "Vérification documents, check-in en ligne, préparation valises optimale"
    },
    {
      name: "Transfert aéroport",
      price: "32€/h",
      description: "Transfert sécurisé domicile-aéroport avec service Fast-Track"
    },
    {
      name: "Veille de vols",
      price: "35€/h",
      description: "Surveillance de vos vols, rebooking automatique en cas d'imprévu"
    },
    {
      name: "Travel-Kids",
      price: "30€/h",
      description: "Service spécialisé familles : kit enfant, poussette voyage, divertissements"
    },
    {
      name: "Préparation retour",
      price: "27€/h",
      description: "Courses de première nécessité avant votre retour de voyage"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Travel - Services aux voyageurs",
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
      "price": service.price.replace("€/h", ""),
      "priceCurrency": "EUR"
    }))
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Bika Travel - Services aux voyageurs Île-de-France | Bikawo</title>
        <meta 
          name="description" 
          content="Services aux voyageurs en Île-de-France. Aide pré-voyage, transferts aéroport, veille de vols, Travel-Kids. Voyagez sereinement. Crédit d'impôt 50%." 
        />
        <meta 
          name="keywords" 
          content="aide voyage ile de france, transfert aeroport paris, veille vol, travel kids, services voyageurs, concierge voyage" 
        />
        <link rel="canonical" href="https://bikawo.fr/bika-travel-ile-de-france" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Navbar />
      <ServiceBreadcrumb serviceName="Bika Travel - Services aux Voyageurs" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-sky-50 to-blue-50 py-20">
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
                  Bika Travel
                  <br />
                  <span className="text-sky-600">Services aux Voyageurs</span>
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-blue-100 text-blue-800">✈️ Innovation voyage</Badge>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Conciergerie voyage unique avec le même expert de confiance. 
                  Préparation + transferts + veille de vols + Travel-Kids. 
                  Voyages sans stress garantis.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                      <Plane className="w-3 h-3 text-sky-600" />
                    </div>
                    <span className="text-sm text-gray-600">Expert voyage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Suivi temps réel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm text-gray-600">CDG & Orly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Rebooking auto</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    Démarrer maintenant →
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-sky-200 text-sky-600 hover:bg-sky-50 px-8 py-3"
                  >
                    Envoyer une demande personnalisée
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-sky-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                  </div>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-travel-full.jpg" 
                    alt="Service voyage Bika Travel" 
                    className="w-full h-auto"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🟢 En ligne
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-600">4.9</div>
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
                  <Button size="sm" variant="outline" className="bg-white border-sky-200 text-sky-600 hover:bg-sky-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-sky-200 text-sky-600 hover:bg-sky-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-sky-200 text-sky-600 hover:bg-sky-50">
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Commencez dès maintenant</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-sky-50 to-sky-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Préparation voyage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Check-in, documents, valises - nous préparons tout pour votre départ
                  </CardDescription>
                  <Button 
                    onClick={() => navigate('/custom-request')}
                    className="bg-sky-600 hover:bg-sky-700 text-white w-full"
                  >
                    Préparer mon voyage
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Transfert aéroport</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Service premium domicile-aéroport avec accès Fast-Track
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full"
                  >
                    Réserver un transfert
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
                <CardHeader>
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Travel-Kids</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6">
                    Service spécialisé familles avec kits enfants et accompagnement
                  </CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/custom-request')}
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 w-full"
                  >
                    Voyager en famille
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
              <p className="text-sky-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des experts voyage à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-travel.jpg" 
                    alt="Aide pré-voyage" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Préparation experte</h3>
                <p className="text-gray-600">
                  Nos experts voyage anticipent tous vos besoins pour un départ serein
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/assets/recruitment-hero.jpg" 
                    alt="Transferts aéroport" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expertise aéroportuaire</h3>
                <p className="text-gray-600">
                  Nos agents connaissent parfaitement CDG et Orly pour vos transferts
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/assets/diverse-family.jpg" 
                    alt="Travel-Kids families" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Travel-Kids</h3>
                <p className="text-gray-600">
                  Service spécialisé pour voyager sereinement en famille avec enfants
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Travel</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-sky-600 border-sky-200 font-semibold">
                        {service.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4">
                      {service.description}
                    </CardDescription>
                    <Button 
                      onClick={() => handleOpenBooking(service)}
                      className="bg-sky-600 hover:bg-sky-700 text-white w-full"
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
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <Badge className="bg-blue-500 text-white px-4 py-2 text-lg">
                  🚀 Innovation Bikawo
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Le seul service de conciergerie voyage personnalisé en Île-de-France
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Suivi en temps réel de vos vols, alertes automatiques, rebooking immédiat en cas de perturbations. 
                Application mobile dédiée pour un suivi constant.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2 text-blue-700">Technologie avancée</h3>
                  <p className="text-sm text-gray-600">
                    Surveillance automatique, rebooking immédiat, application mobile dédiée
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-2 text-indigo-700">Expertise unique</h3>
                  <p className="text-sm text-gray-600">
                    Seul service de conciergerie voyage personnalisé avec agents experts CDG/Orly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Réservation */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-sky-600">
              Réserver un service maintenant
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Choisissez votre service et planifiez votre intervention en quelques clics
            </p>
            <Button 
              size="lg" 
              onClick={() => handleOpenBooking(services[0])}
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-sky-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Transformez vos voyages en expériences sereines
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Laissez-nous nous occuper de tout pendant que vous profitez de vos vacances
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/custom-request')}
              className="bg-white text-sky-600 hover:bg-gray-100 px-8 py-3"
            >
              Obtenir mon devis gratuit
            </Button>
          </div>
        </section>

      <RelatedServices currentService="travel" />
      </main>

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <ServiceBookingForm
          service={selectedService}
          packageTitle="Bika Travel"
          onClose={() => setIsBookingFormOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaTravel;