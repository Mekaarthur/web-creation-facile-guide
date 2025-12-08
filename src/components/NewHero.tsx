import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Gift, Clock, Phone } from "lucide-react";
import heroImage from "@/assets/hero-bikawo-community.jpg";
import { useTranslation } from 'react-i18next';

const NewHero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Primary Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-105 hover:scale-110"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Floating Elements - Hidden on mobile */}
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        </div>
      </div>

      {/* Content with Staggered Animations */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Urgency Badge */}
        <div className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground px-4 py-2 rounded-full mb-6 animate-pulse shadow-lg">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-semibold">💰 Profitez de 50% d'avance immédiate sur vos impôts</span>
          </div>
        </div>

        <div className={`transition-all duration-1000 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="block text-primary drop-shadow-lg">{t('newHero.title1')}</span>
            <span className="block text-primary drop-shadow-lg">{t('newHero.title2')}</span>
          </h1>
        </div>
        
        <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed text-white/90 drop-shadow-md px-2">
            Garde d'enfants, aide seniors, courses, ménage... <br className="hidden sm:block" />
            <strong className="text-white">
              Des prestataires vérifiés <span className="line-through opacity-70">25€/h</span> → <span className="text-accent">12,50€/h</span> après crédit d'impôt
            </strong>
          </p>
        </div>

        {/* Enhanced Double CTA - High Contrast */}
        <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <Link to="/services" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="group w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold bg-white text-primary hover:bg-white/95 transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-white"
            >
              <span className="mr-2">🛒</span>
              Réserver maintenant
            </Button>
          </Link>
          
          <Link to="/nous-recrutons" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transform hover:scale-105 transition-all duration-300"
            >
              <span className="mr-2">💼</span>
              Devenir prestataire
            </Button>
          </Link>
        </div>

        {/* Quick Contact */}
        <div className={`mt-6 transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <a 
            href="tel:+33609085390" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">Besoin d'aide ? Appelez le 06 09 08 53 90</span>
          </a>
        </div>

        {/* Trust Indicators */}
        <div className={`mt-8 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-white/90 text-sm">
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
              <span className="text-warning">⭐⭐⭐⭐⭐</span>
              <span className="font-medium">4,9/5 - 2500+ avis</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4 text-success" />
              <span>Service 7j/7</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
              <span className="text-success">✓</span>
              <span>Crédit d'impôt 50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full">
          <div className="w-1 h-3 bg-white/60 rounded-full mx-auto mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default NewHero;