import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle, Heart } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          question: "Comment fonctionne Assist'mw ?",
          answer: "Assist'mw vous met en relation avec des assistants familiaux vérifiés et formés. Vous réservez en ligne selon vos besoins, et nous nous occupons de tout : matching, planning, suivi qualité."
        },
        {
          question: "Dans quelles zones géographiques intervenez-vous ?",
          answer: "Nous couvrons actuellement l'Île-de-France : Paris et petite couronne (92, 93, 94). Extension progressive vers la grande couronne selon la demande."
        },
        {
          question: "Vos prestataires sont-ils vérifiés ?",
          answer: "Absolument ! Tous nos assistants passent par une vérification complète : vérification d'identité, casier judiciaire, références, entretien personnel et formation Assist'mw."
        }
      ]
    },
    {
      category: "Réservation & Tarifs",
      questions: [
        {
          question: "Comment réserver un service ?",
          answer: "Très simple : créez votre compte, choisissez votre service et créneau, validez votre réservation. Vous recevez immédiatement la confirmation avec les détails de votre assistant."
        },
        {
          question: "Quels sont vos tarifs ?",
          answer: "Nos tarifs démarrent à 25€/h selon le service. Nous proposons des formules à la carte, hebdomadaires et mensuelles plus avantageuses."
        },
        {
          question: "Puis-je annuler ou modifier ma réservation ?",
          answer: "Oui, jusqu'à 24h avant pour un remboursement complet. Entre 24h et 2h avant : frais de 50%. Moins de 2h : service facturé intégralement."
        }
      ]
    },
    {
      category: "Services",
      questions: [
        {
          question: "Quelle est la différence entre vos packages ?",
          answer: "Assist'Kids (garde d'enfants), Assist'Maison (logistique quotidienne), Assist'Vie (conciergerie), Assist'Travel (voyages), Assist'Plus (service premium 7j/7), Assist'Pro (entreprises)."
        },
        {
          question: "Puis-je avoir toujours le même assistant ?",
          answer: "Nous privilégions la continuité relationnelle. Avec nos formules régulières, vous pouvez demander le même assistant. Pour Assist'Plus, vous avez un Chef Family Officer dédié."
        },
        {
          question: "Que se passe-t-il en cas d'urgence ?",
          answer: "Nous avons une ligne d'urgence 7j/7. Pour Assist'Plus, assistance prioritaire immédiate. Pour les autres formules, intervention sous 2h selon disponibilité."
        }
      ]
    },
    {
      category: "Paiement & Facturation",
      questions: [
        {
          question: "Quels moyens de paiement acceptez-vous ?",
          answer: "Carte bancaire, prélèvement SEPA, et CESU (Chèque Emploi Service Universel). Paiement sécurisé à la réservation ou en fin de service selon votre préférence."
        },
        {
          question: "Puis-je utiliser mes CESU ?",
          answer: "Oui ! Nous sommes agréés services à la personne. Vous bénéficiez du crédit d'impôt de 50% et pouvez utiliser vos CESU préfinancés."
        },
        {
          question: "Comment fonctionne la facturation ?",
          answer: "Facturation automatique après chaque service. Récapitulatif mensuel disponible dans votre espace client. Export possible pour vos déclarations."
        }
      ]
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let questionIndex = 0;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <HelpCircle className="w-4 h-4" />
            <span>Questions fréquentes</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Tout savoir sur
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Assist'mw
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez toutes les réponses à vos questions sur nos services, 
            tarifs et fonctionnement.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="animate-fade-in-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {category.category}
              </h3>
              
              <div className="space-y-3">
                {category.questions.map((faq, index) => {
                  const currentQuestionIndex = questionIndex++;
                  return (
                    <Card 
                      key={index}
                      className="overflow-hidden border-primary/10 hover:shadow-soft transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleQuestion(currentQuestionIndex)}
                        className="w-full p-6 text-left flex justify-between items-center hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-medium text-foreground pr-4">
                          {faq.question}
                        </span>
                        {openIndex === currentQuestionIndex ? (
                          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                      
                      {openIndex === currentQuestionIndex && (
                        <div className="px-6 pb-6 pt-0 border-t border-border animate-fade-in">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Card className="p-8 bg-gradient-cocon border-primary/10">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Une question spécifique ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Notre équipe est là pour vous accompagner et répondre à toutes vos questions 
              avec la douceur et l'attention que mérite votre famille.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all">
                Nous contacter
              </button>
              <button className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-all">
                Prendre rendez-vous
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQ;