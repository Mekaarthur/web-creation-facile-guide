import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SolutionSection from "@/components/SolutionSection";
import FounderTestimonial from "@/components/FounderTestimonial";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import SEOComponent from "@/components/SEOComponent";
import SEOOptimization from "@/components/SEOOptimization";
import TrackingManager from "@/components/TrackingManager";
import RetargetingPixels from "@/components/RetargetingPixels";
import GoogleSuggestOptimizer from "@/components/GoogleSuggestOptimizer";
import { seoStructuredData } from "@/utils/seoData";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEOOptimization 
        title="Bikawo - Débordé(e) par le quotidien ? | Assistant Personnel Paris"
        description="★ Déléguer vos missions quotidiennes n'a jamais été aussi simple ! Garde enfants, aide seniors, courses, démarches admin. La charge mentale en moins, la sérénité en plus."
        keywords="débordé quotidien, déléguer missions, charge mentale, assistant personnel Paris, services domicile, garde enfants, aide seniors, sérénité famille"
      />
      <GoogleSuggestOptimizer />
      <TrackingManager />
      <RetargetingPixels 
        userType="visitor"
        serviceInterest={["delegation-taches", "charge-mentale", "aide-quotidienne"]}
      />
      <SEOComponent 
        title="Bikawo - La charge mentale en moins, la sérénité en plus"
        description="Créé par une maman qui comprend. Bikawo vous libère de la charge mentale avec des services combinés : garde enfants, aide seniors, courses, démarches admin. Votre assistant personnel au quotidien."
        keywords="charge mentale, délégation tâches, assistant personnel, maman entrepreneur, services famille, sérénité quotidien, aide domicile"
        structuredData={seoStructuredData.organization}
      />
      
      <Navbar />
      <Hero />
      <SolutionSection />
      <FounderTestimonial />
      <FinalCTA />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
