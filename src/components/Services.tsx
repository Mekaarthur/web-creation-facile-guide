import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Phone, 
  Monitor, 
  Settings, 
  Users, 
  Zap,
  ArrowRight,
  Clock,
  Shield,
  Star
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: MessageSquare,
      title: "Chat en direct",
      description: "Discutez instantanément avec nos experts via notre chat en ligne. Réponses immédiates garanties.",
      features: ["Disponible 24h/24", "Réponse en moins de 2min", "Multilingue"],
      color: "primary",
      popular: false
    },
    {
      icon: Phone,
      title: "Support téléphonique",
      description: "Appelez-nous directement pour une assistance personnalisée et des solutions rapides.",
      features: ["Numéro gratuit", "Experts certifiés", "Suivi de dossier"],
      color: "accent",
      popular: true
    },
    {
      icon: Monitor,
      title: "Assistance technique",
      description: "Résolution de problèmes techniques complexes avec prise de contrôle à distance si nécessaire.",
      features: ["Diagnostic gratuit", "Réparation à distance", "Guide étape par étape"],
      color: "primary",
      popular: false
    },
    {
      icon: Settings,
      title: "Configuration sur mesure",
      description: "Paramétrage et configuration personnalisée de vos outils et logiciels professionnels.",
      features: ["Setup complet", "Formation incluse", "Documentation fournie"],
      color: "accent",
      popular: false
    },
    {
      icon: Users,
      title: "Formation équipe",
      description: "Sessions de formation pour vos équipes sur les outils et bonnes pratiques.",
      features: ["Sessions personnalisées", "Matériel de formation", "Certification"],
      color: "primary",
      popular: false
    },
    {
      icon: Zap,
      title: "Intervention urgente",
      description: "Service d'urgence pour les problèmes critiques nécessitant une intervention immédiate.",
      features: ["Intervention 1h", "Priorité absolue", "Suivi jusqu'à résolution"],
      color: "accent",
      popular: false
    }
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Nos services</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Comment pouvons-nous
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              vous aider ?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Choisissez le type d'assistance qui correspond le mieux à vos besoins. 
            Nos experts sont là pour vous accompagner à chaque étape.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card 
                key={service.title} 
                className={`relative p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] group border ${
                  service.popular ? 'border-accent' : 'border-border'
                } animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Le plus populaire
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg ${
                    service.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {service.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          service.color === 'primary' ? 'bg-primary' : 'bg-accent'
                        }`}></div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button 
                    variant={service.popular ? "accent" : "outline"} 
                    className="w-full group/btn"
                  >
                    Choisir ce service
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-subtle rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Besoin d'un service personnalisé ?
              </h3>
              <p className="text-muted-foreground">
                Contactez-nous pour discuter de vos besoins spécifiques. 
                Nous créons des solutions sur mesure pour chaque client.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg">
                  Demander un devis
                </Button>
                <Button variant="outline" size="lg">
                  Parler à un expert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;