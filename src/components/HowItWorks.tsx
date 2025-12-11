import { CalendarCheck, UserSearch, Star, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserSearch,
      step: '1',
      title: 'Choisissez votre service',
      description: 'Sélectionnez parmi notre gamme de services : garde d\'enfants, aide seniors, ménage, courses...',
    },
    {
      icon: CalendarCheck,
      step: '2',
      title: 'Réservez en ligne',
      description: 'Choisissez la date, l\'heure et la durée qui vous conviennent. Réservation en quelques clics.',
    },
    {
      icon: Star,
      step: '3',
      title: 'Prestataire vérifié',
      description: 'Nous assignons un prestataire qualifié et vérifié, adapté à vos besoins.',
    },
    {
      icon: CreditCard,
      step: '4',
      title: 'Paiement sécurisé',
      description: 'Payez en ligne en toute sécurité. Profitez de 50% de crédit d\'impôts sur vos services.',
    },
  ];

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
          Simple & Rapide
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Comment ça marche ?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Réservez vos services en 4 étapes simples
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {steps.map((item, index) => (
          <div key={index} className="relative group">
            {/* Connector line - hidden on mobile and last item */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
            )}
            
            <div className="relative bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
              {/* Step number badge */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {item.step}
              </div>
              
              {/* Icon */}
              <div className="mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Prestataires vérifiés</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Paiement 100% sécurisé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>50% crédit d'impôts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Service client 7j/7</span>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
