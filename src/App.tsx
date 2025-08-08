import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveRequestNotifications } from "@/components/LiveRequestNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EspacePersonnel from "./pages/EspacePersonnel";
import EspacePrestataire from "./pages/EspacePrestataire";
import NousRecrutons from "./pages/NousRecrutons";
import Admin from "./pages/Admin";
import { GestionDemandes } from "./pages/GestionDemandes";
import ContactPage from "./pages/Contact";
import ServicesPage from "./pages/Services";
import Aide from "./pages/Aide";
import AProposDeNous from "./pages/AProposDeNous";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AnalyticsSEO from "./pages/AnalyticsSEO";
import SocialMediaGuide from "./pages/SocialMediaGuide";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <LiveRequestNotifications />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/espace-personnel" element={<EspacePersonnel />} />
            <Route path="/espace-prestataire" element={<EspacePrestataire />} />
            <Route path="/nous-recrutons" element={<NousRecrutons />} />
            <Route path="/gestion-demandes" element={<GestionDemandes />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/a-propos-de-nous" element={<AProposDeNous />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/analytics-seo" element={<AnalyticsSEO />} />
            <Route path="/guide-reseaux-sociaux" element={<SocialMediaGuide />} />
            
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
