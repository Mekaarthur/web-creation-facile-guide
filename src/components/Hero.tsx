import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Users, Clock, Shield, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-assisted-family.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden pt-20 lg:pt-0">
      {/* Background decorative elements - hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden hidden lg:block">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-primary/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8 animate-fade-in-up text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
               <span>Services BIKA #1 en France</span>
            </div>

            {/* Heading */}
            <div className="space-y-3 lg:space-y-4">
              <div className="text-lg md:text-xl lg:text-2xl font-medium text-accent mb-2">
                "La charge mentale en moins, la sérénité en plus"
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Votre assistant personnel
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  au quotidien
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Services combinés avec le même prestataire de confiance. 
                Ménage + garde d'enfants + aide administrative. Réactivité et flexibilité garanties.
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 text-sm">
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Users className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-muted-foreground">Même prestataire</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Clock className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-muted-foreground">Réactivité 24h</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-muted-foreground">Services combinés</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Star className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-muted-foreground">Flexibilité totale</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
              <Link to="/services" className="w-full sm:w-auto">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group w-full sm:w-auto touch-target"
                >
                  Démarrer maintenant
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              
              <Link to="/demande-personnalisee" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group w-full sm:w-auto touch-target border-white/20 text-white hover:bg-white/10"
                >
                  Demande personnalisée
                  <MessageSquare className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Button 
                variant="glass" 
                size="lg" 
                className="group w-full sm:w-auto touch-target hidden sm:flex"
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                Voir la démo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center lg:justify-start space-x-4 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-white"></div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,500+</span> personnes nous font confiance
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative animate-fade-in order-first lg:order-last" style={{animationDelay: '0.3s'}}>
            <div className="relative max-w-md mx-auto lg:max-w-none">
              <img
                src="/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png"
                alt="Famille organisée avec expert familial"
                className="w-full h-auto rounded-2xl shadow-glow"
                loading="eager"
              />
              
              {/* Floating cards - simplified on mobile */}
              <div className="absolute -top-4 -left-4 lg:-top-6 lg:-left-6 bg-white p-3 lg:p-4 rounded-lg shadow-soft animate-float hidden sm:block">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-sm font-medium">En ligne</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 bg-white p-3 lg:p-4 rounded-lg shadow-soft animate-float hidden sm:block" style={{animationDelay: '0.5s'}}>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-primary">4.9</div>
                  <div className="flex justify-center">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">Note moyenne</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;