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

const BikaPro = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsBookingFormOpen(true);
  };

  const services = [
    // Support administratif (50€/h)
    { name: "Gestion agenda dirigeants", price: 50, description: "Gestion agenda dirigeants, coordination déplacements" },
    { name: "Réservations et logistique", price: 50, description: "Réservations & logistique, interface partenaires externes" },
    
    // Conciergerie entreprise (50€/h)
    { name: "Services personnels employés", price: 50, description: "Services personnels employés, pressing, courses" },
    { name: "Réservations restos affaires", price: 50, description: "Réservations restos affaires, organisation cadeaux clients" },
    { name: "Gestion urgences salariés", price: 50, description: "Gestion des urgences personnelles salariés" }
  ];

  const structuredData = {
    "@context": "https://schema.org", "@type": "Service", "name": "Bika Pro - Services aux entreprises",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": services.map(service => ({ "@type": "Offer", "name": service.name, "description": service.description, "price": service.price, "priceCurrency": "EUR" }))
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
        {user ? (
          <>
            <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
              <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="text-sm text-blue-600 font-medium">⭐ Services BIKA #1 en France</div>
                    <div className="text-lg text-pink-500 italic">"La charge mentale en moins, la sérénité en plus"</div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                      Bika Pro<br /><span className="text-slate-600">Services aux Entreprises</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Solutions B2B expertes avec les mêmes consultants de confiance. 
                      Support administratif + executive + événementiel. 
                      Optimisez vos équipes et offrez des avantages sociaux innovants.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-3 h-3 text-slate-600" />
                        </div>
                        <span className="text-sm text-gray-600">Excellence B2B</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Performance optimisée</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm text-gray-600">Avantage social</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">Services déductibles</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button size="lg" onClick={() => navigate('/custom-request')}
                        className="bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white px-8 py-3">
                        Démarrer maintenant →
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => navigate('/custom-request')}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 px-8 py-3">
                        Envoyer une demande personnalisée
                      </Button>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          <div className="w-6 h-6 bg-slate-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600">Entreprises partenaires</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                      <img src="/src/assets/service-business-full.jpg" alt="Service entreprise Bika Pro" className="w-full h-auto" />
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">🟢 En ligne</div>
                      <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-600">4.9</div>
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
                        className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Pro</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {services.map((service, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
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
          </>
        ) : (
          <div className="py-20">
            <ClientSpace />
          </div>
        )}
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