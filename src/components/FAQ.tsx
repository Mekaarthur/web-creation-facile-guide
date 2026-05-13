import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle, Heart } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation();

  const faqs = [
    {
      category: "💙 À propos de Bikawo",
      questions: [
        {
          question: "Qu'est-ce que Bikawo ?",
          answer: "Bikawo est une plateforme de services personnalisés pour simplifier votre quotidien avec tendresse et professionnalisme : garde d'enfants, gestion du foyer, conciergerie, assistance voyage, soins aux animaux et accompagnement des seniors."
        },
        {
          question: "Où intervenez-vous ?",
          answer: "Nous intervenons dans toute l'Île-de-France (75, 77, 78, 91, 92, 93, 94, 95). Contactez-nous pour confirmer la disponibilité dans votre secteur."
        },
        {
          question: "Quels sont vos horaires ?",
          answer: "Services standards : de 7h à 22h (semaine) et de 8h à 20h (week-end). Services d'urgence et de nuit : 24h/24, 7j/7 pour vous accompagner à tout moment."
        }
      ]
    },
    {
      category: "🔹 Réservation & Paiement",
      questions: [
        {
          question: "Comment réserver un service ?",
          answer: "Via notre plateforme en ligne : choisissez le service, la date, l'heure et la durée. Une confirmation vous sera envoyée immédiatement pour vous rassurer."
        },
        {
          question: "Combien de temps à l'avance réserver ?",
          answer: "Services réguliers : 48h minimum pour nous permettre de vous trouver le meilleur intervenant. Services urgents : intervention dans les meilleurs délais."
        },
        {
          question: "Quels sont vos tarifs ?",
          answer: "Services standards : 25 €/h • Services urgents, nuit et spécialisés : 30 à 40 €/h • Prestations spécifiques (Bika Pro, Bika Plus, etc.) : sur devis ou forfaits adaptés à vos besoins."
        },
        {
          question: "Quels modes de paiement acceptez-vous ?",
          answer: "Carte bancaire et avance immédiate de crédit d'impôt (URSSAF). Le montant est prélevé après la prestation pour votre tranquillité d'esprit."
        },
        {
          question: "Y a-t-il des frais cachés ?",
          answer: "Non, jamais ! Nos tarifs sont transparents, sans frais supplémentaires. Nous croyons en la confiance mutuelle."
        }
      ]
    },
    {
      category: "👶 BIKA KIDS – Garde d'enfants",
      questions: [
        {
          question: "Vos intervenants sont-ils qualifiés ?",
          answer: "Oui, tous nos intervenants sont diplômés, expérimentés, avec casier judiciaire vierge et formation premiers secours. Votre sérénité est notre priorité."
        },
        {
          question: "Âge minimum des enfants gardés ?",
          answer: "Dès 3 ans avec nos intervenants spécialisés dans l'accompagnement des enfants."
        },
        {
          question: "Que se passe-t-il en cas d'urgence ?",
          answer: "Nos intervenants vous contactent immédiatement et, si besoin, accompagnent l'enfant chez le médecin ou aux urgences. Aucune décision sans votre accord. Aucun médicament n'est administré sans ordonnance ni sans présence parentale."
        },
        {
          question: "Puis-je demander toujours le même intervenant ?",
          answer: "Absolument ! Nous favorisons la continuité pour créer un lien de confiance avec votre enfant."
        },
        {
          question: "Quelles activités proposez-vous ?",
          answer: "Parc, lecture, jeux éducatifs, activités manuelles, aide aux devoirs... Tout pour l'épanouissement de votre enfant."
        }
      ]
    },
    {
      category: "🏠 BIKA MAISON – Gestion du foyer",
      questions: [
        {
          question: "Comment gérez-vous les courses ?",
          answer: "Courses avec liste fournie par vous. En cas d'indisponibilité d'un produit, nous validons toujours avec vous avant substitution."
        },
        {
          question: "Puis-je recevoir des colis en mon absence ?",
          answer: "Oui ! Réception de colis et livraisons possible en votre absence pour vous faciliter la vie."
        },
        {
          question: "Quels autres services proposez-vous ?",
          answer: "Aide déménagement, montage de meubles, entretien jardin... Tout pour que votre foyer soit un cocon."
        }
      ]
    },
    {
      category: "🔑 BIKA VIE – Conciergerie",
      questions: [
        {
          question: "Quelles démarches administratives prenez-vous en charge ?",
          answer: "Démarches administratives courantes (hors documents confidentiels comme bancaires/fiscaux). Nous vous simplifions la vie."
        },
        {
          question: "Proposez-vous un accompagnement aux rendez-vous ?",
          answer: "Oui, accompagnement aux rendez-vous médicaux ou administratifs avec bienveillance et discrétion."
        },
        {
          question: "Comment garantissez-vous la confidentialité ?",
          answer: "Engagement strict de confidentialité avec accord signé par tous nos intervenants. Votre intimité est sacrée."
        }
      ]
    },
    {
      category: "✈️ BIKA TRAVEL – Assistance voyage",
      questions: [
        {
          question: "Que comprend l'organisation de voyage ?",
          answer: "Organisation complète : transport, hébergement, documents, assurances... Pour que vous ne pensiez qu'au plaisir du voyage."
        },
        {
          question: "Vérifiez-vous nos documents de voyage ?",
          answer: "Oui, nous vérifions la validité de tous vos documents de voyage pour éviter tout stress."
        },
        {
          question: "Proposez-vous une assistance pendant le voyage ?",
          answer: "Assistance 24h/24 : modifications de réservations, imprévus, retards... Nous sommes là même à distance."
        }
      ]
    },
    {
      category: "🐾 BIKA ANIMAL – Soins aux animaux",
      questions: [
        {
          question: "Quels animaux gardez-vous ?",
          answer: "Chiens, chats et NAC (Nouveaux Animaux de Compagnie) selon disponibilités. Vos petits compagnons seront choyés."
        },
        {
          question: "Comment se passe la garde à domicile ?",
          answer: "Garde à domicile avec envoi régulier de nouvelles et photos pour vous rassurer sur le bien-être de votre compagnon."
        },
        {
          question: "Que faites-vous en cas d'urgence vétérinaire ?",
          answer: "Gestion des urgences vétérinaires selon vos consignes précises, avec contact immédiat pour vous tenir informé."
        }
      ]
    },
    {
      category: "👴 BIKA SENIORS – Accompagnement",
      questions: [
        {
          question: "Vos intervenants sont-ils spécialisés ?",
          answer: "Oui, intervenants spécialisés et expérimentés dans l'accompagnement des seniors avec patience et respect."
        },
        {
          question: "Quels services proposez-vous ?",
          answer: "Aide quotidienne, accompagnement médical, stimulation sociale... Pour maintenir l'autonomie avec dignité."
        },
        {
          question: "Aidez-vous avec les nouvelles technologies ?",
          answer: "Oui ! Aide aux nouvelles technologies pour maintenir le lien précieux avec la famille."
        }
      ]
    },
    {
      category: "🔒 Sécurité & Qualité",
      questions: [
        {
          question: "Comment sélectionnez-vous vos intervenants ?",
          answer: "Vérification complète : diplômes, références, casier judiciaire vierge, entretien approfondi, période d'essai supervisée. Votre sécurité n'est pas négociable."
        },
        {
          question: "Êtes-vous assurés ?",
          answer: "Oui ! Bikawo est couvert par une assurance responsabilité civile professionnelle pour toutes ses prestations. Chaque partenaire indépendant est responsable de sa propre couverture professionnelle conformément à son statut."
        },
        {
          question: "Comment évaluez-vous la qualité ?",
          answer: "Après chaque prestation, vous pouvez évaluer nos services. Vos retours nous aident à améliorer continuellement la qualité avec amour du détail."
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
            <span>{t('faq.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('faq.title')}
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              {t('faq.titleHighlight')}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('faq.subtitle')}
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
              {t('faq.ctaTitle')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('faq.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all">
                  {t('faq.ctaContact')}
                </button>
              </Link>
              <a href="tel:+33609085390">
                <button className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-all">
                  {t('faq.ctaAppointment')}
                </button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQ;