import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, Clock, User, Star, CheckCircle, TrendingUp, 
  CreditCard, Gift, Plus, Sparkles, Target, Trophy, Heart 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from "@/hooks/useAuth";

interface ModernClientDashboardProps {
  stats: any;
  upcomingBookings: any[];
  quickActions: any[];
  notifications: any[];
  refreshData: () => void;
  isLoading: boolean;
}

const ModernClientDashboard = ({ 
  stats, 
  upcomingBookings, 
  quickActions, 
  notifications, 
  refreshData, 
  isLoading 
}: ModernClientDashboardProps) => {
  const { user } = useAuth();

  // Enhanced analytics calculations
  const enhancedMetrics = useMemo(() => {
    if (!stats) return null;

    const monthlyGrowth = Math.round(((stats.totalSpent || 0) / 12) * 15);
    const creditImpotProgress = Math.min(((stats.savedAmount || 0) / 12000) * 100, 100);
    const loyaltyProgress = Math.min(((stats.completedBookings || 0) * 10) % 100, 100);
    
    let satisfactionLevel = 'Nouveau';
    if (stats.averageRating >= 4.8) satisfactionLevel = 'Excellence';
    else if (stats.averageRating >= 4.5) satisfactionLevel = 'Très satisfait';
    else if (stats.averageRating >= 4.0) satisfactionLevel = 'Satisfait';

    return {
      monthlyGrowth,
      creditImpotProgress,
      loyaltyProgress,
      satisfactionLevel
    };
  }, [stats]);

  // Monthly analytics data (mock data for now)
  const monthlyData = useMemo(() => {
    return [
      { month: 'Jan', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 },
      { month: 'Fév', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 },
      { month: 'Mar', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 },
      { month: 'Avr', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 },
      { month: 'Mai', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 },
      { month: 'Juin', spent: Math.floor(Math.random() * 500) + 100, services: Math.floor(Math.random() * 5) + 1 }
    ];
  }, []);

  // Services distribution data (mock data)
  const servicesData = useMemo(() => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    const services = ['Préparation culinaire', 'Garde d\'enfants', 'Aide seniors', 'Jardinage', 'Courses'];
    
    return services.map((service, index) => ({
      name: service,
      value: Math.floor(Math.random() * 100) + 20,
      color: colors[index % colors.length]
    }));
  }, []);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Client';

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
    <div className="container mx-auto p-4 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-secondary p-1">
        <div className="relative bg-background/95 backdrop-blur-sm rounded-[calc(1.5rem-1px)] p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Bienvenue {firstName} ! ✨
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Votre tableau de bord intelligent • {enhancedMetrics?.satisfactionLevel || 'Nouveau'}
              </p>
              
              {/* Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/80 rounded-2xl border shadow-sm">
                  <div className="text-2xl font-bold text-primary">{stats?.upcomingBookings || 0}</div>
                  <div className="text-sm text-muted-foreground">Réservations</div>
                  {enhancedMetrics?.monthlyGrowth > 0 && (
                    <div className="text-xs text-success font-medium">+{enhancedMetrics.monthlyGrowth}%</div>
                  )}
                </div>
                <div className="text-center p-4 bg-white/80 rounded-2xl border shadow-sm">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-primary">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center p-4 bg-white/80 rounded-2xl border shadow-sm">
                  <div className="text-2xl font-bold text-success">{Math.round(stats?.savedAmount || 0)}€</div>
                  <div className="text-sm text-muted-foreground">Crédit d'impôt</div>
                  <Progress value={enhancedMetrics?.creditImpotProgress || 0} className="h-1 mt-1" />
                </div>
                <div className="text-center p-4 bg-white/80 rounded-2xl border shadow-sm">
                  <div className="text-2xl font-bold text-primary">{(stats?.completedBookings || 0) * 10}</div>
                  <div className="text-sm text-muted-foreground">Points fidélité</div>
                  <Progress value={enhancedMetrics?.loyaltyProgress || 0} className="h-1 mt-1" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all" 
                onClick={() => window.location.href = '/services'}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle réservation
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id} 
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">{notification.title}</p>
                <p className="text-sm text-blue-700">{notification.message}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600">
                {notification.action}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Bookings and Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upcoming Bookings */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
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
            </CardHeader>
            <CardContent>
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 3).map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className="group p-5 rounded-2xl border hover:border-primary/30 hover:shadow-lg transition-all bg-gradient-to-r from-background to-muted/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">
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
                          <Badge className="bg-success/10 text-success border-success/20">
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
                  <p className="text-muted-foreground mb-6">
                    Découvrez nos services et réservez votre première prestation
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = '/services'}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Découvrir nos services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Évolution mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="spent" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Répartition des services</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Quick Actions and Insights */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions?.map((action, index) => (
                <Button 
                  key={action.id}
                  variant="outline" 
                  className="w-full justify-start p-4 h-auto hover:bg-primary/5 transition-all"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
                      {action.icon === 'Calendar' && <Calendar className="w-5 h-5 text-blue-600" />}
                      {action.icon === 'Clock' && <Clock className="w-5 h-5 text-blue-600" />}
                      {action.icon === 'CreditCard' && <CreditCard className="w-5 h-5 text-blue-600" />}
                      {action.icon === 'Gift' && <Gift className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {action.title}
                        {action.urgent && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                      {action.count > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {action.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  Aucune action rapide disponible
                </p>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Program */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Programme fidélité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary mb-2">
                  {(stats?.completedBookings || 0) * 10} points
                </div>
                <Progress value={enhancedMetrics?.loyaltyProgress || 0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Niveau: {(stats?.completedBookings || 0) > 10 ? 'Premium' : 'Standard'}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                  <Heart className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium">Réduction fidélité</div>
                    <div className="text-sm text-muted-foreground">-5% sur votre prochaine réservation</div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Voir mes avantages
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernClientDashboard;