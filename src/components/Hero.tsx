import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useAnimations";
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { setRef, isInView } = useScrollAnimation();
  const { t } = useTranslation();

  return (
    <section 
      ref={setRef}
      className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden pt-20 lg:pt-0"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float hidden lg:block"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full animate-float hidden lg:block" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-primary/5 rounded-full animate-float hidden lg:block" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className={`space-y-8 text-center lg:text-left ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {/* Main Headline - Impactante */}
            <div className="space-y-4 lg:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="text-foreground">{t('hero.title')}</span>
                <br />
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
              <Link to="/services" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  className="group w-full sm:w-auto text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 bg-gradient-hero hover:scale-105 transition-all duration-300 shadow-glow min-h-12"
                >
                  <Zap className="w-5 h-5 lg:w-6 lg:h-6 mr-2 lg:mr-3 flex-shrink-0" />
                  <span className="truncate">{t('hero.ctaPrimary')}</span>
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2 lg:ml-3 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                </Button>
              </Link>
              <Link to="/candidature-prestataire" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  variant="secondary"
                  className="group w-full sm:w-auto text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 hover:scale-105 transition-all duration-300 shadow-elegant min-h-12"
                >
                  <span className="truncate">{t('hero.ctaSecondary')}</span>
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2 lg:ml-3 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                </Button>
              </Link>
            </div>

            {/* Social Proof Rapide */}
            <div className="flex items-center justify-center lg:justify-start space-x-4 lg:space-x-6 pt-4">
              <div className="flex -space-x-2 lg:-space-x-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-primary rounded-full border-2 lg:border-3 border-white shadow-soft"></div>
                ))}
              </div>
              <div className="text-left">
                <div className="text-xl lg:text-2xl font-bold text-foreground">{t('hero.statsNumber')}</div>
                <div className="text-xs lg:text-sm text-muted-foreground">{t('hero.statsLabel')}</div>
              </div>
            </div>
          </div>

          {/* Right Content - Image/Video */}
          <div className={`relative ${isInView ? 'animate-fade-in' : 'opacity-0'}`} style={{animationDelay: '0.3s'}}>
            <div className="relative max-w-lg mx-auto">
              <img
                src="/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png"
                alt="Famille sereine grâce à Bikawo"
                className="w-full h-auto rounded-2xl shadow-glow"
                loading="eager"
              />
              
              {/* Badge flottant - En ligne */}
              <div className="absolute -top-4 -left-4 bg-white p-4 rounded-xl shadow-elegant animate-float">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-accent rounded-full animate-pulse-soft"></div>
                  <span className="font-semibold text-foreground">{t('hero.badge')}</span>
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