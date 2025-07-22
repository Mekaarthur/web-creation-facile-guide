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
import ReferralProgram from "@/components/ReferralProgram";
import InnovativeFeatures from "@/components/InnovativeFeatures";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ServicesPackages />
      <div id="booking">
        <ServicesBooking />
      </div>
      <InnovativeFeatures />
      <About />
      <ReferralProgram />
      <Testimonials />
      <FAQ />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
