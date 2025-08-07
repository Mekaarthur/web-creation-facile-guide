import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  Activity,
  Clock,
  Target,
  Award,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  recentBookings: any[];
  monthlyData: any[];
  serviceDistribution: any[];
  performanceMetrics: {
    responseTime: number;
    clientSatisfaction: number;
    repeatClients: number;
    growthRate: number;
  };
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculer la date de début selon la période
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const startDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);

      // Récupérer les réservations
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, category, price_per_hour),
          reviews (rating)
        `)
        .eq('client_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (bookingsError) throw bookingsError;

      // Calculer les métriques
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const ratings = bookings?.flatMap(b => b.reviews || []).map(r => r.rating) || [];
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;

      // Données mensuelles pour les graphiques
      const monthlyData = generateMonthlyData(bookings || [], timeRange);
      
      // Distribution par service
      const serviceDistribution = generateServiceDistribution(bookings || []);

      // Métriques de performance simulées (à remplacer par de vraies données)
      const performanceMetrics = {
        responseTime: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
        clientSatisfaction: averageRating * 20, // Convertir en pourcentage
        repeatClients: Math.floor(Math.random() * 40) + 20, // 20-60%
        growthRate: Math.floor(Math.random() * 50) + 10 // 10-60%
      };

      setAnalyticsData({
        totalBookings,
        totalRevenue,
        averageRating,
        completionRate,
        recentBookings: (bookings || []).slice(0, 5),
        monthlyData,
        serviceDistribution,
        performanceMetrics
      });

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (bookings: any[], range: string) => {
    const months = range === '1y' ? 12 : Math.min(6, parseInt(range));
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear();
      });
      
      data.push({
        month: monthName,
        reservations: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
      });
    }
    
    return data;
  };

  const generateServiceDistribution = (bookings: any[]) => {
    const services = {};
    bookings.forEach(booking => {
      const serviceName = booking.services?.name || 'Autre';
      services[serviceName] = (services[serviceName] || 0) + 1;
    });
    
    return Object.entries(services).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune donnée d'analyse disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Tableau de bord analytique
        </h2>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <Button
              key={period}
              variant={timeRange === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(period)}
            >
              {period === '7d' ? '7 jours' : 
               period === '30d' ? '30 jours' :
               period === '90d' ? '3 mois' : '1 an'}
            </Button>
          ))}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Réservations</p>
                <p className="text-2xl font-bold">{analyticsData.totalBookings}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{analyticsData.performanceMetrics.growthRate}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }).format(analyticsData.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15% ce mois
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Note moyenne</p>
                <p className="text-2xl font-bold">{analyticsData.averageRating.toFixed(1)}/5</p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${
                        i < Math.floor(analyticsData.averageRating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de réussite</p>
                <p className="text-2xl font-bold">{analyticsData.completionRate.toFixed(0)}%</p>
                <Progress value={analyticsData.completionRate} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution temporelle */}
        <AnimatedCard className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Évolution des réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="reservations" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Réservations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </AnimatedCard>

        {/* Distribution des services */}
        <AnimatedCard className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition par service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.serviceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {analyticsData.serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Métriques de performance */}
      <AnimatedCard className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Indicateurs de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.performanceMetrics.responseTime} min</p>
              <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
              <Progress value={(60 - analyticsData.performanceMetrics.responseTime) / 60 * 100} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.performanceMetrics.clientSatisfaction.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Satisfaction client</p>
              <Progress value={analyticsData.performanceMetrics.clientSatisfaction} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.performanceMetrics.repeatClients}%</p>
              <p className="text-sm text-muted-foreground">Clients fidèles</p>
              <Progress value={analyticsData.performanceMetrics.repeatClients} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">+{analyticsData.performanceMetrics.growthRate}%</p>
              <p className="text-sm text-muted-foreground">Croissance</p>
              <Progress value={analyticsData.performanceMetrics.growthRate} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </AnimatedCard>
    </div>
  );
};