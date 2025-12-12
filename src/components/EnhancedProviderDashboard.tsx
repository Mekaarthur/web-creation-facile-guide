import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProviderDashboard } from '@/hooks/useProviderDashboard';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  User, 
  Star, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Target, 
  Award, 
  Users, 
  ArrowRight, 
  Zap, 
  Phone, 
  Mail, 
  Eye, 
  Settings, 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingDown, 
  Activity, 
  Timer, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProviderCalendar from '@/components/ProviderCalendar';
import ProviderDocuments from '@/components/ProviderDocuments';
import ProviderProfileForm from './ProviderProfileForm';
import { LoadingSkeleton, DashboardLoadingSkeleton } from '@/components/ui/loading-skeleton';
import ProviderMissionManager from '@/components/ProviderMissionManager';
import ProviderAppointments from '@/components/ProviderAppointments';
import ProviderMessaging from '@/components/ProviderMessaging';
import ProviderServices from '@/components/ProviderServices';
import MyZones from '@/pages/provider/MyZones';
import ProviderReferralProgram from '@/components/ProviderReferralProgram';
import ProviderPerformanceRewards from '@/components/provider/ProviderPerformanceRewards';
import ProviderKPIsDashboard from '@/components/provider/ProviderKPIsDashboard';
import { ZoneAlerts } from '@/components/provider/ZoneAlerts';
import { getStatusColor, getStatusLabel } from '@/utils/statusUtils';

const EnhancedProviderDashboard = () => {
  const { t } = useTranslation();
  const {
    provider,
    missions,
    opportunities,
    reviews,
    stats,
    loading,
    refreshing,
    error,
    refresh,
    applyToMission,
    updateMissionStatus
  } = useProviderDashboard();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtered missions based on search and filter
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesSearch = searchTerm === '' ||
        mission.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [missions, searchTerm, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getProgressPercentage = () => {
    const monthlyGoal = 3000;
    return Math.min((stats.monthlyEarnings / monthlyGoal) * 100, 100);
  };

  if (loading && !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto p-6">
          <DashboardLoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">{t('providerDashboard.loadingError')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => refresh()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('providerDashboard.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const motivationalQuotes = [
    "Chaque mission est une nouvelle opportunité de briller ! ✨",
    "Votre talent fait la différence dans la vie de vos clients 🌟",
    "Aujourd'hui est parfait pour dépasser vos objectifs ! 🚀",
    "L'excellence n'est pas un acte, mais une habitude 💎"
  ];

  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Modern Header */}
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
                variant={provider?.is_verified ? "default" : "secondary"}
                className={`text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${provider?.is_verified 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-warning/10 text-warning border-warning/20'
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{provider?.is_verified ? t('providerDashboard.verified') : t('providerDashboard.inVerification')}</span>
              </Badge>
              <div className="hidden lg:flex items-center gap-2 text-xs lg:text-sm text-muted-foreground bg-muted/50 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg whitespace-nowrap">
                <Phone className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                <span className="hidden xl:inline">{t('providerDashboard.support')}: </span>
                <span>0609085390</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                disabled={refreshing}
                className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs sm:text-sm">{t('providerDashboard.refresh')}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => setActiveTab('profil')}
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">{t('providerDashboard.profile')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2">
          <TabsList className="grid grid-cols-6 sm:grid-cols-6 lg:grid-cols-12 bg-card/80 backdrop-blur-sm p-0.5 sm:p-1 h-auto shadow-lg rounded-lg sm:rounded-xl border-0 min-w-max sm:min-w-0 w-full">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">{t('personalSpace.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">{t('personalSpace.appointments')}</span>
              {stats.activeMissions > 0 && (
                <Badge variant="destructive" className="text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 h-4 sm:h-5 min-w-4 sm:min-w-5">
                  {stats.activeMissions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="missions" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Briefcase className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Missions</span>
            </TabsTrigger>
            <TabsTrigger
              value="planning" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Planning</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messaging" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <MessageSquare className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Briefcase className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="zones" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Zones</span>
            </TabsTrigger>
            <TabsTrigger 
              value="revenus" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Revenus</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cooptation" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Cooptation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="recompenses" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Award className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Récompenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profil" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <User className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Profil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="evaluations" 
              className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 py-2.5 sm:py-3 lg:py-4 px-2 sm:px-2.5 lg:px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all duration-200"
            >
              <Star className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Évaluations</span>
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 lg:space-y-8 mt-4 sm:mt-6 lg:mt-8">
            {/* Citation motivante moderne */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent"></div>
              <CardContent className="relative p-4 sm:p-6 lg:p-8">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2">Motivation du jour</p>
                    <p className="text-muted-foreground italic text-xs sm:text-base lg:text-lg">{todayQuote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques principales modernisées */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardContent className="relative p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:h-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Ce mois</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyEarnings)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardContent className="relative p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Activity className="h-5 w-5 sm:h-6 sm:h-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Missions</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.activeMissions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 text-blue-600 text-xs sm:text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      À traiter
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
                <CardContent className="relative p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Star className="h-5 w-5 sm:h-6 sm:h-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Note</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardContent className="relative p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Award className="h-5 w-5 sm:h-6 sm:h-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.completedMissions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 text-purple-600 text-xs sm:text-sm font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Réalisées
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opportunités et missions récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Opportunités */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Opportunités récentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Postes disponibles correspondant à vos services</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {opportunities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 sm:py-6 text-sm">Aucune opportunité disponible pour le moment.</p>
                  ) : (
                    <ul className="space-y-3 sm:space-y-4">
                      {opportunities.map(opportunity => (
                        <li key={opportunity.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm sm:text-lg truncate">{opportunity.services?.name || 'Service non spécifié'}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{format(new Date(opportunity.booking_date), 'PPP', { locale: fr })} - {opportunity.start_time}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{opportunity.address}</p>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                              <p className="font-bold text-primary text-sm sm:text-base">{formatCurrency(opportunity.total_price)}</p>
                              <Badge variant="outline" className="text-blue-600 text-[10px] sm:text-xs">Normal</Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 sm:mt-3 w-full text-xs sm:text-sm"
                            onClick={() => applyToMission(opportunity.id)}
                          >
                            Postuler
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Missions récentes */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Missions récentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Suivi de vos missions récentes</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {missions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 sm:py-6 text-sm">Vous n'avez pas encore de missions.</p>
                  ) : (
                    <ul className="space-y-3 sm:space-y-4">
                      {missions.slice(0, 5).map(mission => (
                        <li key={mission.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm sm:text-lg truncate">{mission.services?.name || 'Service non spécifié'}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{format(new Date(mission.booking_date), 'PPP', { locale: fr })} - {mission.start_time} à {mission.end_time}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{mission.address}</p>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                              <p className="font-bold text-primary text-sm sm:text-base">{formatCurrency(mission.total_price)}</p>
                              <Badge className={`${getStatusColor(mission.status)} text-[10px] sm:text-xs`}>{getStatusLabel(mission.status)}</Badge>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Missions Tab with Enhanced Features */}
          <TabsContent value="missions" className="space-y-6 mt-8">
            <ProviderMissionManager 
              missions={missions} 
              onUpdateStatus={updateMissionStatus} 
              loading={loading} 
            />
          </TabsContent>

          {/* Revenus Tab - KPIs Dashboard */}
          <TabsContent value="revenus" className="mt-8">
            <ProviderKPIsDashboard 
              stats={stats}
              reviews={reviews}
              missions={missions}
            />
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="mt-8">
            <ProviderCalendar />
          </TabsContent>

          {/* Profil Tab */}
          <TabsContent value="profil" className="space-y-6 mt-8">
            <ProviderProfileForm />
            <ProviderDocuments />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-8">
            <ProviderAppointments />
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="mt-8">
            <ProviderMessaging />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-8">
            <ProviderServices />
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones" className="mt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <MyZones />
              <ZoneAlerts />
            </div>
          </TabsContent>

          {/* Cooptation Tab */}
          <TabsContent value="cooptation" className="mt-8">
            <ProviderReferralProgram />
          </TabsContent>

          {/* Récompenses de Performance Tab */}
          <TabsContent value="recompenses" className="mt-8">
            <ProviderPerformanceRewards />
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6 mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
                <CardDescription>Retours et évaluations de vos clients</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Aucun avis disponible pour le moment.</p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map(review => (
                      <li key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.profiles?.first_name} {review.profiles?.last_name}
                          </p>
                        </div>
                        <p className="text-muted-foreground mb-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'PPPP', { locale: fr })}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedProviderDashboard;
