import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Community Icon */}
          <div className="mb-6">
            <Users className="h-16 w-16 mx-auto text-white/90" />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in">
            Rejoignez la communauté Bikawo dès aujourd'hui !
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in">
            Que vous ayez besoin d'accompagnement ou souhaitez valoriser vos compétences, 
            Bikawo est fait pour vous !
          </p>

          {/* Double CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in">
            <Link to="/espace-personnel">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-white text-primary hover:bg-white/90"
              >
                {t('finalCta.client')}
              </Button>
            </Link>
            
            <Link to="/nous-recrutons">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-transparent border-white text-white hover:bg-white hover:text-primary"
              >
                {t('finalCta.provider')}
              </Button>
            </Link>
          </div>

          {/* Credibility Element */}
          <div className="text-lg opacity-80 animate-fade-in">
            <p>{t('finalCta.members')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTABiface;