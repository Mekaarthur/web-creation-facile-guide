import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Shield, Heart, Calendar } from "lucide-react";
import serviceKidsImage from "@/assets/service-kids.jpg";
import { useTranslation } from "react-i18next";

const BikaKids = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <Shield className="w-10 h-10 text-white" />,
      title: t("bikaKids.benefits.0.title"),
      description: t("bikaKids.benefits.0.description"),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary",
    },
    {
      icon: <Heart className="w-10 h-10 text-white" />,
      title: t("bikaKids.benefits.1.title"),
      description: t("bikaKids.benefits.1.description"),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent",
    },
    {
      icon: <Calendar className="w-10 h-10 text-white" />,
      title: t("bikaKids.benefits.2.title"),
      description: t("bikaKids.benefits.2.description"),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Garde d'enfants à domicile Paris | Bikawo"
        description="Baby-sitter qualifiée, aide aux devoirs, activités créatives. Bikawo sélectionne vos intervenants en Île-de-France. Crédit d'impôt 50% — réservez en ligne."
        keywords="garde d'enfants à domicile Paris, baby-sitter, aide aux devoirs, Île-de-France, crédit d'impôt"
        url="/bika-kids"
        structuredData={generateServiceStructuredData({
          name: "Garde d'enfants à domicile — BikaKids",
          description:
            "Baby-sitter qualifiée, aide aux devoirs et activités créatives à domicile en Île-de-France.",
          url: "/bika-kids",
          priceFrom: "25",
          priceAfterTax: "12,50€/h",
        })}
      />
      <Navbar />

      <ServicePageLayout
        title={t("bikaKids.title")}
        subtitle={t("bikaKids.subtitle")}
        rating={5}
        reviewCount="1 800+ avis vérifiés"
        price="Dès 25€/h"
        discountPrice="12,50€/h"
        heroImage={serviceKidsImage}
        heroImageAlt="Service garde d'enfants Bika Kids"
        keyPoints={t("bikaKids.keyPoints", { returnObjects: true }) as string[]}
        primaryCTA={t("bikaKids.primaryCTA")}
        secondaryCTA={t("bikaKids.secondaryCTA")}
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="kids" />
      </ServicePageLayout>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaKids;
