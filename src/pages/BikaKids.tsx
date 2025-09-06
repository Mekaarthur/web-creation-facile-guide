import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import Cart from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Clock, MapPin, Calendar, Baby, Users, BookOpen, Heart } from "lucide-react";
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
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary/5 via-secondary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {serviceData.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Des services de garde d'enfants professionnels et personnalisés pour accompagner votre famille au quotidien.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Baby className="w-4 h-4 mr-2" />
                Garde professionnelle
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                Personnel qualifié
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Sécurité garantie
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
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