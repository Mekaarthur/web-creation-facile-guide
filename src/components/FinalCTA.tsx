import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useAnimations";

const FinalCTA = () => {
  const { setRef, isInView } = useScrollAnimation();

  return (
    <section ref={setRef} className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className={`space-y-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Slogan principal */}
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-3 bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Votre nouvelle vie commence maintenant</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              La charge mentale
              <br />
              <span className="text-white/90">en moins,</span>
              <br />
              la sérénité
              <br />
              <span className="text-white/90">en plus</span>
            </h2>
          </div>

          {/* Description rapide */}
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Rejoignez des milliers de familles qui ont choisi de reprendre le contrôle de leur quotidien
          </p>

          {/* Bouton d'action principal */}
          <div className="pt-4">
            <Link to="/services">
              <Button 
                size="xl" 
                className="group bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-glow text-lg px-12 py-6 touch-target"
              >
                Découvrir nos services
                <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
          </div>

          {/* Garantie */}
          <div className="pt-8">
            <p className="text-white/60 text-sm">
              ✓ Sans engagement • ✓ Satisfaction garantie • ✓ Support 7j/7
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;