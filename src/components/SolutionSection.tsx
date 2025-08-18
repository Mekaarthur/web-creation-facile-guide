import { Baby, Users2, ShoppingCart, Dog, FileText } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useAnimations";

const SolutionSection = () => {
  const { setRef, isInView } = useScrollAnimation();

  const services = [
    {
      icon: Baby,
      title: "Garde d'enfants",
      description: "Accompagnement éducatif personnalisé"
    },
    {
      icon: Users2,
      title: "Aide aux seniors",
      description: "Accompagnement bienveillant au quotidien"
    },
    {
      icon: ShoppingCart,
      title: "Courses & livraisons",
      description: "Approvisionnement et commissions"
    },
    {
      icon: Dog,
      title: "Soins aux animaux",
      description: "Promenades et garde d'animaux"
    },
    {
      icon: FileText,
      title: "Démarches admin",
      description: "Simplification administrative"
    }
  ];

  return (
    <section ref={setRef} className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`space-y-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Titre principal */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-foreground">Bikawo,</span>
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                votre assistant personnel
              </span>
              <br />
              <span className="text-foreground">au quotidien</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-accent font-medium">
              vous libère de cette charge mentale
            </p>
          </div>

          {/* Services avec icônes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pt-12">
            {services.map((service, index) => (
              <div 
                key={service.title}
                className={`group ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="bg-card p-6 rounded-2xl shadow-soft border border-border hover:shadow-elegant transition-all duration-300 hover:scale-105">
                  <service.icon className="w-12 h-12 mx-auto mb-4 text-primary group-hover:text-accent transition-colors" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;