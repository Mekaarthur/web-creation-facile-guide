import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import InnovativeFeatures from "@/components/InnovativeFeatures";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, UserPlus, Heart, Users, Home } from "lucide-react";
import activityChildcare from "@/assets/activity-childcare.jpg";
import activityHomeHelp from "@/assets/activity-home-help.jpg";
import activitySeniorHelp from "@/assets/activity-senior-help.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      
      {/* Section d'actions rapides */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Commencez dès maintenant
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-elegant border border-border">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Réserver un service</h3>
              <p className="text-muted-foreground mb-6">
                Accédez à nos services et réservez votre prestation en quelques clics
              </p>
              <Link to="/espace-personnel">
                <Button variant="default" size="lg" className="w-full">
                  Réserver maintenant
                </Button>
              </Link>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-elegant border border-border">
              <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Postuler</h3>
              <p className="text-muted-foreground mb-6">
                Rejoignez notre équipe de prestataires qualifiés
              </p>
              <Link to="/nous-recrutons">
                <Button variant="outline" size="lg" className="w-full">
                  Postuler maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section d'activités avec images */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Heart className="w-4 h-4" />
              <span>Nos services en action</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Des professionnels à votre service
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl">
                <img 
                  src={activityChildcare} 
                  alt="Garde d'enfants professionnelle" 
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Users className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Garde d'enfants</h3>
                </div>
              </div>
            </div>
            
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl">
                <img 
                  src={activityHomeHelp} 
                  alt="Aide à domicile professionnelle" 
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Home className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Assistance domicile</h3>
                </div>
              </div>
            </div>
            
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl">
                <img 
                  src={activitySeniorHelp} 
                  alt="Aide aux seniors" 
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Aide aux seniors</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <InnovativeFeatures />
      <Testimonials />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
