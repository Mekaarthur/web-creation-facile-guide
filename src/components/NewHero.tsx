import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent animate-pulse opacity-80" />
        
        {/* Floating Elements - Hidden on mobile */}
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-accent/30 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        </div>
      </div>

      {/* Content with Staggered Animations */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="block text-primary drop-shadow-lg">{t('newHero.title1')}</span>
            <span className="block text-primary drop-shadow-lg">{t('newHero.title2')}</span>
          </h1>
        </div>
        
        <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed text-primary-foreground drop-shadow-md px-2">
            {t('newHero.subtitle')}
          </p>
        </div>

        {/* Enhanced Double CTA */}
        <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <Link to="/services" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold bg-primary hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-primary/50"
            >
              <span className="mr-2 group-hover:animate-bounce">🛒</span>
              {t('newHero.ctaReserve')}
              <div className="absolute inset-0 bg-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
            </Button>
          </Link>
          
          <Link to="/nous-recrutons" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-glow"
            >
              <span className="mr-2 group-hover:animate-bounce">💼</span>
              {t('newHero.ctaProvider')}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex flex-wrap justify-center items-center gap-8 text-primary-foreground/80 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-warning">⭐⭐⭐⭐⭐</span>
              <span>{t('newHero.rating')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>{t('newHero.service')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>{t('newHero.taxCredit')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-primary-foreground/60 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/40 rounded-full">
          <div className="w-1 h-3 bg-primary-foreground/60 rounded-full mx-auto mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default NewHero;