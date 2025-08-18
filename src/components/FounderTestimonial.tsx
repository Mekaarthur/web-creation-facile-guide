import { Quote, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useAnimations";

const FounderTestimonial = () => {
  const { setRef, isInView } = useScrollAnimation();

  return (
    <section ref={setRef} className="py-20 bg-gradient-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Encadré spécial */}
          <div className="bg-white rounded-3xl shadow-glow p-8 md:p-12 border-2 border-primary/10">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center space-x-3 bg-accent/10 text-accent px-6 py-3 rounded-full">
                <Heart className="w-5 h-5" />
                <span className="font-semibold">Créé par une maman qui comprend</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Photo de la fondatrice */}
              <div className="md:col-span-1 text-center">
                <div className="relative inline-block">
                  <img
                    src="/lovable-uploads/7289c795-0ba4-4e3f-86dc-cd0e3310a306.png"
                    alt="Sarah, fondatrice de Bikawo"
                    className="w-32 h-32 rounded-full object-cover shadow-elegant border-4 border-white"
                  />
                  <div className="absolute -top-2 -right-2 bg-accent text-white p-2 rounded-full">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Témoignage */}
              <div className="md:col-span-2 space-y-6">
                <Quote className="w-12 h-12 text-accent mx-auto md:mx-0" />
                
                <blockquote className="text-lg md:text-xl text-foreground italic leading-relaxed">
                  "Après avoir jonglé entre ma carrière et mes trois enfants, j'ai compris que 
                  la charge mentale n'était pas une fatalité. J'ai créé Bikawo pour offrir à 
                  toutes les familles ce dont elles rêvent : du temps de qualité et la sérénité."
                </blockquote>
                
                <div className="border-t border-border pt-4">
                  <p className="font-bold text-lg text-foreground">Sarah Martinez</p>
                  <p className="text-accent font-medium">Fondatrice & Maman de 3 enfants</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ancienne consultante, aujourd'hui entrepreneuse passionnée
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2018</div>
                <div className="text-sm text-muted-foreground">Année de création</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2500+</div>
                <div className="text-sm text-muted-foreground">Familles accompagnées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9</div>
                <div className="text-sm text-muted-foreground">Note moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderTestimonial;