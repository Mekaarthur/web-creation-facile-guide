import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Lock,
  LayoutDashboard,
  Receipt,
  PiggyBank
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Auth from './Auth';
import EnhancedClientDashboard from '@/components/EnhancedClientDashboard';
import ModernInvoiceManagement from '@/components/ModernInvoiceManagement';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { RewardsSection } from '@/components/RewardsSection';
import ReferralProgram from '@/components/ReferralProgram';
import ProfileUpdateForm from '@/components/ProfileUpdateForm';
import AttestationsManager from '@/components/AttestationsManager';
import { ChatWidget } from '@/components/chat';
import { TaxCreditSavings } from '@/components/client/TaxCreditSavings';
import { PendingReviews } from '@/components/client/PendingReviews';
import { AvanceImmediateActivation } from '@/components/client/AvanceImmediateActivation';
import { ClientPrestationsHistory } from '@/components/client/ClientPrestationsHistory';
import { AutoRatingPrompt } from '@/components/mobile/AutoRatingPrompt';
import { useTranslation } from 'react-i18next';

const EspacePersonnel = () => {
  const { user, loading, primaryRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("connexion");

  // Rediriger les non-clients vers leur espace approprié
  useEffect(() => {
    if (!loading && user && primaryRole) {
      if (primaryRole === 'admin' || primaryRole === 'moderator') {
        navigate('/modern-admin', { replace: true });
      } else if (primaryRole === 'provider') {
        navigate('/espace-prestataire', { replace: true });
      }
    }
  }, [user, loading, primaryRole, navigate]);

  // Liste unifiée des onglets protégés (nécessitant une authentification)
  const protectedTabs = ["dashboard", "rendez-vous", "factures", "economies", "parrainage", "profil", "paiement", "attestations"];

  // Rediriger vers connexion si pas authentifié et tentative d'accès à un onglet protégé
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab') || selectedTab;
    
    if (!user && protectedTabs.includes(tabFromUrl)) {
      setSelectedTab("connexion");
    } else if (user && tabFromUrl && tabFromUrl !== "connexion") {
      setSelectedTab(tabFromUrl);
    } else if (user && selectedTab === "connexion") {
      setSelectedTab("dashboard");
    }
  }, [user, selectedTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 lg:pt-20 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mon espace | Bikawo</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <div className="pt-14 pb-10 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header moderne */}
          <div className="mb-4 sm:mb-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl transform -rotate-1"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-6 shadow-lg border">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1 sm:mb-2">
                  {t('personalSpace.title')}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-lg">
                  {user ? t('personalSpace.welcome', { name: user.email?.split('@')[0] }) : t('personalSpace.pleaseLogin')}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation modernisées */}
          <Tabs value={selectedTab} onValueChange={(tab) => {
            // Vérifier l'authentification pour les onglets protégés (utilise la liste unifiée)
            if (!user && protectedTabs.includes(tab)) {
              setSelectedTab("connexion");
              return;
            }
            setSelectedTab(tab);
            // Mettre à jour l'URL pour navigation directe
            const newUrl = new URL(window.location.href);
            if (tab === "connexion") {
              newUrl.searchParams.delete('tab');
            } else {
              newUrl.searchParams.set('tab', tab);
            }
            window.history.replaceState({}, '', newUrl);
          }} className="w-full">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 mb-4 sm:mb-8">
            <TabsList className={`inline-flex sm:grid gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-sm p-1.5 sm:p-2 shadow-lg rounded-xl border-0 min-w-max sm:min-w-0 sm:w-full ${user ? 'sm:grid-cols-4 lg:grid-cols-8' : 'sm:grid-cols-1'}`}>
              {!user && (
                <TabsTrigger 
                  value="connexion" 
                  className="flex items-center gap-2 min-h-12 py-3 px-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                >
                  <Lock className="w-4 h-4" />
                  {t('personalSpace.login')}
                </TabsTrigger>
              )}
              {user && (
                <>
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.dashboard')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rendez-vous" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.appointments')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="factures" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.invoices')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="economies" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <PiggyBank className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">Économies</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="parrainage" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.referral')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profil" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.profile')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paiement" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.payment')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attestations" 
                    className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
                  >
                    <Receipt className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{t('personalSpace.attestations')}</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            </div>

            {/* Connexion / Inscription */}
            <TabsContent value="connexion" className="space-y-6">
              {!user ? (
                <Auth />
              ) : (
                <Card className="max-w-md mx-auto">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{t('personalSpace.welcomeConnected')}</CardTitle>
                    <p className="text-muted-foreground">
                      {t('personalSpace.youAreConnected')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-center">
                      {t('personalSpace.email')} : <span className="font-medium">{user.email}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedTab("dashboard")}
                    >
                      {t('personalSpace.accessDashboard')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <AvanceImmediateActivation />
              <EnhancedClientDashboard onNavigateToTab={setSelectedTab} />
              <PendingReviews />
            </TabsContent>

            {/* Historique complet des prestations */}
            <TabsContent value="rendez-vous" className="space-y-6">
              <ClientPrestationsHistory />
            </TabsContent>

            {/* Historique et Mes Factures */}
            <TabsContent value="factures" className="space-y-6">
              <ModernInvoiceManagement />
            </TabsContent>

            {/* Économies et Crédit d'impôt */}
            <TabsContent value="economies" className="space-y-6">
              <TaxCreditSavings />
            </TabsContent>

            {/* Parrainage */}
            <TabsContent value="parrainage" className="space-y-6">
              <div className="grid gap-6">
                <RewardsSection userType="client" />
                <ReferralProgram />
              </div>
            </TabsContent>

            {/* Mon Profil */}
            <TabsContent value="profil" className="space-y-6">
              <ProfileUpdateForm />
            </TabsContent>

            {/* Mes Moyens de Paiement */}
            <TabsContent value="paiement" className="space-y-6">
              <PaymentMethodsManager />
            </TabsContent>

            {/* Attestations Crédit d'Impôt et CAF */}
            <TabsContent value="attestations" className="space-y-6">
              <AttestationsManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
      {user && <ChatWidget />}
      {user && <AutoRatingPrompt />}
    </div>
  );
};

export default EspacePersonnel;