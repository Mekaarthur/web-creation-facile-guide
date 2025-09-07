import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import Cart from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Clock, MapPin, Calendar, Baby, Users, BookOpen, Heart, CheckCircle, Shield } from "lucide-react";
import { useCart } from "@/components/Cart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { servicesData } from "@/utils/servicesData";

const BikaKids = () => {
  const [showCart, setShowCart] = useState(false);
  const { addToCart, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const serviceData = servicesData.kids;

  const handleReservation = (subService: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    addToCart({
      serviceName: subService.title,
      packageTitle: serviceData.packageTitle,
      price: subService.price,
    });
    setShowCart(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section - Style Wecasa */}
        <section className="relative bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                    Garde d'enfants à domicile
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-white/90 font-medium">4,9/5 - 1 800+ avis vérifiés</span>
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
                    <span className="text-lg">Garde d'enfants experts et sélectionnés</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-lg">Sécurisé, bienveillant, éducatif</span>
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
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 shadow-lg text-lg font-semibold"
                  >
                    Réserver ma garde
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                  >
                    Devenir garde d'enfants
                  </Button>
                </div>
              </div>

              {/* Right: Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/service-kids-full.jpg" 
                    alt="Service garde d'enfants Bika Kids" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi nous choisir */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous allez nous aimer</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center border-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est sécurisé</h3>
                <p className="text-gray-600">
                  Gardes d'enfants vérifiés, expérimentés et bienveillants. Sécurité et bien-être garantis.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-purple-50 to-pink-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est bienveillant</h3>
                <p className="text-gray-600">
                  Approche éducative personnalisée selon l'âge et les besoins de vos enfants.
                </p>
              </Card>

              <Card className="text-center border-0 bg-gradient-to-br from-green-50 to-emerald-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">On est flexible</h3>
                <p className="text-gray-600">
                  Garde ponctuelle, régulière, d'urgence. Adaptez selon vos besoins familiaux.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Grid - Remplace l'ancien système */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {serviceData.subservices.map((subService) => (
                <Card key={subService.slug} className="group hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30">
                  <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                    <img 
                      src={subService.image}
                      alt={subService.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {subService.title}
                      </CardTitle>
                      <Badge variant="outline" className="font-bold text-primary">
                        {subService.priceDisplay}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {subService.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {subService.options && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Inclus :</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {subService.options.slice(0, 3).map((option, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {option}
                            </li>
                          ))}
                          {subService.options.length > 3 && (
                            <li className="text-primary text-xs">+ {subService.options.length - 3} autres services</li>
                          )}
                        </ul>
                      </div>
                    )}
                    <Button 
                      onClick={() => handleReservation(subService)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Réserver maintenant
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowCart(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          variant="default"
        >
          <ShoppingCart className="w-5 h-5" />
          {getCartItemsCount() > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {getCartItemsCount()}
            </span>
          )}
        </Button>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
          <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
        </div>
      )}
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaKids;