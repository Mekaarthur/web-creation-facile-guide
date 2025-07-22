import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveRequestNotifications } from "@/components/LiveRequestNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import EspacePersonnel from "./pages/EspacePersonnel";
import EspacePrestataire from "./pages/EspacePrestataire";
import NousRecrutons from "./pages/NousRecrutons";
import Admin from "./pages/Admin";
import { GestionDemandes } from "./pages/GestionDemandes";
import ContactPage from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
