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
      bgGradient: "bg-gradient-to-br from-cyan-50 to-blue-100",
      iconGradient: "bg-gradient-to-r from-cyan-500 to-blue-600"
    },
    {
      icon: <Home className="w-10 h-10 text-white" />,
      title: "On est pratique",
      description: "Services complets : ménage, repassage, petites réparations. Tout pour votre confort.",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-100",
      iconGradient: "bg-gradient-to-r from-green-500 to-emerald-600"
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-white" />,
      title: "On est fiable",
      description: "Intervenants sélectionnés, ponctualité garantie. Une maison parfaitement entretenue.",
      bgGradient: "bg-gradient-to-br from-indigo-50 to-purple-100",
      iconGradient: "bg-gradient-to-r from-indigo-500 to-purple-600"
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
        heroGradient="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700"
      >
        <ServiceSubgrid categoryKey="maison" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaMaison;