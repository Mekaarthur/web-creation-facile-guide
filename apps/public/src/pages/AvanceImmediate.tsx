import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, ArrowRight, FileText, CalendarDays, Clock, Info } from "lucide-react";
import { Link } from "react-router-dom";

const AvanceImmediate = () => {
  return (
    <>
      <Helmet>
        <title>Crédit d'impôt 50% pour vos services à domicile | Bikawo</title>
        <meta name="description" content="Bénéficiez du crédit d'impôt de 50% sur vos services à domicile Bikawo. Découvrez comment déclarer, les plafonds et l'attestation fiscale fournie par Bikawo." />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-16 lg:pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Avantage fiscal officiel — art. 199 sexdecies CGI
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Crédit d'impôt 50% pour{" "}
                <span className="text-primary">vos services à domicile</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                La moitié de vos dépenses en services à domicile éligibles vous est remboursée sous forme de
                crédit d'impôt — dans la limite de <strong className="text-foreground">6 000 € par an</strong>.
                Bikawo vous fournit l'attestation fiscale nécessaire.
              </p>
            </div>
          </div>
        </section>

        {/* Mécanisme du crédit d'impôt */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Comment fonctionne le crédit d'impôt ?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Le crédit d'impôt pour l'emploi d'un salarié à domicile (art. 199 sexdecies du CGI) vous
                  permet de récupérer <strong className="text-primary">50% des sommes versées</strong> pour
                  des services à la personne éligibles.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Contrairement à une réduction d'impôt, le crédit d'impôt est <strong className="text-foreground">remboursé
                  intégralement</strong> même si vous êtes non imposable. Vous payez 100% au moment de la prestation
                  et récupérez 50% lors de votre déclaration annuelle.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong className="text-foreground">Exemple :</strong> pour 1 000 € de services Bikawo
                    éligibles sur l'année, vous récupérez <strong className="text-primary">500 €</strong> après
                    votre déclaration de revenus.
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-foreground text-lg">💰 Plafonds annuels</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Plafond de base</span>
                    <span className="font-bold text-foreground">12 000 € <span className="font-normal text-muted-foreground">(6 000 € de crédit)</span></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">1ère année de recours aux SAP</span>
                    <span className="font-bold text-foreground">15 000 € <span className="font-normal text-muted-foreground">(7 500 €)</span></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Enfant à charge / +65 ans</span>
                    <span className="font-bold text-foreground">+1 500 € <span className="font-normal text-muted-foreground">par personne</span></span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Invalidité (carte ou APA)</span>
                    <span className="font-bold text-primary">20 000 € <span className="font-normal text-muted-foreground">(10 000 €)</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comment déclarer */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
              Comment déclarer ?
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                {
                  icon: FileText,
                  step: "1",
                  title: "Récupérez votre attestation fiscale Bikawo",
                  description: "Chaque année (disponible en mars), téléchargez votre attestation fiscale depuis l'onglet « Attestations » de votre espace personnel Bikawo. Ce document récapitule toutes vos dépenses en services éligibles sur l'année civile.",
                },
                {
                  icon: CalendarDays,
                  step: "2",
                  title: "Déclarez en avril",
                  description: "Lors de votre déclaration de revenus (formulaire 2042, case 7DB ou 7DF selon votre situation), reportez le montant total des sommes versées à Bikawo pour des services éligibles.",
                },
                {
                  icon: CheckCircle,
                  step: "3",
                  title: "Recevez votre crédit",
                  description: "L'administration fiscale calcule automatiquement votre crédit d'impôt (50% des sommes déclarées). Il vient en déduction de votre impôt ou vous est remboursé directement si votre impôt est insuffisant.",
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
            <div className="text-center mt-8">
              <Link to="/espace-personnel?tab=attestations">
                <Button size="lg" className="gap-2">
                  <FileText className="w-5 h-5" />
                  Accéder à mes attestations fiscales
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Services éligibles */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Services Bikawo éligibles</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Ménage & repassage",
                "Garde d'enfants",
                "Aide aux seniors",
                "Jardinage",
                "Aide administrative",
                "Assistance informatique",
                "Petit bricolage",
                "Préparation de repas",
                "Accompagnement véhicule",
              ].map((service) => (
                <div key={service} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{service}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              L'éligibilité de chaque service au crédit d'impôt est indiquée sur les fiches services.
              Votre attestation fiscale ne récapitule que les prestations éligibles.
            </p>
          </div>
        </section>

        {/* Avance immédiate — bientôt disponible */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-card border border-border rounded-2xl p-8 flex items-start gap-6">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 text-accent-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Avance immédiate — bientôt disponible</h2>
                  <span className="text-xs font-semibold bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">À venir</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  L'avance immédiate URSSAF permet de ne payer que 50% de la prestation directement au moment
                  du règlement, sans attendre la déclaration annuelle. Ce dispositif nécessite que le prestataire
                  de services soit enregistré comme mandataire URSSAF.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Bikawo travaille à l'intégration de l'avance immédiate URSSAF</strong> pour
                  vous permettre de bénéficier du crédit d'impôt directement au moment du paiement, sans démarche
                  supplémentaire de votre part.
                </p>
                <div className="flex items-start gap-2 bg-muted rounded-lg p-3 mt-2">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    En attendant cette fonctionnalité, vous bénéficiez du crédit d'impôt classique via votre
                    déclaration de revenus annuelle. Le montant récupéré est identique (50%).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lien impots.gouv.fr */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">En savoir plus</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Pour les plafonds détaillés et les conditions applicables à votre situation personnelle,
                consultez le site officiel de la Direction générale des Finances publiques.
              </p>
              <a
                href="https://www.impots.gouv.fr/portail/particulier/emploi-domicile"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="gap-2 mt-4">
                  <ExternalLink className="w-5 h-5" />
                  impots.gouv.fr — Emploi à domicile
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Prêt à profiter du crédit d'impôt ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Réservez vos services Bikawo et récupérez 50% de vos dépenses sur votre déclaration de revenus.
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
