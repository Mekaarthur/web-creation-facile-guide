import { Brain, DollarSign, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WhyBikawo = () => {
  const benefits = [
    {
      icon: Brain,
      title: "Pour nos clients : Zéro charge mentale",
      description: "Confiez vos tâches et libérez votre esprit pour l'essentiel",
      color: "text-blue-500"
    },
    {
      icon: DollarSign,
      title: "Pour nos prestataires : Revenus complémentaires", 
      description: "Opportunités flexibles pour étudiants, actifs, retraités, parents",
      color: "text-green-500"
    },
    {
      icon: Heart,
      title: "Pour tous : Épanouissement mutuel",
      description: "Une communauté qui grandit ensemble, clients satisfaits et prestataires valorisés",
      color: "text-red-500"
    }
  ];

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Bikawo, c'est surtout…
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <benefit.icon className={`h-16 w-16 mx-auto ${benefit.color}`} />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyBikawo;