import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Info, ArrowRight, Shield, Clock, HelpCircle, Mail, Phone, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import LogoUrssaf from "@/components/LogoUrssaf";

const AvanceImmediate = () => {
  return (
    <>
      <Helmet>
        <title>Avance Immédiate du Crédit d'Impôt | Bikawo</title>
        <meta name="description" content="Découvrez le service d'Avance Immédiate du crédit d'impôt pour les services à la personne, mis en place par l'Urssaf et la Direction générale des Finances publiques." />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-28 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <LogoUrssaf width={140} />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                50% de réduction immédiate <br className="hidden sm:block" />
                <span className="text-primary">sur vos services</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                Grâce à l'avance immédiate de crédit d'impôt, vous ne payez que <strong className="text-primary">50% du prix</strong> de 
                vos services Bikawo. Un service officiel mis en place par <strong className="text-foreground">l'Urssaf</strong> et la{" "}
                <strong className="text-foreground">Direction générale des Finances publiques (DGFiP)</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Bikawo — Organisme SAP déclaré n° <strong className="text-foreground">SAP 880491436</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Non obligatoire */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-foreground text-lg mb-1">⚠️ Utilisation facultative</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  L'avance immédiate est <strong className="text-foreground">optionnelle</strong>. Vous pouvez choisir de :
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span><strong className="text-foreground">Bénéficier de l'avance immédiate</strong> (paiement réduit de 50%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span><strong className="text-foreground">OU payer le montant plein</strong> et récupérer votre crédit d'impôt l'année suivante sur votre déclaration de revenus</span>
                  </li>
                </ul>
                <p className="text-muted-foreground mt-3 font-medium">C'est votre choix.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions d'accès */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Conditions pour en bénéficier
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Conditions d'accès
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span>Être domicilié fiscalement en France</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span>Utiliser les services à la personne de Bikawo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span>
                      Activer votre espace sur le portail URSSAF indiqué par Bikawo ({" "}
                      <a href="https://www.cesu.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        CESU
                      </a>,{" "}
                      <a href="https://www.letese.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        TESE
                      </a>{" "}ou{" "}
                      <a href="https://nova.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        Nova
                      </a>)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span>Valider les demandes de paiement sous 48h</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">💰 Plafonds du crédit d'impôt</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Le crédit d'impôt est de <strong className="text-primary">50% des sommes versées</strong>, dans la limite de :
                </p>
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plafond de base</span>
                    <span className="font-bold text-foreground">12 000 € <span className="text-sm font-normal text-muted-foreground">(soit 6 000 € de crédit)</span></span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">1ère année de recours aux SAP</span>
                    <span className="font-bold text-foreground">15 000 € <span className="text-sm font-normal text-muted-foreground">(soit 7 500 € de crédit)</span></span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Enfant à charge / membre du foyer &gt; 65 ans</span>
                    <span className="font-bold text-foreground">15 000 € <span className="text-sm font-normal text-muted-foreground">(+1 500 € par personne)</span></span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invalidité (titulaire carte ou bénéficiaire APA)</span>
                    <span className="font-bold text-primary text-lg">20 000 € <span className="text-sm font-normal text-muted-foreground">(soit 10 000 € de crédit)</span></span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 Exemple : pour une prestation de <strong className="text-foreground">25€/h</strong>, vous ne payez que{" "}
                  <strong className="text-primary">12,50€/h</strong>. L'État paie les 12,50€ restants immédiatement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Parcours en 5 étapes */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
              Comment ça fonctionne ?
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Réservez votre service",
                  description: "Réservez votre service sur Bikawo.",
                },
                {
                  step: "2",
                  title: "Activez votre espace URSSAF",
                  description: "Selon votre situation, activez votre compte sur le portail indiqué par Bikawo : CESU (cesu.urssaf.fr), TESE ou Nova. Vous recevrez un email avec le lien d'activation correspondant.",
                },
                {
                  step: "3",
                  title: "Demande de paiement",
                  description: "Après chaque prestation, vous recevez une demande de paiement sur votre espace URSSAF.",
                },
                {
                  step: "4",
                  title: "Validez sous 48h",
                  description: "Vous disposez de 48 heures pour valider ou contester la demande de paiement.",
                },
                {
                  step: "5",
                  title: "Paiement automatique à 50%",
                  description: "Vous ne payez que 50% du prix. L'État paie les 50% restants immédiatement.",
                },
              ].map((item, index, arr) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                      {item.step}
                    </div>
                    {index < arr.length - 1 && (
                      <div className="w-0.5 h-8 bg-primary/30 mt-1" />
                    )}
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interlocuteur = Bikawo */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <HelpCircle className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">💬 Des questions ?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Votre interlocuteur reste <strong className="text-foreground">Bikawo</strong>.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Pour toute question sur vos réservations, vos factures, le fonctionnement de l'avance immédiate 
                    ou un litige avec un prestataire :
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a href="mailto:contact@bikawo.com">
                      <Button variant="outline" className="gap-2">
                        <Mail className="w-4 h-4" />
                        contact@bikawo.com
                      </Button>
                    </a>
                    <a href="tel:+33609085390">
                      <Button variant="outline" className="gap-2">
                        <Phone className="w-4 h-4" />
                        06 09 08 53 90
                      </Button>
                    </a>
                    <Link to="/contact">
                      <Button className="gap-2">
                        Nous contacter
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* URSSAF contact info */}
              <div className="border-t border-border pt-5">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">L'URSSAF gère uniquement le versement du crédit d'impôt.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  Pour des questions techniques sur votre espace URSSAF :{" "}
                  <a href="https://www.cesu.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">CESU</a>,{" "}
                  <a href="https://www.letese.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">TESE</a>{" "}ou{" "}
                  <a href="https://nova.urssaf.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Nova</a>{" "}
                  (rubrique "Contact")
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lien impots.gouv.fr */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                ℹ️ Plafonds et conditions détaillées
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Pour connaître les plafonds de crédit d'impôt détaillés et les conditions applicables 
                à votre situation personnelle, consultez le site officiel des impôts.
              </p>
              <a
                href="https://www.impots.gouv.fr/portail/particulier/emploi-domicile"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2 mt-4">
                  <ExternalLink className="w-5 h-5" />
                  Consulter le site des impôts
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Prêt à bénéficier de l'Avance Immédiate ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Réservez votre première prestation et profitez immédiatement de votre crédit d'impôt de 50%.
            </p>
            <Link to="/services">
              <Button size="lg" className="gap-2 mt-2">
                Découvrir nos services
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AvanceImmediate;
