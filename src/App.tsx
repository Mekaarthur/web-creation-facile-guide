import { MobileStatusBar } from "@/components/MobileStatusBar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveRequestNotifications } from "@/components/LiveRequestNotifications";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProviderAuth from "./pages/ProviderAuth";
import AuthComplete from "./pages/AuthComplete";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
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
import Reservation from "./pages/Reservation";
import ReservationConfirmee from "./pages/ReservationConfirmee";
import SubServicePage from "./pages/SubService";
import CartPage from "./pages/Cart";
import PaymentSuccess from "./pages/PaymentSuccess";
import AdminLogin from "./pages/AdminLogin";

// Admin Layout and Pages
import { AdminLayout } from "./components/admin/layout/AdminLayout";
import ModernAdminDashboard from "./pages/admin/ModernAdminDashboard";
import AdminAlertes from "./pages/admin/Alertes";
import AdminKanban from "./pages/admin/Kanban";
import AdminUtilisateurs from "./pages/admin/Utilisateurs";
import AdminPrestataires from "./pages/admin/Prestataires";
import AdminAssignment from "./pages/admin/Assignment";
import AdminFinance from "./pages/admin/Finance";
import AdminBrand from "./pages/admin/Brand";
import AdminTools from "./pages/admin/Tools";
import AdminModeration from "./pages/admin/Moderation";
import AdminBinomes from "./pages/admin/Binomes";
import TestsEmails from "./pages/admin/TestsEmails";
import Monitoring from "./pages/admin/Monitoring";
import AdminMessagerie from "./pages/admin/Messagerie";
import AdminRemunerations from "./pages/admin/Remunerations";
import AdminPaiements from "./pages/admin/Paiements";
import AdminFactures from "./pages/admin/Factures";
import AdminPaniers from "./pages/admin/Paniers";
import BikawoCartDemo from "./components/BikawoCartDemo";
import AdminNotifications from "./pages/admin/Notifications";
import Payment from "./pages/Payment";

import AdminZones from "./pages/admin/Zones";
import AdminParametres from "./pages/admin/Parametres";
import AdminMarque from "./pages/admin/Marque";
import TestsSystems from "./pages/admin/TestsSystems";

// Modern Admin Components
import ModernAdminLayout from "./components/admin/ModernAdminLayout";

// Modern Admin Pages
import AdminAnalytics from "./pages/admin/Analytics";
import AdminRealtime from "./pages/admin/Realtime";
import AdminClients from "./pages/admin/Clients";
import AdminProviders from "./pages/admin/Providers";
import AdminApplications from "./pages/admin/Applications";
import AdminMissions from "./pages/admin/Missions";
import AdminReservations from "./pages/admin/Reservations";
import AdminPayments from "./pages/admin/Payments";
import AdminInvoices from "./pages/admin/Invoices";
import AdminMessages from "./pages/admin/Messages";
import AdminReviews from "./pages/admin/Reviews";
import AdminAlerts from "./pages/admin/Alerts";
import AdminReports from "./pages/admin/Reports";
import AdminQuality from "./pages/admin/Quality";
import AdminSettings from "./pages/admin/Settings";
import AdminReportsData from "./pages/admin/ReportsData";
import AdminOnboarding from "./pages/admin/Onboarding";
import AdminMatching from "./pages/admin/Matching";
import TestsCritiques from "./pages/admin/TestsCritiques";
import ProviderOnboarding from "./pages/provider/Onboarding";
import AdminCooptation from "./pages/admin/Cooptation";
import AdminRoles from "./pages/admin/AdminRoles";

import NotFound from "./pages/NotFound";
import AuditReport from "./components/AuditReport";

import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedProviderRoute from "./components/ProtectedProviderRoute";
import AdminRoute from "./components/AdminRoute";
import Communications from "./pages/admin/Communications";
import Urgences from "./pages/admin/Urgences";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
        <MobileStatusBar />
        <Toaster />
        <Sonner />
        <LiveRequestNotifications />
        <CookieConsentBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/provider" element={<ProviderAuth />} />
            <Route path="/auth/complete" element={<AuthComplete />} />
            <Route path="/email/verify" element={<AuthComplete />} />
            <Route path="/email/verify/:token" element={<AuthComplete />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            {/* Route de connexion admin dédiée - sécurisée par RLS */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/espace-personnel" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
            <Route path="/dashboard-client" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
            <Route path="/espace-prestataire" element={<ProtectedProviderRoute><EspacePrestataire /></ProtectedProviderRoute>} />
            <Route path="/dashboard-prestataire" element={<ProtectedProviderRoute><EspacePrestataire /></ProtectedProviderRoute>} />
            <Route path="/provider-onboarding" element={<ProtectedProviderRoute><ProviderOnboarding /></ProtectedProviderRoute>} />
            <Route path="/nous-recrutons" element={<NousRecrutons />} />
            <Route path="/gestion-demandes" element={<GestionDemandes />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:category/:slug" element={<SubServicePage />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/panier-demo" element={<BikawoCartDemo />} />
            <Route path="/a-propos-de-nous" element={<AProposDeNous />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/analytics-seo" element={<AnalyticsSEO />} />
            <Route path="/config-messages" element={<ConfigMessages />} />
            <Route path="/demande-personnalisee" element={<CustomRequest />} />
            <Route path="/custom-request" element={<CustomRequest />} />
            <Route path="/candidature-prestataire" element={<ProviderSignup />} />
            <Route path="/bika-kids" element={<BikaKids />} />
            <Route path="/bika-maison" element={<BikaMaison />} />
            <Route path="/bika-vie" element={<BikaVie />} />
            <Route path="/bika-travel" element={<BikaTravel />} />
            <Route path="/bika-plus" element={<BikaPlus />} />
            <Route path="/bika-animals" element={<BikaAnimals />} />
            <Route path="/bika-seniors" element={<BikaSeniors />} />
            <Route path="/bika-pro" element={<BikaPro />} />
            <Route path="/bika-kids-ile-de-france" element={<BikaKids />} />
            <Route path="/bika-maison-ile-de-france" element={<BikaMaison />} />
            <Route path="/bika-vie-ile-de-france" element={<BikaVie />} />
            <Route path="/bika-travel-ile-de-france" element={<BikaTravel />} />
            <Route path="/bika-plus-ile-de-france" element={<BikaPlus />} />
            <Route path="/bika-animals-ile-de-france" element={<BikaAnimals />} />
            <Route path="/bika-seniors-ile-de-france" element={<BikaSeniors />} />
            <Route path="/bika-pro-ile-de-france" element={<BikaPro />} />
             <Route path="/reservation" element={<Reservation />} />
             <Route path="/reservation-confirmee" element={<ReservationConfirmee />} />
             <Route path="/politique-cookies" element={<CookiePolicy />} />
             <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
             <Route path="/audit-qualite" element={<AdminRoute><AuditReport /></AdminRoute>} />
             {/* Admin Routes with Layout */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<ModernAdminDashboard />} />
                <Route path="dashboard" element={<ModernAdminDashboard />} />
                <Route path="alertes" element={<AdminAlertes />} />
                <Route path="kanban" element={<AdminKanban />} />
                <Route path="utilisateurs" element={<AdminUtilisateurs />} />
                <Route path="clients" element={<AdminClients />} />
                <Route path="prestataires" element={<AdminPrestataires />} />
              <Route path="binomes" element={<AdminBinomes />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="tests-emails" element={<TestsEmails />} />
               <Route path="demandes" element={<AdminClientRequests />} />
               <Route path="candidatures" element={<AdminJobApplications />} />
               <Route path="messagerie" element={<AdminMessagerie />} />
              <Route path="paniers" element={<AdminPaniers />} />
              <Route path="paiements" element={<AdminPaiements />} />
              <Route path="messages" element={<ConfigMessages />} />
              <Route path="notifications" element={<AdminNotifications />} />
               <Route path="zones" element={<AdminZones />} />
               <Route path="parametres" element={<AdminParametres />} />
               <Route path="marque" element={<AdminMarque />} />
               <Route path="factures" element={<AdminFactures />} />
               <Route path="remunerations" element={<AdminRemunerations />} />
               <Route path="tests-systems" element={<TestsSystems />} />
                <Route path="assignation" element={<AdminAssignment />} />
                <Route path="assignations" element={<AdminAssignment />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="finances" element={<AdminFinance />} />
                <Route path="cooptation" element={<AdminCooptation />} />
               <Route path="analytics" element={<AdminAnalytics />} />
               <Route path="statistiques" element={<AdminAnalytics />} />
               <Route path="communications" element={<AdminRoute><Communications /></AdminRoute>} />
               <Route path="urgences" element={<AdminRoute><Urgences /></AdminRoute>} />
               <Route path="rapports" element={<AdminReports />} />
               <Route path="outils" element={<AdminTools />} />
               <Route path="audit" element={<AuditReport />} />
               <Route path="roles" element={<AdminRoles />} />
            </Route>
            
            {/* Modern Admin Routes */}
            <Route path="/modern-admin" element={<AdminRoute><ModernAdminLayout /></AdminRoute>}>
              <Route index element={<ModernAdminDashboard />} />
              <Route path="dashboard" element={<ModernAdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="realtime" element={<AdminRealtime />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="onboarding" element={<AdminOnboarding />} />
              <Route path="matching" element={<AdminMatching />} />
              <Route path="tests-critiques" element={<TestsCritiques />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="binomes" element={<AdminBinomes />} />
              <Route path="missions" element={<AdminMissions />} />
              <Route path="reservations" element={<AdminReservations />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="cooptation" element={<AdminCooptation />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="quality" element={<AdminQuality />} />
              <Route path="zones" element={<AdminZones />} />
              <Route path="marque" element={<AdminMarque />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="parametres" element={<AdminSettings />} />
              <Route path="reports-data" element={<AdminReportsData />} />
              <Route path="audit" element={<AuditReport />} />
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
