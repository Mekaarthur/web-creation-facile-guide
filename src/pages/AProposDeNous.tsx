import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";
import SEOOptimization from "@/components/SEOOptimization";

const AProposDeNous = () => {
  return (
    <div className="min-h-screen">
      <SEOOptimization
        title="À propos de Bikawo | Plateforme de services à domicile Paris"
        description="Découvrez l'histoire de Bikawo, organisme SAP déclaré, créé pour alléger la charge mentale des familles parisiennes. Garde d'enfants, aide seniors, ménage, courses."
        keywords="à propos Bikawo, histoire Bikawo, services à la personne Paris, SAP déclaré, charge mentale famille"
      />
      <Navbar />
      <div className="pt-16 lg:pt-20">
        <About />
      </div>
      <Footer />
    </div>
  );
};

export default AProposDeNous;