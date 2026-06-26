import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Briefcase, Users, Zap } from "lucide-react";
import serviceBusinessAdmin from "@/assets/service-business-admin.jpg";
import { useNavigate } from "react-router-dom";

const BikaProAdmin = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Briefcase className="w-10 h-10 text-white" />,
      title: "On est expérimentés",
      description: "Assistants qualifiés en gestion administrative, habitués aux environnements PME et grands groupes.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary",
    },
    {
      icon: <Users className="w-10 h-10 text-white" />,
      title: "On est adaptables",
      description: "Solutions sur mesure : support ponctuel, contrat récurrent ou remplacement de poste.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent",
    },
    {
      icon: <Zap className="w-10 h-10 text-white" />,
      title: "On est réactifs",
      description: "Devis sous 24h, premier intervenant opérationnel sous 48h ouvrées après signature.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Assistance administrative entreprises Paris | Bika Pro Admin"
        description="Support administratif, assistance dirigeants et conciergerie d'entreprise pour PME et grands groupes en Île-de-France. Devis sous 24h."
        keywords="assistance administrative entreprise Paris, support administratif PME, conciergerie entreprise Île-de-France"
        url="/bika-pro-admin"
        structuredData={generateServiceStructuredData({
          name: "Bika Pro Admin — Services administratifs entreprises",
          description: "Assistance administrative et conciergerie pour entreprises en Île-de-France.",
          url: "/bika-pro-admin",
          priceFrom: "30",
          priceAfterTax: "30€/h",
        })}
      />
      <Navbar />

      <ServicePageLayout
        title="Bika Pro Admin"
        subtitle="Assistance administrative pour entreprises"
        rating={5}
        reviewCount="250+ entreprises clientes"
        price="Dès 30€/h"
        heroImage={serviceBusinessAdmin}
        heroImageAlt="Assistance administrative Bika Pro Admin"
        keyPoints={[
          "Assistants qualifiés en gestion administrative",
          "Support ponctuel ou contrat récurrent",
          "Interface avec partenaires et clients",
        ]}
        primaryCTA="Demander un devis"
        secondaryCTA="Devenir intervenant"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid
          categoryKey="pro-admin"
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

export default BikaProAdmin;
