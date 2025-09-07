import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-bikawo-community.jpg";

const NewHero = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Primary Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-105 hover:scale-110"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent animate-pulse opacity-80" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-accent/30 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        </div>
      </div>

      {/* Content with Staggered Animations */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent leading-tight">
            Bikawo, votre assistant 
            <span className="block text-primary animate-pulse">personnel au quotidien</span>
          </h1>
        </div>
        
        <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-95 leading-relaxed">
            Nous vous libérons de la <span className="text-primary font-semibold">charge mentale</span> pour que vous profitiez de ce qui compte vraiment.
          </p>
        </div>

        {/* Enhanced Double CTA */}
        <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <Link to="/services">
            <Button 
              size="lg" 
              className="group w-full sm:w-auto px-10 py-5 text-lg font-semibold bg-primary hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-primary/50"
            >
              <span className="mr-2 group-hover:animate-bounce">🛒</span>
              Réserver dès maintenant
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
            </Button>
          </Link>
          
          <Link to="/nous-recrutons">
            <Button 
              variant="outline" 
              size="lg" 
              className="group w-full sm:w-auto px-10 py-5 text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-white/30"
            >
              <span className="mr-2 group-hover:animate-bounce">💼</span>
              Devenir prestataire
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
              <span>4,9/5 - 2500+ avis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Service 7j/7</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
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