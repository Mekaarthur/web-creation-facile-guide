import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Info, ArrowRight, Shield, Clock, HelpCircle } from "lucide-react";
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
                L'Avance Immédiate du <br className="hidden sm:block" />
                <span className="text-primary">Crédit d'Impôt</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                Un service mis en place par <strong className="text-foreground">l'Urssaf</strong> et la{" "}
                <strong className="text-foreground">Direction générale des Finances publiques (DGFiP)</strong> pour 
                vous permettre de bénéficier immédiatement de votre crédit d'impôt pour les services à la personne.
              </p>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 flex items-start gap-4">
              <Info className="w-6 h-6 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-foreground text-lg mb-1">Service facultatif</h2>
                <p className="text-muted-foreground leading-relaxed">
                  L'Avance Immédiate est un service <strong className="text-foreground">optionnel et gratuit</strong>. 
                  Son utilisation n'est en aucun cas obligatoire. Vous pouvez à tout moment choisir de ne pas y recourir 
                  et de bénéficier de votre crédit d'impôt selon les modalités classiques (déclaration annuelle de revenus).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What is it */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Qu'est-ce que l'Avance Immédiate ?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  L'Avance Immédiate vous permet de déduire <strong className="text-foreground">immédiatement</strong> votre 
                  crédit d'impôt du montant que vous payez pour vos services à la personne. Concrètement, au lieu de payer la 
                  totalité et d'attendre l'année suivante pour récupérer 50% sous forme de crédit d'impôt, vous ne payez que 
                  le reste à charge dès la prestation effectuée.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <p className="font-semibold text-foreground mb-2">💡 Exemple concret</p>
                  <p className="text-muted-foreground">
                    Pour une prestation de <strong className="text-foreground">25€/h</strong>, vous ne payez que{" "}
                    <strong className="text-primary">12,50€/h</strong> grâce à l'Avance Immédiate. Les 12,50€ restants 
                    sont directement déduits de votre crédit d'impôt.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Conditions d'accès
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span>Être domicilié fiscalement en France</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span>Disposer d'un numéro fiscal (figurant sur votre avis d'imposition)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span>Recourir à un organisme de services à la personne (OSP) éligible, comme Bikawo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span>Ne pas être employeur direct (le service s'applique en mode prestataire ou mandataire)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
              Comment ça fonctionne ?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Activation",
                  description: "Activez votre compte sur le site dédié de l'Urssaf à partir des informations transmises par Bikawo.",
                  icon: <ArrowRight className="w-5 h-5" />,
                },
                {
                  step: "2",
                  title: "Prestation réalisée",
                  description: "Bikawo émet une demande de paiement qui apparaît sur votre compte Avance Immédiate.",
                  icon: <Clock className="w-5 h-5" />,
                },
                {
                  step: "3",
                  title: "Validation (48h)",
                  description: "Vous disposez de 48 heures pour valider ou contester la demande de paiement sur votre compte.",
                  icon: <CheckCircle className="w-5 h-5" />,
                },
                {
                  step: "4",
                  title: "Paiement réduit",
                  description: "Vous ne payez que le reste à charge après déduction immédiate de votre crédit d'impôt de 50%.",
                  icon: <Shield className="w-5 h-5" />,
                },
              ].map((item) => (
                <div key={item.step} className="bg-card border border-border rounded-2xl p-6 space-y-4 relative">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Your contact */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-start gap-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <HelpCircle className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Une question ?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  En cas de question concernant l'Avance Immédiate, votre facturation ou vos prestations, 
                  votre <strong className="text-foreground">interlocuteur reste Bikawo</strong>, votre organisme 
                  de services à la personne. Notre équipe est à votre disposition pour vous accompagner dans 
                  l'activation et l'utilisation du service.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/contact">
                    <Button className="gap-2">
                      Nous contacter
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href="tel:+33609085390">
                    <Button variant="outline" className="gap-2">
                      📞 06 09 08 53 90
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax credit info */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Plafonds du crédit d'impôt
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Le crédit d'impôt pour les services à la personne est soumis à des plafonds annuels définis 
                par la réglementation fiscale. Consultez le site officiel des impôts pour connaître les 
                plafonds applicables à votre situation.
              </p>
              <a
                href="https://www.impots.gouv.fr/portail/particulier/emploi-domicile"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2 mt-4">
                  <ExternalLink className="w-5 h-5" />
                  Consulter les plafonds sur impots.gouv.fr
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
