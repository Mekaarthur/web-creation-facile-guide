import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ModernClientDashboard from "@/components/ModernClientDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  User, CheckCircle, Sparkles, Search, Filter, ArrowUp, Star, Plus, TrendingUp, 
  Bell, Calendar, ChevronDown, Clock, MoreHorizontal, Zap, ArrowRight, Target, 
  Trophy, Heart, BookOpen, CreditCard, Gift 
} from "lucide-react";

interface EnhancedClientDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

const EnhancedClientDashboard = ({ onNavigateToTab }: EnhancedClientDashboardProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllBookings, setShowAllBookings] = useState(false);
  
  const {
    stats,
    statsLoading,
    upcomingBookings,
    bookingsLoading,
    quickActions,
    notifications,
    refreshData,
    isLoading
  } = useClientDashboard();

  const { setQuery, results, suggestions, isLoading: searchLoading } = useSmartSearch();

  // Calculs pour les métriques avancées
  const monthlyGrowth = useMemo(() => {
    if (!stats) return 0;
    // Simulation de croissance mensuelle basée sur les données
    return Math.round((stats.completedBookings / 12) * 15);
  }, [stats]);

  const creditImpotProgress = useMemo(() => {
    if (!stats) return 0;
    const maxCredit = 12000; // Plafond annuel crédit d'impôt
    return Math.min((stats.savedAmount / maxCredit) * 100, 100);
  }, [stats]);

  const satisfactionLevel = useMemo(() => {
    if (!stats?.averageRating) return t('clientDashboard.satisfactionLevels.new');
    if (stats.averageRating >= 4.8) return t('clientDashboard.satisfactionLevels.excellent');
    if (stats.averageRating >= 4.5) return t('clientDashboard.satisfactionLevels.verySatisfied');
    if (stats.averageRating >= 4.0) return t('clientDashboard.satisfactionLevels.satisfied');
    return t('clientDashboard.satisfactionLevels.toImprove');
  }, [stats, t]);

  const firstName = user?.email?.split('@')[0] || 'Client';

  // Loading state moderne
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Skeleton principal */}
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
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header avec recherche intelligente */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-primary-glow/10 to-secondary/10 p-0.5 sm:p-1">
        <div className="relative bg-background/95 backdrop-blur-sm rounded-[calc(1rem-1px)] p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 w-full max-w-2xl">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-success rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="truncate">{t('clientDashboard.greeting')} {firstName} !</span>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-warning flex-shrink-0" />
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1 truncate">
                    {t('clientDashboard.intelligentDashboard')} • {satisfactionLevel}
                  </p>
                </div>
              </div>

              {/* Barre de recherche intelligente */}
              <div className="relative mb-4 sm:mb-6">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                  placeholder={t('clientDashboard.searchPlaceholder')}
                  className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base bg-background/80 backdrop-blur-sm border-2 border-transparent focus:border-primary/50 focus:bg-background transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setQuery(e.target.value);
                  }}
                />
                <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                  {searchLoading && <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin border-2 border-primary border-t-transparent rounded-full"></div>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                        <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>{t('services.title')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('clientDashboard.bookingsCount')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('clientDashboard.invoicesCount')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Métriques avancées */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
                <div className="text-center p-3 bg-card/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    {stats?.upcomingBookings || 0}
                    {monthlyGrowth > 0 && <ArrowUp className="w-4 h-4 text-success" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('clientDashboard.bookingsCount')}</div>
                  {monthlyGrowth > 0 && (
                    <div className="text-xs text-success font-medium">+{monthlyGrowth}% {t('clientDashboard.monthlyGrowth')}</div>
                  )}
                </div>
                <div className="text-center p-3 bg-card/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-primary">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
                    <Star className="w-4 h-4 fill-warning text-warning" />
                  </div>
                  <div className="text-xs text-muted-foreground">{t('clientDashboard.satisfaction')}</div>
                  <div className="text-xs text-warning font-medium">{satisfactionLevel}</div>
                </div>
                <div className="text-center p-3 bg-card/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-success">{Math.round(stats?.savedAmount || 0)}€</div>
                  <div className="text-xs text-muted-foreground">{t('clientDashboard.taxCredit')}</div>
                  <Progress value={creditImpotProgress} className="h-1 mt-1" />
                </div>
                <div className="text-center p-3 bg-card/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-primary">{stats?.totalServices || 0}</div>
                  <div className="text-xs text-muted-foreground">{t('clientDashboard.servicesUsed')}</div>
                  <div className="text-xs text-primary font-medium">+{Math.round((stats?.totalServices || 0) / 2)} récents</div>
                </div>
              </div>
            </div>

            {/* Actions rapides principales */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all animate-pulse-subtle" 
                onClick={() => navigate('/services')}
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('clientDashboard.newBooking')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
                className="hover:bg-primary/5"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('clientDashboard.refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications intelligentes */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id} 
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-info/10 to-info-foreground/10 border border-info/20 rounded-xl animate-slide-in-right"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Bell className="w-5 h-5 text-info" />
              <div className="flex-1">
                <p className="font-medium text-info-foreground">{notification.title}</p>
                <p className="text-sm text-info-foreground/80">{notification.message}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-info hover:text-info-foreground">
                {notification.action}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prochaines sessions avec design moderne */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xl">{t('clientDashboard.nextSessions')}</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {upcomingBookings?.length || 0} {t('clientDashboard.confirmedBookings')}
                    </p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllBookings(!showAllBookings)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    {showAllBookings ? 'Moins' : t('clientDashboard.viewAll')}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllBookings ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {(showAllBookings ? upcomingBookings : upcomingBookings.slice(0, 3)).map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className="group relative p-5 rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background to-muted/20 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 100}ms` }}
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
                              {new Date(booking.booking_date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })} à {booking.start_time}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {booking.providers?.business_name || 'Prestataire'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                        <Badge 
                            variant="outline" 
                            className="bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors"
                          >
                            {t('clientDashboard.status.confirmed')}
                          </Badge>
                          <div className="text-lg font-semibold text-primary">
                            {booking.total_price}€
                          </div>
                          <Button size="sm" variant="outline" className="hover:bg-primary/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
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
                  <h3 className="text-xl font-semibold mb-3">{t('clientDashboard.noUpcomingBooking')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('clientDashboard.firstBooking')}
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/services')}
                    className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t('clientDashboard.discoverServices')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec actions et insights */}
        <div className="lg:col-span-4 space-y-6">
          {/* Actions rapides redesignées */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                {t('clientDashboard.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions?.map((action, index) => (
                <Button 
                  key={action.id}
                  variant="outline" 
                  className="w-full justify-start p-4 h-auto hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group hover:scale-[1.02]"
                  onClick={action.action}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all">
                      {action.icon === 'Calendar' && <Calendar className="w-5 h-5 text-blue-600 group-hover:text-primary" />}
                      {action.icon === 'Clock' && <Clock className="w-5 h-5 text-blue-600 group-hover:text-primary" />}
                      {action.icon === 'CreditCard' && <CreditCard className="w-5 h-5 text-blue-600 group-hover:text-primary" />}
                      {action.icon === 'Gift' && <Gift className="w-5 h-5 text-blue-600 group-hover:text-primary" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {action.title}
                        {action.urgent && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {action.description}
                        {action.count && action.count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {action.count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Insights et conseils personnalisés */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-success/5 to-emerald/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-success" />
                </div>
                Conseils personnalisés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Optimisez vos économies</h4>
                    <p className="text-sm text-green-800 mb-2">
                      Vous avez économisé {Math.round(stats?.savedAmount || 0)}€ en crédit d'impôt cette année !
                    </p>
                    <Progress value={creditImpotProgress} className="h-2" />
                    <p className="text-xs text-green-700 mt-1">
                      {Math.round(100 - creditImpotProgress)}% restant jusqu'au plafond
                    </p>
                  </div>
                </div>
              </div>

              {stats?.averageRating && stats.averageRating >= 4.5 && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900 mb-1">Client premium</h4>
                      <p className="text-sm text-purple-800">
                        Votre satisfaction exceptionnelle vous donne accès à des services prioritaires !
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Astuce du jour</h4>
                    <p className="text-sm text-blue-800">
                      Réservez vos services récurrents à l'avance pour bénéficier de tarifs préférentiels.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientDashboard;