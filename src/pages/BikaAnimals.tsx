import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import ServiceBookingForm from "@/components/ServiceBookingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, PawPrint, CheckCircle, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const BikaAnimals = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    { name: "Promenade animaux", price: "20€/h", description: "Balades matinales et du soir adaptées aux besoins de votre animal" },
    { name: "Visite vétérinaire", price: "25€/h", description: "Accompagnement chez le vétérinaire, gestion des rendez-vous santé" },
    { name: "Courses animaux", price: "22€/h", description: "Achat nourriture, accessoires, produits d'hygiène spécialisés" },
    { name: "Garde d'animaux", price: "24€/h", description: "Garde ponctuelle à domicile respectant les habitudes de l'animal" },
    { name: "Toilettage", price: "30€/h", description: "Toilettage et soins de base, brossage, nettoyage oreilles et yeux" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bika Animals - Services pour animaux",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": services.map(service => ({
      "@type": "Offer", "name": service.name, "description": service.description,
      "price": service.price.replace("€/h", ""), "priceCurrency": "EUR"
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
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-sm text-blue-600 font-medium">⭐ Services BIKA #1 en France</div>
                <div className="text-lg text-pink-500 italic">"La charge mentale en moins, la sérénité en plus"</div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Bika Animals<br /><span className="text-green-600">Services pour Animaux</span>
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-green-100 text-green-800"><Heart className="w-4 h-4 mr-2" />Amoureux des animaux</Badge>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Pet-sitting professionnel avec le même expert animalier de confiance. 
                  Promenades + vétérinaire + toilettage + garde à domicile. 
                  Vos compagnons chouchoutés comme ils le méritent.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <PawPrint className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Expert animalier</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Camera className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Photos & nouvelles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-600">Tous animaux</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-teal-600" />
                    </div>
                    <span className="text-sm text-gray-600">Service 7j/7</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3">
                    Démarrer maintenant →
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/custom-request')}
                    className="border-green-200 text-green-600 hover:bg-green-50 px-8 py-3">
                    Envoyer une demande personnalisée
                  </Button>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-emerald-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-teal-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/src/assets/service-animals-full.jpg" alt="Service animaux Bika Animals" className="w-full h-auto" />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">🟢 En ligne</div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4.9</div>
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
                  <Button size="sm" variant="outline" className="bg-white border-green-200 text-green-600 hover:bg-green-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-green-200 text-green-600 hover:bg-green-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-green-200 text-green-600 hover:bg-green-50">
                    <Calculator className="w-4 h-4 mr-2" />
                    Devis
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Animals</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-200 font-semibold">{service.price}</Badge>
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
                    src="/src/assets/service-animals.jpg" 
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
                    src="/src/assets/service-pet-care.jpg" 
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
                    src="/src/assets/service-seniors-care.jpg" 
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
              onClick={() => handleOpenBooking(services[0])}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </Button>
          </div>
        </section>

        <RelatedServices currentService="animals" />
      </main>

      {/* Formulaire de réservation */}
      {isBookingFormOpen && selectedService && (
        <ServiceBookingForm
          service={selectedService}
          packageTitle="Bika Animals"
          onClose={() => setIsBookingFormOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default BikaAnimals;