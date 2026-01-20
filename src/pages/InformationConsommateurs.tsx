import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  ListChecks, 
  Star, 
  CreditCard, 
  Shield, 
  Scale, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const InformationConsommateurs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <FileText className="w-3 h-3 mr-1" />
              Articles L.111-7 et D.111-7 du Code de la consommation
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Information des Consommateurs
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Transparence sur le fonctionnement de la plateforme Bikawo, 
              conformément à la réglementation en vigueur.
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="text-muted-foreground leading-relaxed">
                    Le service numérique de mise en relation proposé par <strong>Bikawo</strong> est dédié 
                    aux prestations de services à domicile. Il permet la mise en relation entre des 
                    consommateurs (les « <strong>Clients</strong> ») et des professionnels (les « <strong>Partenaires</strong> ») 
                    en vue de la réalisation de prestations de garde d'enfants, de ménage ainsi que 
                    toute autre prestation proposée sur la Plateforme.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    La validation d'une commande entraîne la conclusion d'un contrat de prestation 
                    de services directement entre le Client et le Partenaire. <strong>Bikawo intervient 
                    exclusivement en qualité d'intermédiaire</strong> de mise en relation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Accordion type="single" collapsible className="space-y-4">
            {/* Section 1: Référencement */}
            <AccordionItem value="referencement" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ListChecks className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">1. Conditions de référencement et déréférencement</h2>
                    <p className="text-sm text-muted-foreground font-normal">Inscription et obligations des Partenaires</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6 pl-12">
                  {/* 1.1 Référencement */}
                  <div>
                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      1.1 Règles applicables au référencement
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Pour proposer ses services sur Bikawo, tout Partenaire doit créer un compte 
                      via l'espace dédié aux prestataires. Les prestations ne peuvent être proposées 
                      que par des <strong>professionnels</strong>.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Documents requis :</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Nom, prénom, numéro de SIREN</li>
                        <li>• Adresse électronique et numéro de téléphone</li>
                        <li>• Date de naissance et adresse</li>
                        <li>• Domaine d'activité exercé</li>
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Bikawo vérifie le respect de ces conditions et peut soumettre le Partenaire 
                      à un entretien téléphonique ainsi qu'à un test de compétences.
                    </p>
                  </div>

                  <Separator />

                  {/* 1.2 Déréférencement */}
                  <div>
                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      1.2 Déréférencement
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-2 border-orange-400 pl-4">
                        <p className="font-medium text-sm text-orange-700 dark:text-orange-400">Déréférencement automatique</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Le compte sera limité si le Partenaire annule <strong>4 prestations</strong> moins 
                          de 72 heures avant leur début au cours d'un même mois.
                        </p>
                      </div>
                      
                      <div className="border-l-2 border-red-400 pl-4">
                        <p className="font-medium text-sm text-red-700 dark:text-red-400">Déréférencement manuel</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                          <li>• Messages désobligeants ou agressifs</li>
                          <li>• Comportement inapproprié envers les Clients</li>
                          <li>• Avis négatifs répétés</li>
                          <li>• Absences injustifiées</li>
                          <li>• Annulations répétées</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Classement */}
            <AccordionItem value="classement" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">2. Critères de classement des offres</h2>
                    <p className="text-sm text-muted-foreground font-normal">Algorithme et score Bikawo</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6 pl-12">
                  <div>
                    <h3 className="font-semibold text-base mb-3">2.1 Mise en relation Client - Partenaire</h3>
                    <p className="text-muted-foreground">
                      Une fois la commande validée, elle est transmise via l'algorithme de Bikawo 
                      aux Partenaires disponibles correspondant le mieux à la demande. La proposition 
                      repose sur un <strong>score</strong> attribué à chaque Partenaire, variant notamment en 
                      fonction de sa capacité à fidéliser les Clients.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Important :</strong> Aucune rémunération ne peut être versée à Bikawo 
                        pour améliorer son classement.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-base mb-3">2.2 Détails du score Bikawo</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <p className="font-medium text-sm mb-2">Critères du score</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Taux de fidélisation des Clients</li>
                            <li>• Distance géographique</li>
                            <li>• Historique sur 18 mois</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <p className="font-medium text-sm mb-2">Nouveaux Partenaires</p>
                          <p className="text-sm text-muted-foreground">
                            Score « moyen » attribué initialement, évoluant vers le score réel 
                            après <strong>30 prestations</strong>.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Qualité */}
            <AccordionItem value="qualite" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">3. Qualité des Partenaires</h2>
                    <p className="text-sm text-muted-foreground font-normal">Statut professionnel et vérifications</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="pl-12">
                  <p className="text-muted-foreground mb-4">
                    Les Partenaires sont des <strong>professionnels</strong> exerçant en tant que travailleurs 
                    indépendants, sous la forme juridique de leur choix (micro-entreprise, société, etc.).
                  </p>
                  <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Vérification garantie</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        La qualité professionnelle des Partenaires est vérifiée par Bikawo lors de l'inscription. 
                        Les compétences peuvent également faire l'objet de vérifications complémentaires.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Prix */}
            <AccordionItem value="prix" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">4. Prix et modalités de paiement</h2>
                    <p className="text-sm text-muted-foreground font-normal">Tarification et processus de paiement</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4 pl-12">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-2">Inscription</p>
                      <p className="text-2xl font-bold text-green-600">Gratuite</p>
                      <p className="text-sm text-muted-foreground">Pour tous les utilisateurs</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-2">Frais de mise en relation</p>
                      <p className="text-2xl font-bold text-primary">~17%</p>
                      <p className="text-sm text-muted-foreground">En moyenne du panier</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Processus de paiement (via Stripe)</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">1</Badge>
                        <span>Pré-autorisation 24h avant la prestation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">2</Badge>
                        <span>Débit dans les 24h suivant la réalisation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">3</Badge>
                        <span>Versement au Partenaire : hebdomadaire (ou mensuel sur demande) + 8 jours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Indemnisation */}
            <AccordionItem value="indemnisation" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">5. Indemnisation</h2>
                    <p className="text-sm text-muted-foreground font-normal">Couverture des dommages et procédure</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6 pl-12">
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Certains dommages résultant de la casse ou détérioration d'un bien peuvent 
                      faire l'objet d'une indemnisation par Bikawo.
                    </p>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">Délai important</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Signalement obligatoire dans les <strong>72 heures</strong> suivant la prestation 
                            à <a href="mailto:contact@bikawo.com" className="underline">contact@bikawo.com</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sinistres &lt; 200€</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Non pris en charge (franchise)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">200€ - 1 000€</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Indemnisation par Bikawo (bons d'achat jusqu'à 150€, puis virement)
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sinistres &gt; 1 000€</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Pris en charge par l'assurance de Bikawo
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border-l-2 border-muted-foreground/30 pl-4">
                      <p className="font-medium text-sm mb-2">Clause de vétusté</p>
                      <p className="text-sm text-muted-foreground">
                        10% par an, plafonnée à 50%
                      </p>
                    </div>
                    <div className="border-l-2 border-red-400 pl-4">
                      <p className="font-medium text-sm mb-2">Exclusions</p>
                      <ul className="text-sm text-muted-foreground">
                        <li>• Vol</li>
                        <li>• Œuvres d'art</li>
                        <li>• Rayures/taches mineures</li>
                        <li>• Prestations hors plateforme</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Litiges */}
            <AccordionItem value="litiges" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">6. Règlement des litiges</h2>
                    <p className="text-sm text-muted-foreground font-normal">Médiation et réclamations</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="pl-12">
                  <p className="text-muted-foreground mb-4">
                    En cas de litige, les parties s'engagent à rechercher une <strong>solution amiable</strong>.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm">
                      Le rôle de Bikawo étant strictement limité à l'intermédiation numérique, 
                      sa responsabilité ne saurait être engagée en cas de mauvaise exécution d'une prestation. 
                      Bikawo peut toutefois intervenir à titre d'intermédiaire pour favoriser un règlement amiable.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-muted-foreground">
                      Réclamations à adresser dans les <strong>72 heures</strong> à{" "}
                      <a href="mailto:contact@bikawo.com" className="text-primary underline">contact@bikawo.com</a>
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 7: Avis */}
            <AccordionItem value="avis" className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">7. Avis en ligne</h2>
                    <p className="text-sm text-muted-foreground font-normal">Publication et modération des avis</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4 pl-12">
                  <p className="text-muted-foreground">
                    Les Clients peuvent publier des avis et attribuer une note aux Partenaires. 
                    Le dépôt d'un avis ne donne lieu à <strong>aucune contrepartie</strong>.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-sm">Conditions d'affichage</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Score ≥ 4/5, ou</li>
                        <li>• Au moins 5 notations reçues</li>
                        <li>• Maximum 50 avis affichés</li>
                        <li>• Ordre chronologique</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-sm">Délais de publication</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Avis positifs : immédiat</li>
                        <li>• Avis négatifs : 1 semaine</li>
                        <li>• Enquêtes satisfaction : 1 mois max</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Transparence :</strong> Les avis ne font l'objet d'aucune modération par Bikawo. 
                      Une fois publiés, ils ne peuvent être modifiés par leur auteur et demeurent 
                      accessibles pour une durée indéterminée.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer Links */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Pour plus d'informations, consultez nos{" "}
              <Link to="/cgu" className="text-primary underline hover:no-underline">
                Conditions Générales d'Utilisation
              </Link>
            </p>
            <p className="mt-2">
              Contact : <a href="mailto:contact@bikawo.com" className="text-primary underline hover:no-underline">contact@bikawo.com</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InformationConsommateurs;
