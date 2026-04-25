import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  useDashboardProfile,
  useDashboardMissions,
  useDashboardOpportunities,
  useDashboardReviews,
  useDashboardEarnings,
  useDashboardStats,
  useApplyToOpportunity,
  useUpdateMissionStatus,
  useInvalidateProviderDashboard,
} from '@/hooks/queries/useProviderDashboardV2';
import {
  LayoutDashboard, Briefcase, User, CheckCircle, Phone, Settings, RefreshCw, MessageSquare, TrendingUp,
} from 'lucide-react';
import { EmergencyReportButton } from '@/components/provider/EmergencyReportButton';
import { SecureLogout } from '@/components/SecureLogout';
import { DashboardLoadingSkeleton } from '@/components/ui/loading-skeleton';
import type { BookingStatus } from '@/services/bookingService';

// Tab components
import ProviderDashboardTab from '@/components/provider/ProviderDashboardTab';
import ProviderAppointments from '@/components/ProviderAppointments';
import ProviderMissionManager from '@/components/ProviderMissionManager';
import ProviderCalendar from '@/components/ProviderCalendar';
import ProviderKPIsDashboard from '@/components/provider/ProviderKPIsDashboard';
import ProviderEvaluationsTab from '@/components/provider/ProviderEvaluationsTab';
import ProviderPerformanceRewards from '@/components/provider/ProviderPerformanceRewards';
import ProviderMessaging from '@/components/ProviderMessaging';
import ProviderReferralProgram from '@/components/ProviderReferralProgram';
import ProviderProfileForm from './ProviderProfileForm';
import ProviderDocuments from '@/components/ProviderDocuments';
import ProviderServices from '@/components/ProviderServices';
import MyZones from '@/pages/provider/MyZones';
import { StripeConnectCard } from '@/components/provider/StripeConnectCard';
import ProviderAttestationsTab from '@/components/provider/ProviderAttestationsTab';

const EnhancedProviderDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Données via React Query ──────────────────────────────────
  const {
    data: provider,
    isLoading: providerLoading,
    isFetching: providerFetching,
    error: providerError,
  } = useDashboardProfile();

  const providerId = provider?.id;

  const { data: missions, isLoading: missionsLoading, isFetching: missionsFetching } = useDashboardMissions(providerId);
  const { data: opportunities, isFetching: oppsFetching } = useDashboardOpportunities(providerId);
  const { data: reviews, isFetching: reviewsFetching } = useDashboardReviews(providerId);
  const { data: earnings, isFetching: earningsFetching } = useDashboardEarnings(providerId);

  const stats = useDashboardStats({ provider, missions, reviews, earnings });

  // ── Mutations ────────────────────────────────────────────────
  const applyMutation = useApplyToOpportunity();
  const updateStatusMutation = useUpdateMissionStatus();
  const invalidateAll = useInvalidateProviderDashboard();

  const [activeTab, setActiveTab] = useState('accueil');

  // Indicateurs globaux
  const initialLoading = providerLoading || (!!providerId && missionsLoading);
  const refreshing =
    providerFetching || missionsFetching || oppsFetching || reviewsFetching || earningsFetching;

  // ── Handlers ─────────────────────────────────────────────────
  const handleRefresh = () => invalidateAll(providerId);

  const applyToMission = (opportunityId: string) => {
    if (!providerId) return;
    applyMutation.mutate(
      { providerId, opportunityId, responseType: 'accepted' },
      {
        onSuccess: () => {
          toast({
            title: 'Candidature envoyée ✅',
            description: "Votre candidature a été soumise. L'équipe Bikawo va l'examiner.",
          });
        },
        onError: (err: any) => {
          toast({
            title: 'Erreur',
            description: err?.message || 'Erreur lors de la candidature',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const updateMissionStatus = (missionId: string, status: string, notes?: string) => {
    if (!providerId) return;
    updateStatusMutation.mutate(
      { missionId, providerId, status: status as BookingStatus, notes },
      {
        onSuccess: () => {
          toast({
            title: 'Mission mise à jour',
            description: 'Le statut de la mission a été mis à jour avec succès',
          });
        },
        onError: (err: any) => {
          toast({
            title: 'Erreur',
            description: err?.message || 'Erreur lors de la mise à jour',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // ── États de chargement / erreur ─────────────────────────────
  if (initialLoading && !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto p-6">
          <DashboardLoadingSkeleton />
        </div>
      </div>
    );
  }

  if (providerError && !provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">{t('providerDashboard.loadingError')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{(providerError as any)?.message || ''}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('providerDashboard.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Briefcase className="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                    {t('providerDashboard.greeting')} {provider?.profiles?.first_name || 'Prestataire'} ! 👋
                  </h1>
                  {refreshing && (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm truncate">{t('providerDashboard.welcome')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <Badge
                variant={provider?.is_verified ? 'default' : 'secondary'}
                className={`text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  provider?.is_verified
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-warning/10 text-warning border-warning/20'
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">
                  {provider?.is_verified ? t('providerDashboard.verified') : t('providerDashboard.inVerification')}
                </span>
              </Badge>
              <div className="hidden lg:flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-muted/50 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg whitespace-nowrap">
                <Phone className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                <span className="hidden xl:inline">{t('providerDashboard.support')}: </span>
                <span>0609085390</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs sm:text-sm">{t('providerDashboard.refresh')}</span>
              </Button>
              {provider?.id && <EmergencyReportButton providerId={provider.id} />}
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => setActiveTab('profil')}
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">{t('providerDashboard.profile')}</span>
              </Button>
              <SecureLogout variant="outline" size="sm" showIcon={true} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
            <TabsList className="grid grid-cols-5 bg-card/80 backdrop-blur-sm p-0.5 sm:p-1 h-auto shadow-lg rounded-lg sm:rounded-xl border-0 w-full">
              <TabsTrigger
                value="accueil"
                className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
              >
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Accueil</span>
              </TabsTrigger>
              <TabsTrigger
                value="missions"
                className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
              >
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Mes missions</span>
                {stats.activeMissions > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0.5 h-4 min-w-4">
                    {stats.activeMissions}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="activite"
                className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Mon activité</span>
              </TabsTrigger>
              <TabsTrigger
                value="communaute"
                className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Ma communauté</span>
              </TabsTrigger>
              <TabsTrigger
                value="profil"
                className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Mon profil</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════ ACCUEIL: Dashboard + Opportunités ═══════ */}
          <TabsContent value="accueil" className="mt-4 sm:mt-6 lg:mt-8">
            <ProviderDashboardTab
              stats={stats}
              opportunities={opportunities ?? []}
              missions={missions ?? []}
              applyToMission={applyToMission}
            />
          </TabsContent>

          {/* ═══════ MES MISSIONS: RDV + Missions + Planning ═══════ */}
          <TabsContent value="missions" className="mt-4 sm:mt-6 lg:mt-8">
            <Tabs defaultValue="rdv" className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
                <TabsList className="inline-flex sm:grid sm:grid-cols-3 mb-4 min-w-max sm:min-w-0 sm:w-full">
                  <TabsTrigger value="rdv" className="text-xs sm:text-sm whitespace-nowrap">Rendez-vous</TabsTrigger>
                  <TabsTrigger value="gestion" className="text-xs sm:text-sm whitespace-nowrap">Gestion missions</TabsTrigger>
                  <TabsTrigger value="planning" className="text-xs sm:text-sm whitespace-nowrap">Planning</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="rdv">
                <ProviderAppointments />
              </TabsContent>
              <TabsContent value="gestion">
                <ProviderMissionManager
                  missions={missions ?? []}
                  onUpdateStatus={updateMissionStatus}
                  loading={missionsLoading || updateStatusMutation.isPending}
                />
              </TabsContent>
              <TabsContent value="planning">
                <ProviderCalendar />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══════ MON ACTIVITÉ: Revenus + Évaluations + Récompenses ═══════ */}
          <TabsContent value="activite" className="mt-4 sm:mt-6 lg:mt-8">
            <Tabs defaultValue="revenus" className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
                <TabsList className="inline-flex sm:grid sm:grid-cols-3 mb-4 min-w-max sm:min-w-0 sm:w-full">
                  <TabsTrigger value="revenus" className="text-xs sm:text-sm whitespace-nowrap">Revenus</TabsTrigger>
                  <TabsTrigger value="evaluations" className="text-xs sm:text-sm whitespace-nowrap">Évaluations</TabsTrigger>
                  <TabsTrigger value="recompenses" className="text-xs sm:text-sm whitespace-nowrap">Récompenses</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="revenus">
                <ProviderKPIsDashboard
                  stats={stats}
                  reviews={reviews ?? []}
                  missions={missions ?? []}
                />
              </TabsContent>
              <TabsContent value="evaluations">
                <ProviderEvaluationsTab reviews={reviews ?? []} />
              </TabsContent>
              <TabsContent value="recompenses">
                <ProviderPerformanceRewards />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══════ MA COMMUNAUTÉ: Messages + Cooptation ═══════ */}
          <TabsContent value="communaute" className="mt-4 sm:mt-6 lg:mt-8">
            <Tabs defaultValue="messages" className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
                <TabsList className="inline-flex sm:grid sm:grid-cols-2 mb-4 min-w-max sm:min-w-0 sm:w-full">
                  <TabsTrigger value="messages" className="text-xs sm:text-sm whitespace-nowrap">Messages</TabsTrigger>
                  <TabsTrigger value="cooptation" className="text-xs sm:text-sm whitespace-nowrap">Cooptation</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="messages">
                <ProviderMessaging />
              </TabsContent>
              <TabsContent value="cooptation">
                <ProviderReferralProgram />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══════ MON PROFIL: Profil + Services + Zones + Documents ═══════ */}
          <TabsContent value="profil" className="mt-4 sm:mt-6 lg:mt-8">
            <Tabs defaultValue="infos" className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
                <TabsList className="inline-flex sm:grid sm:grid-cols-6 mb-4 min-w-max sm:min-w-0 sm:w-full">
                  <TabsTrigger value="infos" className="text-xs sm:text-sm whitespace-nowrap">Informations</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs sm:text-sm whitespace-nowrap">Services</TabsTrigger>
                  <TabsTrigger value="zones" className="text-xs sm:text-sm whitespace-nowrap">Zones</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs sm:text-sm whitespace-nowrap">Documents</TabsTrigger>
                  <TabsTrigger value="attestations" className="text-xs sm:text-sm whitespace-nowrap">Attestations</TabsTrigger>
                  <TabsTrigger value="paiements" className="text-xs sm:text-sm whitespace-nowrap">Paiements</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="infos">
                <ProviderProfileForm />
              </TabsContent>
              <TabsContent value="services">
                <ProviderServices />
              </TabsContent>
              <TabsContent value="zones">
                <MyZones />
              </TabsContent>
              <TabsContent value="documents">
                <ProviderDocuments />
              </TabsContent>
              <TabsContent value="attestations">
                <ProviderAttestationsTab />
              </TabsContent>
              <TabsContent value="paiements">
                <StripeConnectCard />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedProviderDashboard;
