import { lazy, Suspense } from "react";
import { AOBlockedRoute } from "@/components/AOBlockedRoute";
import { CPBlockedRoute } from "@/components/CPBlockedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminRoute = lazy(() => import("@/components/AdminRoute"));
const ModernAdminLayout = lazy(() => import("@/components/admin/ModernAdminLayout"));
const AuditReport = lazy(() => import("@/components/AuditReport"));
const GestionDemandes = lazy(() => import("@/pages/GestionDemandes").then(m => ({ default: m.GestionDemandes })));

// Admin pages (lazy-loaded)
const ModernAdminDashboard = lazy(() => import("@/pages/admin/ModernAdminDashboard"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminRealtime = lazy(() => import("@/pages/admin/Realtime"));
const AdminUtilisateurs = lazy(() => import("@/pages/admin/Utilisateurs"));
const AdminClients = lazy(() => import("@/pages/admin/Clients"));
const AdminProviders = lazy(() => import("@/pages/admin/Providers"));
const AdminApplications = lazy(() => import("@/pages/admin/Applications"));
const AdminBinomes = lazy(() => import("@/pages/admin/Binomes"));
const AdminOnboarding = lazy(() => import("@/pages/admin/Onboarding"));
const AdminMatching = lazy(() => import("@/pages/admin/Matching"));
const AdminMissions = lazy(() => import("@/pages/admin/Missions"));
const AdminReservations = lazy(() => import("@/pages/admin/Reservations"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const AdminInvoices = lazy(() => import("@/pages/admin/Invoices"));
const AdminMessages = lazy(() => import("@/pages/admin/Messages"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminAlerts = lazy(() => import("@/pages/admin/Alerts"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminReportsData = lazy(() => import("@/pages/admin/ReportsData"));
const AdminQuality = lazy(() => import("@/pages/admin/Quality"));
const AdminZones = lazy(() => import("@/pages/admin/Zones"));
const AdminMarque = lazy(() => import("@/pages/admin/Marque"));
const AdminCooptation = lazy(() => import("@/pages/admin/Cooptation"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const Monitoring = lazy(() => import("@/pages/admin/Monitoring"));
const AdminAnomalies = lazy(() => import("@/pages/admin/Anomalies"));
const TestsCritiques = lazy(() => import("@/pages/admin/TestsCritiques"));
const TestsEmails = lazy(() => import("@/pages/admin/TestsEmails"));
const AdminSecurity = lazy(() => import("@/pages/admin/Security"));
const AdminFinance = lazy(() => import("@/pages/admin/Finance"));
const AdminAvanceImmediate = lazy(() => import("@/pages/admin/AvanceImmediate"));
const AdminUrgences = lazy(() => import("@/pages/admin/Urgences"));
const AdminReclamations = lazy(() => import("@/pages/admin/Reclamations"));
const AdminAccessTracking = lazy(() => import("@/pages/admin/AdminAccessTracking"));
const RgpdDeletions = lazy(() => import("@/pages/admin/RgpdDeletions"));
const AdminPricing = lazy(() => import("@/pages/admin/Pricing"));
const AdminCustomRequests = lazy(() => import("@/pages/admin/Paniers"));
const AdminProviderManagement = lazy(() => import("@/pages/admin/ProviderManagement"));
const AdminRoles = lazy(() => import("@/pages/admin/AdminRoles"));
const AdminSuperAdmin = lazy(() => import("@/pages/admin/SuperAdmin"));
const AdminAgentsOperationnels = lazy(() => import("@/pages/admin/AgentsOperationnels"));
const AdminComptablesPartenaires = lazy(() => import("@/pages/admin/ComptablesPartenaires"));
const AdminSupportClients = lazy(() => import("@/pages/admin/SupportClients"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth */}
                <Route path="/login" element={<AdminLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Standalone admin pages */}
                <Route path="/gestion-demandes" element={<AdminRoute><GestionDemandes /></AdminRoute>} />
                <Route path="/audit-qualite" element={<AdminRoute><AuditReport /></AdminRoute>} />

                {/* Modern Admin — nested routes */}
                <Route path="/modern-admin" element={<AdminRoute><ModernAdminLayout /></AdminRoute>}>
                  <Route index element={<ModernAdminDashboard />} />
                  <Route path="dashboard" element={<ModernAdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="realtime" element={<AdminRealtime />} />
                  <Route path="utilisateurs" element={<CPBlockedRoute alsoBlockSC><AdminUtilisateurs /></CPBlockedRoute>} />
                  <Route path="clients" element={<CPBlockedRoute><AdminClients /></CPBlockedRoute>} />
                  <Route path="providers" element={<AOBlockedRoute alsoBlockSC><AdminProviders /></AOBlockedRoute>} />
                  <Route path="prestataires" element={<AOBlockedRoute alsoBlockSC><AdminProviders /></AOBlockedRoute>} />
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
                  <Route path="settings" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminSettings /></AOBlockedRoute>} />
                  <Route path="parametres" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminSettings /></AOBlockedRoute>} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="anomalies" element={<AdminAnomalies />} />
                  <Route path="tests-critiques" element={<TestsCritiques />} />
                  <Route path="tests-emails" element={<TestsEmails />} />
                  <Route path="audit" element={<AuditReport />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="securite" element={<AdminSecurity />} />
                  <Route path="finance" element={<AOBlockedRoute alsoBlockSC><AdminFinance /></AOBlockedRoute>} />
                  <Route path="avance-immediate" element={<AdminAvanceImmediate />} />
                  <Route path="urssaf-declarations" element={<AdminAvanceImmediate />} />
                  <Route path="urgences" element={<AdminUrgences />} />
                  <Route path="reclamations" element={<AdminReclamations />} />
                  <Route path="acces" element={<AdminAccessTracking />} />
                  <Route path="rgpd-deletions" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><RgpdDeletions /></AOBlockedRoute>} />
                  <Route path="pricing" element={<AOBlockedRoute alsoBlockSC><AdminPricing /></AOBlockedRoute>} />
                  <Route path="tarifs" element={<AOBlockedRoute alsoBlockSC><AdminPricing /></AOBlockedRoute>} />
                  <Route path="demandes" element={<AdminCustomRequests />} />
                  <Route path="provider-management" element={<AdminProviderManagement />} />
                  <Route path="roles" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminRoles /></AOBlockedRoute>} />
                  <Route path="super-admin" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminSuperAdmin /></AOBlockedRoute>} />
                  <Route path="agents-operationnels" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminAgentsOperationnels /></AOBlockedRoute>} />
                  <Route path="comptables-partenaires" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminComptablesPartenaires /></AOBlockedRoute>} />
                  <Route path="support-clients" element={<AOBlockedRoute alsoBlockCP alsoBlockSC><AdminSupportClients /></AOBlockedRoute>} />
                </Route>

                {/* Default: redirect to dashboard (or login if unauthenticated — AdminRoute handles that) */}
                <Route path="/" element={<Navigate to="/modern-admin" replace />} />
                <Route path="/admin" element={<Navigate to="/modern-admin" replace />} />
                <Route path="*" element={<Navigate to="/modern-admin" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
