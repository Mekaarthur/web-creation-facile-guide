import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Tarifs = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <Pricing />
        <FAQ />
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Tarifs;