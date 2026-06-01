import SEOComponent from "@/components/SEOComponent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

const Aide = () => {
  return (
    <div className="min-h-screen">
      <SEOComponent
        title="Aide & FAQ — Services à domicile | Bikawo"
        description="Questions sur le crédit d'impôt 50%, le fonctionnement de Bikawo ou la réservation ? Trouvez toutes les réponses dans notre centre d'aide."
        keywords="aide Bikawo, FAQ, crédit d'impôt services à domicile, questions fréquentes"
        url="/aide"
      />
      <Navbar />
      <div className="pt-16 lg:pt-20">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Aide;