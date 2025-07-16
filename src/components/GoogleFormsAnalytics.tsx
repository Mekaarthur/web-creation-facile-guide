import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetrics {
  conversionRate: number;
  averageResponseTime: number;
  satisfactionScore: number;
  weeklyGrowth: number;
  topPerformingServices: Array<{ service: string; count: number; conversion: number }>;
  demandTrends: Array<{ period: string; requests: number; conversions: number }>;
}

export const GoogleFormsAnalytics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    conversionRate: 0,
    averageResponseTime: 0,
    satisfactionScore: 0,
    weeklyGrowth: 0,
    topPerformingServices: [],
    demandTrends: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('client_requests')
        .select('*');

      if (error) throw error;

      if (!requests || requests.length === 0) {
        setLoading(false);
        return;
      }

      // Calcul du taux de conversion
      const totalRequests = requests.length;
      const convertedRequests = requests.filter(r => r.status === 'converted').length;
      const conversionRate = totalRequests > 0 ? (convertedRequests / totalRequests) * 100 : 0;

      // Calcul du temps de réponse moyen (en heures)
      const responseTimes = requests
        .filter(r => r.status !== 'new')
        .map(r => {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          return (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // en heures
        });
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      // Croissance hebdomadaire
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const thisWeek = requests.filter(r => new Date(r.created_at) >= oneWeekAgo).length;
      const lastWeek = requests.filter(r => {
        const date = new Date(r.created_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;

      const weeklyGrowth = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : thisWeek > 0 ? 100 : 0;

      // Services les plus performants
      const serviceStats = requests.reduce((acc, request) => {
        const service = request.service_type;
        if (!acc[service]) {
          acc[service] = { total: 0, converted: 0 };
        }
        acc[service].total++;
        if (request.status === 'converted') {
          acc[service].converted++;
        }
        return acc;
      }, {} as Record<string, { total: number; converted: number }>);

      const topPerformingServices = Object.entries(serviceStats)
        .map(([service, stats]) => ({
          service,
          count: stats.total,
          conversion: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Tendances de demande (dernières 4 semaines)
      const demandTrends = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekRequests = requests.filter(r => {
          const date = new Date(r.created_at);
          return date >= weekStart && date < weekEnd;
        });

        demandTrends.push({
          period: `Semaine ${4 - i}`,
          requests: weekRequests.length,
          conversions: weekRequests.filter(r => r.status === 'converted').length
        });
      }

      setMetrics({
        conversionRate,
        averageResponseTime,
        satisfactionScore: 85, // Score fixe pour l'exemple
        weeklyGrowth,
        topPerformingServices,
        demandTrends
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de conversion</p>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {metrics.conversionRate >= 50 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrics.conversionRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.conversionRate >= 50 ? 'Excellent' : 'À améliorer'}
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps de réponse moyen</p>
                <p className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(1)}h</p>
                <div className="flex items-center mt-2">
                  {metrics.averageResponseTime <= 24 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrics.averageResponseTime <= 24 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {metrics.averageResponseTime <= 24 ? 'Rapide' : 'Peut mieux faire'}
                  </span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score de satisfaction</p>
                <p className="text-2xl font-bold">{metrics.satisfactionScore}%</p>
                <Progress value={metrics.satisfactionScore} className="mt-2 h-2" />
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Croissance hebdomadaire</p>
                <p className="text-2xl font-bold">
                  {metrics.weeklyGrowth >= 0 ? '+' : ''}{metrics.weeklyGrowth.toFixed(1)}%
                </p>
                <div className="flex items-center mt-2">
                  {metrics.weeklyGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrics.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    vs semaine précédente
                  </span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Services les plus demandés</CardTitle>
            <CardDescription>Classement par nombre de demandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topPerformingServices.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">{service.count} demandes</p>
                    </div>
                  </div>
                  <Badge variant={service.conversion >= 50 ? "default" : "secondary"}>
                    {service.conversion.toFixed(0)}% conversion
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendances de demande</CardTitle>
            <CardDescription>Évolution sur 4 semaines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.demandTrends.map((trend, index) => (
                <div key={trend.period} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{trend.period}</span>
                    <span className="text-sm text-muted-foreground">
                      {trend.requests} demandes, {trend.conversions} conversions
                    </span>
                  </div>
                  <Progress 
                    value={trend.requests > 0 ? (trend.conversions / trend.requests) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};