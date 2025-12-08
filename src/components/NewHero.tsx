import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Phone } from "lucide-react";

const NewHero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Responsive Hero Image - Mobile first for LCP */}
        <picture>
          <source media="(min-width: 768px)" srcSet="/hero-desktop.webp" type="image/webp" />
          <img 
            src="/hero-mobile.webp"
            alt="Bikawo - Votre assistant personnel au quotidien"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
            decoding="sync"
            width={800}
            height={600}
          />
        </picture>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Urgency Badge */}
        <div className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground px-4 py-2 rounded-full mb-6 shadow-lg">
          <span className="text-sm font-semibold">💰 Profitez de 50% d'avance immédiate sur vos impôts</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
          <span className="block text-white drop-shadow-lg">Bikawo, votre assistant</span>
          <span className="block text-white drop-shadow-lg">personnel au quotidien</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed text-white/90 drop-shadow-md px-2">
          Garde d'enfants, aide seniors, courses, ménage... <br className="hidden sm:block" />
          <strong className="text-white">
            Des prestataires vérifiés <span className="line-through opacity-70">25€/h</span> → <span className="text-accent">12,50€/h</span> après crédit d'impôt
          </strong>
        </p>

        {/* Double CTA */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Link to="/services" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold bg-white text-primary hover:bg-white/95 shadow-2xl border-2 border-white"
            >
              🛒 Réserver maintenant
            </Button>
          </Link>
          
          <Link to="/nous-recrutons" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary"
            >
              💼 Devenir prestataire
            </Button>
          </Link>
        </div>

        {/* Quick Contact */}
        <div className="mt-6">
          <a 
            href="tel:+33609085390" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">Besoin d'aide ? Appelez le 06 09 08 53 90</span>
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8">
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
    </section>
  );
};

export default NewHero;