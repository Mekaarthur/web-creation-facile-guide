import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bikawo-community.jpg";

const NewHero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
          Bikawo, votre assistant personnel au quotidien
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 animate-fade-in">
          Nous vous libérons de la charge mentale pour que vous profitiez de ce qui compte vraiment.
        </p>

        {/* Double CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Link to="/services">
            <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold">
              🛒 Réserver dès maintenant
            </Button>
          </Link>
          
          <Link to="/nous-recrutons">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-transparent border-white text-white hover:bg-white hover:text-primary"
            >
              💼 Devenir prestataire
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewHero;