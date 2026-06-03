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
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

const HomeTutorial = lazy(() => import("@/components/tutorial/HomeTutorial").then(m => ({ default: m.HomeTutorial })));
const TutorialHelpButton = lazy(() => import("@/components/tutorial/HomeTutorial").then(m => ({ default: m.TutorialHelpButton })));
const FeedbackWidget = lazy(() => import("@/components/feedback/FeedbackWidget").then(m => ({ default: m.FeedbackWidget })));
const ConnectionIndicator = lazy(() => import("@/components/feedback/ConnectionIndicator").then(m => ({ default: m.ConnectionIndicator })));
import { NavigationBehaviors } from "@/components/NavigationBehaviors";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { PageLoadingBar } from "@/components/ui/PageLoadingBar";

// Critical - loaded immediately
import Index from "./pages/Index";

// Lazy load non-critical components
const LiveRequestNotifications = lazy(() => import("@/components/LiveRequestNotifications").then(m => ({ default: m.LiveRequestNotifications })));

// Auth pages - lazy loaded
const Auth = lazy(() => import("./components/EnhancedAuth"));
const ProviderAuth = lazy(() => import("./components/ProviderAuth"));
const AuthComplete = lazy(() => import("./pages/AuthComplete"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
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
const CGU = lazy(() => import("./pages/CGU"));
const BikaPro = lazy(() => import("./pages/BikaPro"));
const SubServicePage = lazy(() => import("./pages/SubService"));
const LocalServicePage = lazy(() => import("./pages/LocalServicePage"));

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
const InformationConsommateurs = lazy(() => import("./pages/InformationConsommateurs"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const AvanceImmediate = lazy(() => import("./pages/AvanceImmediate"));
const NotFound = lazy(() => import("./pages/NotFound"));

const BikawoCartDemo = lazy(() => import("./components/BikawoCartDemo"));
const AnalyticsSEO = lazy(() => import("./pages/AnalyticsSEO"));
const ConfigMessages = lazy(() => import("./pages/ConfigMessages"));

// Protected routes
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const ProtectedProviderRoute = lazy(() => import("./components/ProtectedProviderRoute"));

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
          <InstallPrompt />
          
          <Suspense fallback={null}><FeedbackWidget /></Suspense>
          <Suspense fallback={null}><ConnectionIndicator /></Suspense>
          <BrowserRouter>
            <CookieConsentBanner />
            <Suspense fallback={null}><HomeTutorial /></Suspense>
            <Suspense fallback={null}><TutorialHelpButton /></Suspense>
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
                {/* User spaces */}
                <Route path="/espace-personnel" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
                <Route path="/dashboard-client" element={<ProtectedRoute><EspacePersonnel /></ProtectedRoute>} />
                <Route path="/espace-prestataire" element={<ProtectedProviderRoute requireVerified><EspacePrestataire /></ProtectedProviderRoute>} />
                <Route path="/dashboard-prestataire" element={<ProtectedProviderRoute requireVerified><EspacePrestataire /></ProtectedProviderRoute>} />
                {/* Alias pour le retour Stripe Connect — doit pointer vers EspacePrestataire */}
                <Route path="/provider/dashboard" element={<ProtectedProviderRoute requireVerified><EspacePrestataire /></ProtectedProviderRoute>} />
                <Route path="/provider-onboarding" element={<ProtectedProviderRoute><ProviderOnboarding /></ProtectedProviderRoute>} />
                <Route path="/provider/zones" element={<ProtectedProviderRoute requireVerified><MyZones /></ProtectedProviderRoute>} />
                <Route path="/nous-recrutons" element={<ProviderSignup />} />
                <Route path="/candidature-prestataire" element={<ProviderSignup />} />
                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:category/:slug" element={<SubServicePage />} />
                <Route path="/services/:serviceSlug/:citySlug" element={<LocalServicePage />} />
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
                <Route path="/cgu" element={<CGU />} />
                <Route path="/information-consommateurs" element={<InformationConsommateurs />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                <Route path="/avance-immediate" element={<AvanceImmediate />} />
                <Route path="/panier-demo" element={<BikawoCartDemo />} />
                <Route path="/analytics-seo" element={<AnalyticsSEO />} />
                <Route path="/config-messages" element={<ConfigMessages />} />
                <Route path="/modern-admin/*" element={<Navigate to="/auth" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
