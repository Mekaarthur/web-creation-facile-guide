import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Home, Sparkles, CheckCircle } from "lucide-react";
import serviceMaisonImage from "@/assets/service-maison.jpg";

const BikaMaison = () => {
  const benefits = [
    {
      icon: <Sparkles className="w-10 h-10 text-white" />,
      title: "On est méticuleux",
      description: "Ménage et entretien irréprochables avec attention aux détails. Votre maison comme neuve.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <Home className="w-10 h-10 text-white" />,
      title: "On est pratique",
      description: "Services complets : ménage, repassage, petites réparations. Tout pour votre confort.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-white" />,
      title: "On est fiable",
      description: "Intervenants sélectionnés, ponctualité garantie. Une maison parfaitement entretenue.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Services maison à domicile"
        subtitle="Ménage, repassage et entretien"
        rating={5}
        reviewCount="2 500+ avis vérifiés"
        price="Dès 15€/h"
        discountPrice="7,50€/h"
        heroImage={serviceMaisonImage}
        heroImageAlt="Services maison Bika Maison"
        keyPoints={[
          "Ménage et entretien professionnels",
          "Matériel et produits fournis",
          "Services flexibles et personnalisés"
        ]}
        primaryCTA="Réserver un service"
        secondaryCTA="Devenir intervenant"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="maison" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaMaison;