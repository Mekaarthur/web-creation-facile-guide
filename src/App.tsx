import { lazy, Suspense } from "react";
import { MobileStatusBar } from "@/components/MobileStatusBar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./hooks/useAuth";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { HomeTutorial, TutorialHelpButton } from "@/components/tutorial/HomeTutorial";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { ConnectionIndicator } from "@/components/feedback/ConnectionIndicator";
import { NavigationBehaviors } from "@/components/NavigationBehaviors";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { PageLoadingBar } from "@/components/ui/PageLoadingBar";

// Critical - loaded immediately
import Index from "./pages/Index";

// Lazy load non-critical components
const LiveRequestNotifications = lazy(() => import("@/components/LiveRequestNotifications").then(m => ({ default: m.LiveRequestNotifications })));

// Auth pages - lazy loaded
const Auth = lazy(() => import("./pages/Auth"));
const ProviderAuth = lazy(() => import("./pages/ProviderAuth"));
const AuthComplete = lazy(() => import("./pages/AuthComplete"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// User pages - lazy loaded
const EspacePersonnel = lazy(() => import("./pages/EspacePersonnel"));
const EspacePrestataire = lazy(() => import("./pages/EspacePrestataire"));
const MyZones = lazy(() => import("./pages/provider/MyZones"));
const ProviderOnboarding = lazy(() => import("./pages/provider/Onboarding"));
const ProviderSignup = lazy(() => import("./pages/ProviderSignup"));

// Service pages - lazy loaded
const ServicesPage = lazy(() => import("./pages/Services"));
const BikaKids = lazy(() => import("./pages/BikaKids"));
const BikaMaison = lazy(() => import("./pages/BikaMaison"));
const BikaVie = lazy(() => import("./pages/BikaVie"));
const BikaTravel = lazy(() => import("./pages/BikaTravel"));
const BikaPlus = lazy(() => import("./pages/BikaPlus"));
const BikaAnimals = lazy(() => import("./pages/BikaAnimals"));
const BikaSeniors = lazy(() => import("./pages/BikaSeniors"));
const BikaPro = lazy(() => import("./pages/BikaPro"));
const SubServicePage = lazy(() => import("./pages/SubService"));

// Booking & Payment - lazy loaded
const CartPage = lazy(() => import("./pages/Cart"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const Reservation = lazy(() => import("./pages/Reservation"));
const ReservationConfirmee = lazy(() => import("./pages/ReservationConfirmee"));
const CustomRequest = lazy(() => import("./pages/CustomRequest"));

// Content pages - lazy loaded
const ContactPage = lazy(() => import("./pages/Contact"));
const Aide = lazy(() => import("./pages/Aide"));
const AProposDeNous = lazy(() => import("./pages/AProposDeNous"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages - lazy loaded (heavy)
const Admin = lazy(() => import("./pages/Admin"));
const GestionDemandes = lazy(() => import("./pages/GestionDemandes").then(m => ({ default: m.GestionDemandes })));
const AdminClientRequests = lazy(() => import("./pages/AdminClientRequests"));
const ModernAdminDashboard = lazy(() => import("./pages/admin/ModernAdminDashboard"));
const ModernAdminLayout = lazy(() => import("./components/admin/ModernAdminLayout"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminRealtime = lazy(() => import("./pages/admin/Realtime"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminProviders = lazy(() => import("./pages/admin/Providers"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminMissions = lazy(() => import("./pages/admin/Missions"));
const AdminReservations = lazy(() => import("./pages/admin/Reservations"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminInvoices = lazy(() => import("./pages/admin/Invoices"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminAlerts = lazy(() => import("./pages/admin/Alerts"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminQuality = lazy(() => import("./pages/admin/Quality"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminReportsData = lazy(() => import("./pages/admin/ReportsData"));
const AdminOnboarding = lazy(() => import("./pages/admin/Onboarding"));
const AdminMatching = lazy(() => import("./pages/admin/Matching"));
const AdminBinomes = lazy(() => import("./pages/admin/Binomes"));
const AdminZones = lazy(() => import("./pages/admin/Zones"));
const AdminMarque = lazy(() => import("./pages/admin/Marque"));
const AdminCooptation = lazy(() => import("./pages/admin/Cooptation"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminUtilisateurs = lazy(() => import("./pages/admin/Utilisateurs"));
const TestsCritiques = lazy(() => import("./pages/admin/TestsCritiques"));
const TestsEmails = lazy(() => import("./pages/admin/TestsEmails"));
const Monitoring = lazy(() => import("./pages/admin/Monitoring"));
const AdminSecurity = lazy(() => import("./pages/admin/Security"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));
const AdminUrgences = lazy(() => import("./pages/admin/Urgences"));
const AdminBrand = lazy(() => import("./pages/admin/Brand"));
const AuditReport = lazy(() => import("./components/AuditReport"));
const BikawoCartDemo = lazy(() => import("./components/BikawoCartDemo"));
const AnalyticsSEO = lazy(() => import("./pages/AnalyticsSEO"));
const ConfigMessages = lazy(() => import("./pages/ConfigMessages"));

// Protected routes
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const ProtectedProviderRoute = lazy(() => import("./components/ProtectedProviderRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));

const queryClient = new QueryClient();

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <MobileStatusBar />
          <OfflineBanner />
          <Toaster />
          <Sonner />
          <CookieConsentBanner />
          <InstallPrompt />
          <UpdatePrompt />
          <FeedbackWidget />
          <ConnectionIndicator />
          <BrowserRouter>
            <HomeTutorial />
            <TutorialHelpButton />
            <PageLoadingBar />
            <NavigationBehaviors />
            <KeyboardShortcuts />
            <Suspense fallback={null}>
              <LiveRequestNotifications />
            </Suspense>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Critical - no lazy load */}
                <Route path="/" element={<Index />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/provider" element={<ProviderAuth />} />
                <Route path="/auth/complete" element={<AuthComplete />} />
                <Route path="/email/verify" element={<AuthComplete />} />
                <Route path="/email/verify/:token" element={<AuthComplete />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* User spaces */}
                <Route path="/espace-personnel" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
                <Route path="/dashboard-client" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
                <Route path="/espace-prestataire" element={<ProtectedProviderRoute><EspacePrestataire /></ProtectedProviderRoute>} />
                <Route path="/dashboard-prestataire" element={<ProtectedProviderRoute><EspacePrestataire /></ProtectedProviderRoute>} />
                <Route path="/provider-onboarding" element={<ProtectedProviderRoute><ProviderOnboarding /></ProtectedProviderRoute>} />
                <Route path="/provider/zones" element={<ProtectedProviderRoute><MyZones /></ProtectedProviderRoute>} />
                <Route path="/nous-recrutons" element={<ProviderSignup />} />
                <Route path="/candidature-prestataire" element={<ProviderSignup />} />
                <Route path="/gestion-demandes" element={<GestionDemandes />} />
                
                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:category/:slug" element={<SubServicePage />} />
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
                
                {/* Booking & Payment */}
                <Route path="/panier" element={<CartPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/reservation" element={<Reservation />} />
                <Route path="/reservation-confirmee" element={<ReservationConfirmee />} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-canceled" element={<PaymentCanceled />} />
                <Route path="/demande-personnalisee" element={<CustomRequest />} />
                <Route path="/custom-request" element={<CustomRequest />} />
                
                {/* Content pages */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/aide" element={<Aide />} />
                <Route path="/a-propos-de-nous" element={<AProposDeNous />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/politique-cookies" element={<CookiePolicy />} />
                <Route path="/panier-demo" element={<BikawoCartDemo />} />
                <Route path="/analytics-seo" element={<AnalyticsSEO />} />
                <Route path="/config-messages" element={<ConfigMessages />} />
                <Route path="/audit-qualite" element={<AdminRoute><AuditReport /></AdminRoute>} />
                
                {/* Admin redirects */}
                <Route path="/admin" element={<Navigate to="/modern-admin" replace />} />
                <Route path="/admin/*" element={<Navigate to="/modern-admin" replace />} />
                
                {/* Modern Admin Routes */}
                <Route path="/modern-admin" element={<AdminRoute><ModernAdminLayout /></AdminRoute>}>
                  <Route index element={<ModernAdminDashboard />} />
                  <Route path="dashboard" element={<ModernAdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="realtime" element={<AdminRealtime />} />
                  <Route path="utilisateurs" element={<AdminUtilisateurs />} />
                  <Route path="clients" element={<AdminClients />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="prestataires" element={<AdminProviders />} />
                  <Route path="applications" element={<AdminApplications />} />
                  <Route path="candidatures" element={<AdminApplications />} />
                  <Route path="binomes" element={<AdminBinomes />} />
                  <Route path="onboarding" element={<AdminOnboarding />} />
                  <Route path="matching" element={<AdminMatching />} />
                  <Route path="missions" element={<AdminMissions />} />
                  <Route path="reservations" element={<AdminReservations />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="paiements" element={<AdminPayments />} />
                  <Route path="invoices" element={<AdminInvoices />} />
                  <Route path="factures" element={<AdminInvoices />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                  <Route path="alertes" element={<AdminAlerts />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="rapports" element={<AdminReports />} />
                  <Route path="reports-data" element={<AdminReportsData />} />
                  <Route path="quality" element={<AdminQuality />} />
                  <Route path="zones" element={<AdminZones />} />
                  <Route path="marque" element={<AdminMarque />} />
                  <Route path="cooptation" element={<AdminCooptation />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="parametres" element={<AdminSettings />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="tests-critiques" element={<TestsCritiques />} />
                  <Route path="tests-emails" element={<TestsEmails />} />
                  <Route path="audit" element={<AuditReport />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="securite" element={<AdminSecurity />} />
                  <Route path="finance" element={<AdminFinance />} />
                  <Route path="urgences" element={<AdminUrgences />} />
                  <Route path="brand" element={<AdminBrand />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
