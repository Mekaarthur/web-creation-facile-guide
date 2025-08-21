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
import ProviderSignup from "./pages/ProviderSignup";
import AdminJobApplications from "./pages/AdminJobApplications";
import AdminClientRequests from "./pages/AdminClientRequests";
import BikaKids from "./pages/BikaKids";
import BikaMaison from "./pages/BikaMaison";
import BikaVie from "./pages/BikaVie";
import BikaTravel from "./pages/BikaTravel";
import BikaPlus from "./pages/BikaPlus";
import BikaAnimals from "./pages/BikaAnimals";
import BikaSeniors from "./pages/BikaSeniors";
import BikaPro from "./pages/BikaPro";

// Admin Layout and Pages
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAlertes from "./pages/admin/Alertes";
import AdminKanban from "./pages/admin/Kanban";
import AdminUtilisateurs from "./pages/admin/Utilisateurs";
import AdminPrestataires from "./pages/admin/Prestataires";
import AdminBinomes from "./pages/admin/Binomes";
import TestsEmails from "./pages/admin/TestsEmails";
import AdminModeration from "./pages/admin/Moderation";
import AdminMessagerie from "./pages/admin/Messagerie";
import AdminRemunerations from "./pages/admin/Remunerations";
import AdminPaiements from "./pages/admin/Paiements";
import AdminFactures from "./pages/admin/Factures";
import AdminPaniers from "./pages/admin/Paniers";
import AdminNotifications from "./pages/admin/Notifications";
import Payment from "./pages/Payment";

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
            <Route path="/email/verify" element={<AuthComplete />} />
            <Route path="/email/verify/:token" element={<AuthComplete />} />
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
            <Route path="/custom-request" element={<CustomRequest />} />
            <Route path="/candidature-prestataire" element={<ProviderSignup />} />
            <Route path="/bika-kids-ile-de-france" element={<BikaKids />} />
            <Route path="/bika-maison-ile-de-france" element={<BikaMaison />} />
            <Route path="/bika-vie-ile-de-france" element={<BikaVie />} />
            <Route path="/bika-travel-ile-de-france" element={<BikaTravel />} />
            <Route path="/bika-plus-ile-de-france" element={<BikaPlus />} />
             <Route path="/bika-animals-ile-de-france" element={<BikaAnimals />} />
             <Route path="/bika-seniors-ile-de-france" element={<BikaSeniors />} />
             <Route path="/bika-pro-ile-de-france" element={<BikaPro />} />
             <Route path="/payment" element={<Payment />} />
             {/* Admin Routes with Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="alertes" element={<AdminAlertes />} />
              <Route path="kanban" element={<AdminKanban />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              <Route path="prestataires" element={<AdminPrestataires />} />
              <Route path="binomes" element={<AdminBinomes />} />
              <Route path="tests-emails" element={<TestsEmails />} />
              <Route path="demandes" element={<AdminClientRequests />} />
              <Route path="candidatures" element={<AdminJobApplications />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="messagerie" element={<AdminMessagerie />} />
              <Route path="paniers" element={<AdminPaniers />} />
              <Route path="paiements" element={<AdminPaiements />} />
              <Route path="messages" element={<ConfigMessages />} />
              <Route path="notifications" element={<AdminNotifications />} />
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
