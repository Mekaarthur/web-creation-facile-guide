import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Marie C.",
      role: "Maman de 2 enfants",
      content: "Assist'mw nous a sauvé la vie ! Plus de stress pour les sorties d'école. Notre assistante familiale est devenue indispensable.",
      rating: 5,
      service: "Assist'Kids"
    },
    {
      name: "Jean-Pierre L.",
      role: "Senior, Paris 16e",
      content: "Enfin un service qui comprend mes besoins. L'aide administrative et les courses sont parfaitement gérées. Je recommande vivement !",
      rating: 5,
      service: "Assist'Vie"
    },
    {
      name: "Sophie & Thomas",
      role: "Couple actif",
      content: "Le service Travel nous a permis de voyager sereinement. Tout était organisé, même avec les enfants. Un vrai cocon de sérénité.",
      rating: 5,
      service: "Assist'Travel"
    },
    {
      name: "Claire M.",
      role: "Entrepreneure",
      content: "Grâce à Assist'mw, j'ai retrouvé du temps pour ma famille. L'équipe est douce, fiable et comprend parfaitement nos besoins.",
      rating: 5,
      service: "Assist'Maison"
    },
    {
      name: "Famille Dubois",
      role: "Famille nombreuse",
      content: "Le service Premium nous offre une tranquillité d'esprit inestimable. Notre Chef Family Officer anticipe tous nos besoins.",
      rating: 5,
      service: "Assist'Plus"
    },
    {
      name: "Agnès R.",
      role: "Maman solo",
      content: "Ils comprennent vraiment les défis des parents. Le service est humain, personnalisé et d'une douceur remarquable.",
      rating: 5,
      service: "Assist'Kids"
    }
  ];

  return (
    <section className="py-20 bg-gradient-cocon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Heart className="w-4 h-4" />
            <span>Témoignages familles</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Ils nous font confiance
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              pour leur cocon familial
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez les témoignages de familles qui ont retrouvé sérénité et harmonie 
            grâce à nos services d'assistance familiale.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-cocon transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm border-primary/10 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="space-y-4 p-0">
                {/* Quote Icon */}
                <div className="flex justify-between items-start">
                  <Quote className="w-8 h-8 text-primary/40" />
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                    {testimonial.service}
                  </div>
                </div>

                {/* Content */}
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Author */}
                <div className="pt-2 border-t border-border">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-subtle rounded-2xl p-8 shadow-cocon">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Rejoignez notre communauté de familles sereines
            </h3>
            <p className="text-muted-foreground mb-6">
              Découvrez vous aussi la douceur et la tranquillité d'un service pensé pour votre bien-être familial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all">
                Commencer maintenant
              </button>
              <button className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-all">
                Découvrir nos services
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;