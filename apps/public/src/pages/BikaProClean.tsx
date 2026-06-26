import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Building2, CheckCircle, Clock } from "lucide-react";
import serviceBusinessImage from "@/assets/service-business.jpg";
import { useNavigate } from "react-router-dom";

const BikaProClean = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Building2 className="w-10 h-10 text-white" />,
      title: "On est professionnels",
      description: "Intervenants formés aux environnements bureau, équipés de matériel certifié professionnel.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary",
    },
    {
      icon: <Clock className="w-10 h-10 text-white" />,
      title: "On est flexibles",
      description: "Interventions avant ouverture, après fermeture ou le week-end — zéro perturbation pour vos équipes.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent",
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-white" />,
      title: "On est fiables",
      description: "Prestataires vérifiés et assurés, contrat cadre, interlocuteur dédié et facturation centralisée.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Ménage bureaux entreprise Paris | Bika Pro Clean"
        description="Nettoyage professionnel de bureaux ≤100m², 100-200m² et grands espaces. Prestataires vérifiés, matériel certifié, contrat sur mesure. Devis sous 24h."
        keywords="nettoyage bureaux Paris, ménage professionnel PME, entretien locaux entreprise Île-de-France"
        url="/bika-pro-clean"
        structuredData={generateServiceStructuredData({
          name: "Bika Pro Clean — Entretien de bureaux",
          description: "Nettoyage professionnel de bureaux pour entreprises en Île-de-France.",
          url: "/bika-pro-clean",
          priceFrom: "25",
          priceAfterTax: "25€/h",
        })}
      />
      <Navbar />

      <ServicePageLayout
        title="Bika Pro Clean"
        subtitle="Entretien professionnel de vos bureaux"
        rating={5}
        reviewCount="300+ entreprises clientes"
        price="Dès 25€/h"
        heroImage={serviceBusinessImage}
        heroImageAlt="Ménage bureaux entreprise Bika Pro Clean"
        keyPoints={[
          "Intervenants formés environnements professionnels",
          "Matériel certifié professionnel fourni",
          "Contrat cadre et facturation centralisée",
        ]}
        primaryCTA="Demander un devis"
        secondaryCTA="Devenir intervenant"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid
          categoryKey="pro-clean"
          reserveLabel="Demander un devis"
          onReserveOverride={() => {
            navigate("/bika-pro#devis");
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        />
      </ServicePageLayout>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaProClean;
