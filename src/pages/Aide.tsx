import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

const Aide = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16 lg:pt-20">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Aide;