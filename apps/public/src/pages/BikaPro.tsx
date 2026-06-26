import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import EnterpriseQuoteForm from "@/components/pro/EnterpriseQuoteForm";
import { Building2, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import serviceBusinessImage from "@/assets/service-business.jpg";
import serviceBusinessAdmin from "@/assets/service-business-admin.jpg";

const CATEGORIES = [
  {
    key: "pro-clean",
    href: "/bika-pro-clean",
    icon: <Building2 className="w-10 h-10 text-primary" />,
    title: "Bika Pro Clean",
    subtitle: "Entretien de bureaux",
    description: "Ménage professionnel pour bureaux ≤100m², 100-200m² et grands espaces sur devis. Matériel certifié inclus en option.",
    price: "Dès 25€/h",
    image: serviceBusinessImage,
  },
  {
    key: "pro-admin",
    href: "/bika-pro-admin",
    icon: <Briefcase className="w-10 h-10 text-primary" />,
    title: "Bika Pro Admin",
    subtitle: "Services administratifs",
    description: "Support administratif, assistance dirigeants, conciergerie et permanence téléphonique pour PME et grandes entreprises.",
    price: "Dès 30€/h",
    image: serviceBusinessAdmin,
  },
];

const ETAPES = [
  { num: "01", title: "Devis en ligne", desc: "Formulaire ci-dessous — 2 minutes." },
  { num: "02", title: "Réponse sous 24h", desc: "Notre équipe chiffre votre besoin." },
  { num: "03", title: "Signature contrat", desc: "Contrat cadre + planning attribué." },
  { num: "04", title: "Première intervention", desc: "Démarrage sous 48h ouvrées." },
];

const BikaPro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Bikawo Pro — Services d'entretien et administratifs pour entreprises"
        description="Nettoyage de bureaux et assistance administrative pour PME et grandes entreprises en Île-de-France. Devis sous 24h, contrat sur mesure."
        keywords="nettoyage bureaux entreprise Paris, ménage professionnel PME, assistance administrative Île-de-France"
        url="/bika-pro"
        structuredData={generateServiceStructuredData({
          name: "Bikawo Pro — Services entreprises",
          description: "Entretien de bureaux et services administratifs pour entreprises en Île-de-France.",
          url: "/bika-pro",
          priceFrom: "25",
          priceAfterTax: "25€/h"
        })}
      />
      <Navbar />

      <main className="pt-16">
        {/* Hero */}
        <section className="relative bg-gradient-hero py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary-foreground rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="container mx-auto px-4 relative text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4">
              Bikawo Pro
            </h1>
            <p className="text-xl lg:text-2xl text-primary-foreground/90 font-medium mb-6">
              Services exclusivement dédiés aux entreprises
            </p>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Entretien de bureaux et assistance administrative — prestataires vérifiés,
              contrat sur mesure, devis sous 24h.
            </p>
            <button
              onClick={() => document.getElementById("devis")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 hover:scale-105"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* 2 cartes catégories */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
              Choisissez votre service
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Deux pôles spécialisés, une équipe dédiée pour chaque besoin.
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {CATEGORIES.map((cat) => (
                <Card
                  key={cat.key}
                  className="group border-0 bg-gradient-subtle hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(cat.href)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm font-medium opacity-90">{cat.subtitle}</p>
                      <p className="text-2xl font-bold">{cat.title}</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4 leading-relaxed">{cat.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{cat.price}</span>
                      <button
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(cat.href); }}
                      >
                        Voir les services
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {ETAPES.map((e) => (
                <div key={e.num} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl
                    flex items-center justify-center mx-auto mb-4">
                    {e.num}
                  </div>
                  <h3 className="font-semibold mb-2">{e.title}</h3>
                  <p className="text-sm text-muted-foreground">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulaire devis */}
        <section id="devis" className="py-16 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Demandez votre devis gratuit</h2>
            <p className="text-muted-foreground text-center mb-10">
              Réponse garantie sous 24h ouvrées. Aucun engagement.
            </p>
            <EnterpriseQuoteForm />
          </div>
        </section>
      </main>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaPro;
