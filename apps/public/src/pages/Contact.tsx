import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import SEOOptimization from "@/components/SEOOptimization";

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <SEOOptimization
        title="Contact - Bikawo | Services à domicile Paris"
        description="Contactez Bikawo pour vos services à domicile : garde d'enfants, aide seniors, préparation culinaire. Appelez le 06 09 08 53 90 ou écrivez à contact@bikawo.com."
        keywords="contact Bikawo, services domicile Paris, aide à domicile, téléphone Bikawo"
      />
      <Navbar />
      <div className="pt-16 lg:pt-20">
        <Contact />
      </div>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default ContactPage;