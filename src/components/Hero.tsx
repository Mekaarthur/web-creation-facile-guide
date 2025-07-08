import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Users, Clock, Shield } from "lucide-react";
import heroImage from "@/assets/hero-support.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-primary/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
              <span>Support #1 en France</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Assistance
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  experte
                </span>
                à votre service
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Obtenez de l'aide immédiate de nos experts. Support technique, conseils personnalisés et solutions sur mesure disponibles 24h/24.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-muted-foreground">+10k clients satisfaits</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-muted-foreground">Réponse en &lt;5min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-muted-foreground">100% sécurisé</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Démarrer maintenant
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="glass" size="xl" className="group">
                <Play className="w-5 h-5 mr-2" />
                Voir la démo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-4 pt-4">
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
          <div className="relative animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="relative">
              <img
                src={heroImage}
                alt="Équipe support Assist Me"
                className="w-full h-auto rounded-2xl shadow-glow"
              />
              
              {/* Floating cards */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-lg shadow-soft animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-sm font-medium">En ligne</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-soft animate-float" style={{animationDelay: '0.5s'}}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.9</div>
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