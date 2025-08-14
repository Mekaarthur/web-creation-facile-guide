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
import AuthComplete from "./pages/AuthComplete";
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
import ConfigMessages from "./pages/ConfigMessages";
import CustomRequest from "./pages/CustomRequest";
import AdminJobApplications from "./pages/AdminJobApplications";
import AdminClientRequests from "./pages/AdminClientRequests";

// Admin Layout and Pages
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAlertes from "./pages/admin/Alertes";
import AdminKanban from "./pages/admin/Kanban";
import AdminUtilisateurs from "./pages/admin/Utilisateurs";
import AdminPrestataires from "./pages/admin/Prestataires";
import AdminModeration from "./pages/admin/Moderation";
import AdminMessagerie from "./pages/admin/Messagerie";
import AdminPaiements from "./pages/admin/Paiements";
import AdminPaniers from "./pages/admin/Paniers";

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
            <Route path="/auth/complete" element={<AuthComplete />} />
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
            <Route path="/config-messages" element={<ConfigMessages />} />
            <Route path="/demande-personnalisee" element={<CustomRequest />} />
            {/* Admin Routes with Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="alertes" element={<AdminAlertes />} />
              <Route path="kanban" element={<AdminKanban />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              <Route path="prestataires" element={<AdminPrestataires />} />
              <Route path="demandes" element={<AdminClientRequests />} />
              <Route path="candidatures" element={<AdminJobApplications />} />
              <Route path="moderation" element={<AdminModeration />} />
            <Route path="messagerie" element={<AdminMessagerie />} />
            <Route path="paniers" element={<AdminPaniers />} />
            <Route path="paiements" element={<AdminPaiements />} />
            <Route path="messages" element={<ConfigMessages />} />
              <Route path="zones" element={<div>Zones géographiques - En développement</div>} />
              <Route path="statistiques" element={<div>Statistiques - En développement</div>} />
              <Route path="parametres" element={<div>Paramètres - En développement</div>} />
            </Route>
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
