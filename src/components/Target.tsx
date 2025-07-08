import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Heart, 
  Briefcase, 
  Plane,
  ArrowRight,
  Star,
  Baby,
  Home as HomeIcon,
  UserCheck,
  MapPin
} from "lucide-react";

const Target = () => {
  const targetGroups = [
    {
      icon: Users,
      title: "Familles actives",
      subtitle: "Couples & familles monoparentales",
      description: "Parents surbookés qui jonglent entre vie professionnelle intense et besoins familiaux quotidiens.",
      needs: [
        "Garde d'enfants flexible",
        "Gestion des courses et logistique",
        "Aide aux devoirs et activités",
        "Organisation du planning familial"
      ],
      color: "primary",
      testimonial: "Assist'mw nous a sauvé la vie ! Plus de stress pour les sorties d'école."
    },
    {
      icon: Heart,
      title: "Seniors autonomes",
      subtitle: "Personnes âgées & dépendance légère",
      description: "Seniors souhaitant maintenir leur autonomie tout en bénéficiant d'un accompagnement personnalisé.",
      needs: [
        "Aide aux démarches administratives",
        "Courses et petites commissions",
        "Accompagnement aux rendez-vous",
        "Surveillance bienveillante"
      ],
      color: "accent",
      testimonial: "Un service qui me permet de rester chez moi en toute sérénité."
    },
    {
      icon: Briefcase,
      title: "Professionnels indépendants",
      subtitle: "TPE, start-ups & professions libérales",
      description: "Entrepreneurs et indépendants qui ont besoin de déléguer pour se concentrer sur leur activité.",
      needs: [
        "Assistance administrative externalisée",
        "Gestion de planning professionnel",
        "Organisation d'événements business",
        "Support logistique quotidien"
      ],
      color: "primary",
      testimonial: "Déléguer m'a permis de doubler mon chiffre d'affaires cette année."
    },
    {
      icon: Plane,
      title: "Voyageurs fréquents",
      subtitle: "Déplacements pro & perso en Île-de-France",
      description: "Personnes en déplacement régulier qui ont besoin d'assistance avant, pendant et après leurs voyages.",
      needs: [
        "Assistance aéroport et transferts",
        "Gestion des documents de voyage",
        "Veille des vols et rebooking",
        "Service Travel-Kids pour familles"
      ],
      color: "accent",
      testimonial: "Fini les galères d'aéroport, je voyage l'esprit tranquille."
    }
  ];

  const coverage = [
    {
      zone: "Paris intra-muros",
      coverage: "100%",
      response: "< 2h",
      color: "primary"
    },
    {
      zone: "Petite couronne",
      coverage: "95%",
      response: "< 3h",
      color: "accent"
    },
    {
      zone: "Grande couronne",
      coverage: "80%",
      response: "< 4h",
      color: "primary"
    },
    {
      zone: "Aéroports IDF",
      coverage: "100%",
      response: "24h/7j",
      color: "accent"
    }
  ];

  return (
    <section id="target" className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Nos publics cibles</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Qui peut bénéficier
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              de nos services ?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Assist'mw s'adresse à tous ceux qui cherchent à simplifier leur quotidien 
            et à retrouver du temps pour ce qui compte vraiment.
          </p>
        </div>

        {/* Target Groups */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {targetGroups.map((group, index) => {
            const IconComponent = group.icon;
            return (
              <Card 
                key={group.title}
                className="p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${
                      group.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    } flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">{group.title}</h3>
                      <p className="text-sm font-medium text-accent">{group.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground">{group.description}</p>

                  {/* Needs */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Besoins typiques :</h4>
                    <ul className="space-y-1">
                      {group.needs.map((need, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            group.color === 'primary' ? 'bg-primary' : 'bg-accent'
                          }`}></div>
                          <span className="text-muted-foreground">{need}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Testimonial */}
                  <div className="pt-4 border-t border-border">
                    <blockquote className="text-sm italic text-muted-foreground">
                      "{group.testimonial}"
                    </blockquote>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Coverage Map */}
        <div className="space-y-12">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Notre couverture en Île-de-France
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un service de proximité adapté à chaque zone géographique avec des temps de réponse optimisés.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {coverage.map((zone, index) => (
              <Card key={zone.zone} className="p-6 text-center hover:shadow-glow transition-all duration-300">
                <div className="space-y-4">
                  <div className={`w-12 h-12 mx-auto rounded-lg ${
                    zone.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                  } flex items-center justify-center`}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-foreground">{zone.zone}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Couverture :</span>
                        <span className="font-semibold text-accent">{zone.coverage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Délai :</span>
                        <span className="font-semibold text-primary">{zone.response}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Card className="p-8 md:p-12 bg-gradient-hero text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold">
                Vous reconnaissez-vous dans ces profils ?
              </h3>
              <p className="text-white/90">
                Que vous soyez parent débordé, senior actif, entrepreneur ambitieux ou grand voyageur, 
                Assist'mw a la solution qu'il vous faut.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="glass" size="lg">
                  Découvrir nos services
                </Button>
                <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90">
                  Évaluer mes besoins
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Target;