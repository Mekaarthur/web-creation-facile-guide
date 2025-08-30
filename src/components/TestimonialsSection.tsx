import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      type: "client",
      name: "Marie L.",
      role: "Cliente Bika Maison",
      content: "Service exceptionnel, très satisfaite ! Bikawo m'a vraiment simplifié la vie.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face"
    },
    {
      type: "prestataire", 
      name: "Thomas R.",
      role: "Prestataire Bika Kids",
      content: "Plateforme géniale pour arrondir mes fins de mois, clients respectueux !",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      type: "client",
      name: "Sophie M.", 
      role: "Cliente Bika Travel",
      content: "Enfin du temps pour moi ! L'équipe Bika Travel a géré mon voyage parfaitement.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const renderStars = () => (
    <div className="flex justify-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Témoignages
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                {renderStars()}
                
                <p className="text-lg italic mb-6 text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center justify-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-primary">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;