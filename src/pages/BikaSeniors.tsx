import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import RelatedServices from "@/components/RelatedServices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, MapPin, Calculator, Heart, Star, Calendar, MessageCircle, Phone, Users, CheckCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BikaSeniors = () => {
  const navigate = useNavigate();

  const services = [
    { name: "Aide quotidienne", price: "24€/h", description: "Assistance dans les activités quotidiennes, toilette, habillage, préparation repas" },
    { name: "Accompagnement médical", price: "27€/h", description: "Accompagnement aux rendez-vous médicaux, suivi des traitements" },
    { name: "Courses seniors", price: "26€/h", description: "Courses alimentaires et pharmaceutiques adaptées aux besoins spécifiques" },
    { name: "Compagnie", price: "24€/h", description: "Temps de compagnie, conversation, jeux, lecture, sorties de proximité" },
    { name: "Aide mobilité", price: "28€/h", description: "Aide à la mobilité, transferts sécurisés, assistance pour les repas" }
  ];

  const structuredData = {
    "@context": "https://schema.org", "@type": "Service", "name": "Bika Seniors - Aide personnes âgées",
    "provider": { "@type": "Organization", "name": "Bikawo", "url": "https://bikawo.fr" },
    "areaServed": { "@type": "Place", "name": "Île-de-France" },
    "offers": services.map(service => ({ "@type": "Offer", "name": service.name, "description": service.description, "price": service.price.replace("€/h", ""), "priceCurrency": "EUR" }))
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
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-sm text-blue-600 font-medium">⭐ Services BIKA #1 en France</div>
                <div className="text-lg text-pink-500 italic">"La charge mentale en moins, la sérénité en plus"</div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Bika Seniors<br /><span className="text-blue-600">Aide Personnes Âgées</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Accompagnement bienveillant avec la même auxiliaire de confiance. 
                  Aide quotidienne + accompagnement médical + soutien aux familles. 
                  Maintien à domicile avec dignité et professionnalisme.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Approche bienveillante</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm text-gray-600">Soutien aux familles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Home className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Maintien à domicile</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-sm text-gray-600">Auxiliaires formées</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => navigate('/custom-request')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
                    Démarrer maintenant →
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/custom-request')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-3">
                    Envoyer une demande personnalisée
                  </Button>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">2,500+ personnes nous font confiance</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/src/assets/service-seniors-full.jpg" alt="Service seniors Bika Seniors" className="w-full h-auto" />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">🟢 En ligne</div>
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
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
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
            <h2 className="text-3xl font-bold text-center mb-12">Nos services Bika Seniors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 font-semibold">{service.price}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{service.description}</CardDescription>
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
              <p className="text-blue-600 font-medium mb-2">Nos services en action</p>
              <h2 className="text-3xl font-bold text-gray-900">Des professionnels bienveillants à votre service</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-6">
                  <img 
                    src="/src/assets/service-seniors.jpg" 
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
                    src="/src/assets/service-seniors-assistance.jpg" 
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
                    src="/src/assets/service-seniors-care.jpg" 
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

        <RelatedServices currentService="seniors" />
      </main>
      <Footer />
    </div>
  );
};

export default BikaSeniors;