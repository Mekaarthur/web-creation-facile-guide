import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  Clock, 
  User, 
  Star, 
  ArrowRight,
  Gift,
  CreditCard,
  FileText,
  TrendingUp,
  CheckCircle,
  Plus,
  DollarSign,
  Trophy,
  Heart,
  Zap,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ArrowUp,
  Target,
  Sparkles,
  BookOpen,
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  MapPin,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernClientDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

const ModernClientDashboard = ({ onNavigateToTab }: ModernClientDashboardProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [activeInsightTab, setActiveInsightTab] = useState('overview');
  
  const {
    stats,
    statsLoading,
    upcomingBookings,
    bookingsLoading,
    quickActions,
    notifications,
    monthlyAnalytics,
    refreshData,
    isLoading
  } = useClientDashboard();

  // Enhanced analytics calculations
  const enhancedMetrics = useMemo(() => {
    if (!stats) return null;

    const monthlyGrowth = Math.round((stats.monthlySpending / (stats.totalSpent || 1)) * 100);
    const creditImpotProgress = Math.min((stats.savedAmount / 12000) * 100, 100);
    const loyaltyProgress = Math.min((stats.loyaltyPoints % 1000) / 10, 100);
    
    let satisfactionLevel = 'Nouveau';
    let satisfactionColor = 'text-gray-500';
    
    if (stats.averageRating >= 4.8) {
      satisfactionLevel = 'Exceptionnel';
      satisfactionColor = 'text-purple-600';
    } else if (stats.averageRating >= 4.5) {
      satisfactionLevel = 'Excellent';
      satisfactionColor = 'text-green-600';
    } else if (stats.averageRating >= 4.0) {
      satisfactionLevel = 'Très bien';
      satisfactionColor = 'text-blue-600';
    } else if (stats.averageRating >= 3.5) {
      satisfactionLevel = 'Bien';
      satisfactionColor = 'text-yellow-600';
    }

    return {
      monthlyGrowth,
      creditImpotProgress,
      loyaltyProgress,
      satisfactionLevel,
      satisfactionColor
    };
  }, [stats]);

  // Chart data for analytics
  const chartData = useMemo(() => {
    if (!monthlyAnalytics?.length) return [];
    
    return monthlyAnalytics.map(item => ({
      month: item.month,
      spent: item.totalSpent,
      services: item.servicesUsed,
      hours: item.hoursBooked
    }));
  }, [monthlyAnalytics]);

  // Services distribution data
  const servicesData = useMemo(() => {
    if (!stats?.favoriteServices?.length) return [];
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    
    return stats.favoriteServices.map((service, index) => ({
      name: service,
      value: Math.floor(Math.random() * 100) + 20, // Placeholder - should come from real data
      color: colors[index % colors.length]
    }));
  }, [stats?.favoriteServices]);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Client';

  // Loading state moderne
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="animate-pulse">
              <div className="h-48 bg-gradient-to-r from-muted/50 to-muted/80 rounded-2xl mb-6"></div>
              <div className="h-64 bg-muted/50 rounded-xl"></div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted/50 rounded-xl"></div>
              <div className="h-48 bg-muted/50 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header moderne avec navigation */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Bonjour {firstName} ! 👋
                  </h1>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <Shield className="w-3 h-3 mr-1" />
                    Espace sécurisé
                  </Badge>
                </div>
                <p className="text-muted-foreground">Votre tableau de bord intelligent Bikawo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span>Support: 06 09 08 53 90</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="hover:bg-primary/10"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigateToTab('profil')}
                className="hover:bg-primary/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Navigation par onglets moderne */}
        <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1 h-auto shadow-lg rounded-xl border-0">
            <TabsTrigger 
              value="overview" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium">Analytiques</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Target className="h-5 w-5" />
              <span className="text-xs font-medium">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Gift className="h-5 w-5" />
              <span className="text-xs font-medium">Récompenses</span>
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-8 mt-8">
            {/* Métriques principales modernisées */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Réservations</p>
                      <p className="text-2xl font-bold text-foreground">{stats?.upcomingBookings || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      À venir
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <DollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total dépensé</p>
                      <p className="text-2xl font-bold text-foreground">{stats?.totalSpent || 0}€</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="h-3 w-3" />
                      +{enhancedMetrics?.monthlyGrowth || 0}%
                    </div>
                    <span className="text-xs text-muted-foreground">ce mois</span>
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
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Satisfaction</p>
                      <p className="text-2xl font-bold text-foreground">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(stats?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${enhancedMetrics?.satisfactionColor}`}>
                    {enhancedMetrics?.satisfactionLevel}
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Gift className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Points fidélité</p>
                      <p className="text-2xl font-bold text-foreground">{stats?.loyaltyPoints || 0}</p>
                    </div>
                  </div>
                  <Progress value={enhancedMetrics?.loyaltyProgress || 0} className="h-2" />
                  <div className="text-xs text-purple-600 font-medium mt-2">
                    {1000 - ((stats?.loyaltyPoints || 0) % 1000)} pts jusqu'au prochain niveau
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications intelligentes */}
            {notifications && notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-center gap-3 p-4 rounded-xl border animate-slide-in-right ${
                      notification.type === 'success' ? 'bg-green-50 border-green-200' :
                      notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      notification.type === 'reminder' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Bell className={`w-5 h-5 ${
                      notification.type === 'success' ? 'text-green-500' :
                      notification.type === 'warning' ? 'text-yellow-500' :
                      notification.type === 'reminder' ? 'text-blue-500' :
                      'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    {notification.action && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => notification.actionUrl && (window.location.href = notification.actionUrl)}
                      >
                        {notification.action}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Layout principal avec réservations et actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Prochaines sessions */}
              <div className="lg:col-span-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="text-xl">Vos Prochaines Sessions</span>
                          <p className="text-sm text-muted-foreground font-normal">
                            {upcomingBookings?.length || 0} réservation(s) confirmée(s)
                          </p>
                        </div>
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onNavigateToTab('rendez-vous')}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {upcomingBookings && upcomingBookings.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingBookings.slice(0, 3).map((booking, index) => (
                          <div 
                            key={booking.id} 
                            className="group relative p-5 rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background to-muted/20 hover:scale-[1.02]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6 text-primary" />
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg">
                                    {booking.services?.name || 'Service'}
                                  </h4>
                                  <p className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(booking.booking_date), 'EEEE d MMMM', { locale: fr })} à {booking.start_time}
                                  </p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {booking.providers?.business_name || 'Prestataire assigné'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors"
                                >
                                  Confirmé
                                </Badge>
                                <div className="text-lg font-semibold text-primary">
                                  {booking.total_price}€
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-muted/50 to-muted/80 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Calendar className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Aucune réservation à venir</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Découvrez nos services et réservez votre première prestation
                        </p>
                        <Button 
                          size="lg"
                          onClick={() => window.location.href = '/services'}
                          className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Découvrir nos services
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions rapides */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions?.map((action, index) => (
                      <Button 
                        key={action.id}
                        variant="outline" 
                        className="w-full justify-start p-4 h-auto hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group hover:scale-[1.02]"
                        onClick={action.action}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            {action.icon === 'Plus' && <Plus className="w-5 h-5 text-primary" />}
                            {action.icon === 'Calendar' && <Calendar className="w-5 h-5 text-primary" />}
                            {action.icon === 'FileText' && <FileText className="w-5 h-5 text-primary" />}
                            {action.icon === 'Gift' && <Gift className="w-5 h-5 text-primary" />}
                            {action.icon === 'Users' && <Users className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{action.title}</div>
                            <div className="text-sm text-muted-foreground">{action.description}</div>
                          </div>
                          {action.count !== undefined && (
                            <Badge variant="secondary" className="ml-auto">
                              {action.count}
                            </Badge>
                          )}
                          {action.badge && (
                            <Badge variant="default" className="ml-auto bg-primary">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Vue analytiques */}
          <TabsContent value="analytics" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des dépenses mensuelles */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Évolution mensuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="spent" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Dépenses (€)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution des services */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Services utilisés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicesData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {servicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {servicesData.map((service, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-sm">{service.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Crédit d'impôt */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Shield className="w-5 h-5" />
                  Crédit d'impôt estimé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {stats?.savedAmount || 0}€
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Économies potentielles cette année (50% des dépenses)
                    </p>
                  </div>
                  <Progress 
                    value={enhancedMetrics?.creditImpotProgress || 0} 
                    className="h-3"
                  />
                  <div className="text-center text-sm text-green-700">
                    {Math.round(enhancedMetrics?.creditImpotProgress || 0)}% du plafond annuel (12 000€)
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onNavigateToTab('attestations')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Télécharger mes attestations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Autres onglets peuvent être ajoutés ici */}
        </Tabs>
      </div>
    </div>
  );
};

export default ModernClientDashboard;