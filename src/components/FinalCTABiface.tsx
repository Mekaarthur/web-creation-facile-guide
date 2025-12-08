import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Clock, Star, ArrowRight } from "lucide-react";
import communityBg from "@/assets/community-cta-background.jpg";
import { useTranslation } from 'react-i18next';

const FinalCTABiface = () => {
  const { t } = useTranslation();
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${communityBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
        <div className="max-w-4xl mx-auto">
          {/* Guarantee badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Prestataires vérifiés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Réponse sous 24h</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Satisfait ou remboursé</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in">
            Prêt à retrouver du temps pour vous ?
          </h2>
          
          <p className="text-xl md:text-2xl mb-4 opacity-90 animate-fade-in">
            Rejoignez les 2500+ familles qui nous font confiance
          </p>
          
          <p className="text-lg mb-8 opacity-80 animate-fade-in">
            💰 <strong>50% d'avance immédiate</strong> sur vos impôts
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in">
            <Link to="/services">
              <Button 
                size="lg" 
                className="group w-full sm:w-auto px-10 py-5 text-lg font-bold bg-white text-primary hover:bg-white/95 shadow-2xl"
              >
                Réserver ma première prestation
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Secondary CTA */}
          <p className="text-sm opacity-70 animate-fade-in">
            Vous êtes professionnel ? <Link to="/nous-recrutons" className="underline hover:no-underline font-medium">Rejoignez notre équipe →</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTABiface;