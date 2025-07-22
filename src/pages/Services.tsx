import Navbar from "@/components/Navbar";
import ServicesPackages from "@/components/ServicesPackages";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <ServicesPackages />
      </div>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default ServicesPage;