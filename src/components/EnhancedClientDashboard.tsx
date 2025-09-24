import React, { useState, useMemo } from "react";
import ModernClientDashboard from "@/components/ModernClientDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useSmartSearch } from "@/hooks/useSmartSearch";
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
    if (!stats?.averageRating) return 'Nouveau';
    if (stats.averageRating >= 4.8) return 'Excellence';
    if (stats.averageRating >= 4.5) return 'Très satisfait';
    if (stats.averageRating >= 4.0) return 'Satisfait';
    return 'À améliorer';
  }, [stats]);

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
    <div className="container mx-auto p-4 space-y-8 animate-fade-in">
      {/* Header avec recherche intelligente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary-glow/10 to-secondary/10 p-1">
        <div className="relative bg-background/95 backdrop-blur-sm rounded-[calc(1rem-1px)] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2">
                    Bonjour {firstName} ! 
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Votre tableau de bord intelligent • {satisfactionLevel}
                  </p>
                </div>
              </div>

              {/* Barre de recherche intelligente */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Rechercher vos services, réservations, factures..."
                  className="pl-12 pr-12 h-12 text-base bg-background/80 backdrop-blur-sm border-2 border-transparent focus:border-primary/50 focus:bg-background transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setQuery(e.target.value);
                  }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {searchLoading && <div className="w-4 h-4 animate-spin border-2 border-primary border-t-transparent rounded-full"></div>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Services</DropdownMenuItem>
                      <DropdownMenuItem>Réservations</DropdownMenuItem>
                      <DropdownMenuItem>Factures</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Métriques avancées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    {stats?.upcomingBookings || 0}
                    {monthlyGrowth > 0 && <ArrowUp className="w-4 h-4 text-success" />}
                  </div>
                  <div className="text-xs text-muted-foreground">Réservations</div>
                  {monthlyGrowth > 0 && (
                    <div className="text-xs text-success font-medium">+{monthlyGrowth}% ce mois</div>
                  )}
                </div>
                <div className="text-center p-3 bg-white/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-primary">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                  <div className="text-xs text-yellow-600 font-medium">{satisfactionLevel}</div>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-success">{Math.round(stats?.savedAmount || 0)}€</div>
                  <div className="text-xs text-muted-foreground">Crédit d'impôt</div>
                  <Progress value={creditImpotProgress} className="h-1 mt-1" />
                </div>
                <div className="text-center p-3 bg-white/80 rounded-xl border hover:shadow-md transition-all">
                  <div className="text-2xl font-bold text-primary">{stats?.totalServices || 0}</div>
                  <div className="text-xs text-muted-foreground">Services utilisés</div>
                  <div className="text-xs text-primary font-medium">+{Math.round((stats?.totalServices || 0) / 2)} récents</div>
                </div>
              </div>
            </div>

            {/* Actions rapides principales */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all animate-pulse-subtle" 
                onClick={() => window.location.href = '/services'}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle réservation
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
                className="hover:bg-primary/5"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Actualiser
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
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl animate-slide-in-right"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Bell className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">{notification.title}</p>
                <p className="text-sm text-blue-700">{notification.message}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
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
                    <span className="text-xl">Vos Prochaines Sessions</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {upcomingBookings?.length || 0} réservation(s) confirmée(s)
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
                    {showAllBookings ? 'Moins' : 'Tout voir'}
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
                            Confirmé
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
                  <h3 className="text-xl font-semibold mb-3">Aucune réservation à venir</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Découvrez nos services et réservez votre première prestation pour profiter de l'aide à domicile
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

        {/* Sidebar avec actions et insights */}
        <div className="lg:col-span-4 space-y-6">
          {/* Actions rapides redesignées */}
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