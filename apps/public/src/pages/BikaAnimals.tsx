import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Heart, Shield, Stethoscope } from "lucide-react";
import serviceAnimalsImage from "@/assets/service-animals.jpg";

const BikaAnimals = () => {
  const benefits = [
    {
      icon: <Heart className="w-10 h-10 text-white" />,
      title: "On est passionné",
      description: "Amoureux des animaux, nous prenons soin de vos compagnons comme s'ils étaient les nôtres.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <Shield className="w-10 h-10 text-white" />,
      title: "On est responsable",
      description: "Pet-sitters expérimentés et de confiance. Sécurité et bien-être de vos animaux garantis.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <Stethoscope className="w-10 h-10 text-white" />,
      title: "On est vigilant",
      description: "Suivi personnalisé, soins adaptés et attention particulière aux besoins de chaque animal.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Garde d'animaux & pet-sitting Paris | Bikawo"
        description="Dog-sitting, promenades, visites à domicile pour vos animaux. Pet-sitters passionnés et assurés en Île-de-France. Réservation en ligne, crédit d'impôt 50%."
        keywords="garde animaux Paris, pet-sitting, dog-sitting, promenade chien, Île-de-France"
        url="/bika-animals"
        structuredData={generateServiceStructuredData({
          name: "Garde d'animaux & pet-sitting — BikaAnimals",
          description: "Dog-sitting, promenades et soins à domicile pour vos animaux en Île-de-France.",
          url: "/bika-animals",
          priceFrom: "25",
          priceAfterTax: "12,50€/h"
        })}
      />
      <Navbar />

      <ServicePageLayout
        title="Garde d'animaux à domicile"
        subtitle="Pet-sitting et soins pour vos compagnons"
        rating={5}
        reviewCount="900+ avis vérifiés"
        price="Dès 25€/h"
        discountPrice="12,50€/h"
        heroImage={serviceAnimalsImage}
        heroImageAlt="Service garde d'animaux Bika Animals"
        keyPoints={[
          "Pet-sitters passionnés et expérimentés",
          "Soins personnalisés selon les besoins",
          "Garde à domicile ou promenades"
        ]}
        primaryCTA="Réserver une garde"
        secondaryCTA="Devenir pet-sitter"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="animals" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaAnimals;