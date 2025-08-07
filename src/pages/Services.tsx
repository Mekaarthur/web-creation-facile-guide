import { useState } from "react";
import Navbar from "@/components/Navbar";
import ServicesPackages from "@/components/ServicesPackages";
import ServicesBooking from "@/components/ServicesBooking";
import HourlyBooking from "@/components/HourlyBooking";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import Cart from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/Cart";

const ServicesPage = () => {
  const [showCart, setShowCart] = useState(false);
  const { getCartItemsCount } = useCart();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 bg-background">
        {/* Header de la section */}
        <div className="text-center space-y-4 py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Nos Services
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                BIKAWO
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos solutions personnalisées pour vous accompagner au quotidien
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Tabs defaultValue="packages" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50 p-1">
              <TabsTrigger 
                value="packages" 
                className="text-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                📦 Nos packages
              </TabsTrigger>
              <TabsTrigger 
                value="hourly" 
                className="text-lg font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                ⏰ Réservation par heures
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="packages" className="space-y-8 mt-8">
              <ServicesPackages />
              <ServicesBooking />
            </TabsContent>
            
            <TabsContent value="hourly" className="mt-8">
              <HourlyBooking />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowCart(!showCart)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          variant="hero"
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

export default ServicesPage;