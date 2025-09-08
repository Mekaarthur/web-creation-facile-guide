import Navbar from "@/components/Navbar";
import ServicesGrid from "@/components/ServicesGrid";
import ServicesPackages from "@/components/ServicesPackages";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import SEOComponent from "@/components/SEOComponent";

const ServicesPage = () => {

  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Services BIKAWO - Tous nos services"
        description="Parcourez tous les services BIKAWO, harmonisés avec l'accueil et la page Services."
        keywords="services BIKAWO, bika kids, bika maison, bika seniors, bika travel, bika pro, bika plus"
      />
      <Navbar />
      <div className="pt-20 bg-background">
        {/* Header de la section */}
        <div className="text-center space-y-4 py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Nos Services
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                BIKAWO
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos solutions personnalisées pour vous accompagner au quotidien
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ServicesGrid />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ServicesPackages />
        </div>
      </div>
      
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default ServicesPage;