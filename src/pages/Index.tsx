import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesPackages from "@/components/ServicesPackages";
import Target from "@/components/Target";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ServicesPackages />
      <Target />
      <About />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
