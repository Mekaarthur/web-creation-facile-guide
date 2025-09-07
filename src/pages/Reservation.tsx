import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ServicesGrid from "@/components/ServicesGrid";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import Cart from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Sparkles, Clock, Shield, Users } from "lucide-react";
import { useCart } from "@/components/Cart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SEOComponent from "@/components/SEOComponent";
const Reservation = () => {
  const [showCart, setShowCart] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleReservation = () => {
    if (!user) {
      navigate('/auth');
    } else {
      setShowCart(true);
    }
  };

  const trustIndicators = [
    { icon: Shield, text: "Prestataires vérifiés", value: "100%" },
    { icon: Users, text: "Clients satisfaits", value: "15k+" },
    { icon: Clock, text: "Disponible", value: "24h/7j" },
  ];

  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Réserver vos services BIKAWO - Solutions personnalisées"
        description="Découvrez et réservez tous nos services BIKAWO : aide à domicile, garde d'enfants, assistance seniors, conciergerie et plus. Prestataires vérifiés, disponibles 24h/7j."
        keywords="réservation services BIKAWO, aide domicile, garde enfants, assistance seniors, conciergerie, prestataires vérifiés"
      />
      <Navbar />
      
      <div className="pt-20 bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background avec effet vidéo */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
            <div className="absolute inset-0 bg-gradient-pattern opacity-30 animate-pulse"></div>
          </div>

          {/* Éléments flottants animés */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/10 animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-secondary/10 animate-[float_8s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute bottom-32 left-1/4 w-12 h-12 rounded-full bg-accent/10 animate-[float_7s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-40 right-1/3 w-14 h-14 rounded-full bg-primary/5 animate-[float_9s_ease-in-out_infinite_reverse]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className={`space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Titre principal avec effet gradient */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-x">
                    Réservez vos services
                  </span>
                  <span className="block mt-2 bg-gradient-hero bg-clip-text text-transparent">
                    BIKAWO
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Des solutions personnalisées pour vous accompagner au quotidien
                </p>
              </div>

              {/* Indicateurs de confiance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {trustIndicators.map((indicator, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-center gap-3 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 transition-all duration-700 hover:scale-105 hover:shadow-lg ${
                      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <indicator.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-primary">{indicator.value}</div>
                      <div className="text-sm text-muted-foreground">{indicator.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call-to-Action avec effet hover */}
              <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '600ms' }}>
                <Button 
                  size="lg" 
                  className="group px-8 py-4 text-lg font-semibold relative overflow-hidden transition-all duration-300 hover:scale-105"
                  onClick={handleReservation}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Sparkles className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12" />
                  Commencer maintenant
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ServicesGrid />
        </div>
      </div>
      
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleReservation}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          variant="hero"
        >
          <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
          {getCartItemsCount() > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
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

export default Reservation;