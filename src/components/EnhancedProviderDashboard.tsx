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
import ProviderServiceZones from '@/components/ProviderServiceZones';
import ProviderReferralProgram from '@/components/ProviderReferralProgram';
import ProviderPerformanceRewards from '@/components/provider/ProviderPerformanceRewards';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'in_progress': return 'bg-info/10 text-info border-info/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t('providerDashboard.status.confirmed');
      case 'pending': return t('providerDashboard.status.pending');
      case 'in_progress': return t('providerDashboard.status.inProgress');
      case 'completed': return t('providerDashboard.status.completed');
      case 'cancelled': return t('providerDashboard.status.cancelled');
      default: return status;
    }
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {t('providerDashboard.greeting')} {provider?.profiles?.first_name || 'Prestataire'} ! 👋
                  </h1>
                  {refreshing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                <p className="text-muted-foreground">{t('providerDashboard.welcome')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={provider?.is_verified ? "default" : "secondary"}
                className={`text-sm ${provider?.is_verified 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-warning/10 text-warning border-warning/20'
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {provider?.is_verified ? t('providerDashboard.verified') : t('providerDashboard.inVerification')}
              </Badge>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span>{t('providerDashboard.support')}: 0609085390</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                disabled={refreshing}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {t('providerDashboard.refresh')}
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-primary/10">
                <Settings className="h-4 w-4 mr-2" />
                {t('providerDashboard.profile')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-10 bg-card/80 backdrop-blur-sm p-1 h-auto shadow-lg rounded-xl border-0">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs font-medium">{t('personalSpace.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">{t('personalSpace.appointments')}</span>
              {stats.activeMissions > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5 min-w-5">
                  {stats.activeMissions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs font-medium">Planning</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messaging" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs font-medium">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs font-medium">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="zones" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-medium">Zones</span>
            </TabsTrigger>
            <TabsTrigger 
              value="revenus" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium">Revenus</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cooptation" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Cooptation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="recompenses" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Award className="h-5 w-5" />
              <span className="text-xs font-medium">Récompenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profil" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-8 mt-8">
            {/* Citation motivante moderne */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent"></div>
              <CardContent className="relative p-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-foreground mb-2">Motivation du jour</p>
                    <p className="text-muted-foreground italic text-lg">{todayQuote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques principales modernisées */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <DollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ce mois</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyEarnings)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </div>
                    <span className="text-xs text-muted-foreground">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Activity className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Missions actives</p>
                      <p className="text-2xl font-bold text-foreground">{stats.activeMissions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      À traiter
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Star className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note moyenne</p>
                      <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total missions</p>
                      <p className="text-2xl font-bold text-foreground">{stats.completedMissions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Réalisées
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opportunités et missions récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opportunités */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Opportunités récentes</CardTitle>
                  <CardDescription>Postes disponibles correspondant à vos services</CardDescription>
                </CardHeader>
                <CardContent>
                  {opportunities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">Aucune opportunité disponible pour le moment.</p>
                  ) : (
                    <ul className="space-y-4">
                      {opportunities.map(opportunity => (
                        <li key={opportunity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-lg">{opportunity.services?.name || 'Service non spécifié'}</h3>
                              <p className="text-sm text-muted-foreground">{format(new Date(opportunity.booking_date), 'PPPP', { locale: fr })} - {opportunity.start_time}</p>
                              <p className="text-sm text-muted-foreground">{opportunity.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{formatCurrency(opportunity.total_price)}</p>
                              <Badge variant="outline" className="text-blue-600">Normal</Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
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
                <CardHeader>
                  <CardTitle>Missions récentes</CardTitle>
                  <CardDescription>Suivi de vos missions récentes</CardDescription>
                </CardHeader>
                <CardContent>
                  {missions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">Vous n'avez pas encore de missions.</p>
                  ) : (
                    <ul className="space-y-4">
                      {missions.slice(0, 5).map(mission => (
                        <li key={mission.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-lg">{mission.services?.name || 'Service non spécifié'}</h3>
                              <p className="text-sm text-muted-foreground">{format(new Date(mission.booking_date), 'PPPP', { locale: fr })} - {mission.start_time} à {mission.end_time}</p>
                              <p className="text-sm text-muted-foreground">{mission.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{formatCurrency(mission.total_price)}</p>
                              <Badge className={getStatusColor(mission.status)}>{getStatusLabel(mission.status)}</Badge>
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

          {/* Revenus Tab */}
          <TabsContent value="revenus" className="space-y-6 mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Suivi des revenus</CardTitle>
                <CardDescription>Visualisez vos gains et performances financières</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-muted-foreground">Revenu mensuel</p>
                      <p className="text-3xl font-bold">{formatCurrency(stats.monthlyEarnings)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenu total</p>
                      <p className="text-3xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2">Progression vers l'objectif mensuel</p>
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-primary h-4 rounded-full transition-all duration-500" 
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <ProviderServiceZones />
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
