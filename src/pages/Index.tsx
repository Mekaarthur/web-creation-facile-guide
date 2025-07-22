import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ReferralProgram from "@/components/ReferralProgram";
import InnovativeFeatures from "@/components/InnovativeFeatures";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, UserPlus } from "lucide-react";

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

      <InnovativeFeatures />
      <About />
      <ReferralProgram />
      <Testimonials />
      <FAQ />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
