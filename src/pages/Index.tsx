import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesPackages from "@/components/ServicesPackages";
import ServicesBooking from "@/components/ServicesBooking";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ServicesPackages />
      <ServicesBooking />
      <About />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
