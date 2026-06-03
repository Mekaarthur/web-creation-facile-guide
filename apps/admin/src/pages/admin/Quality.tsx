import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Minus, Loader2 } from "lucide-react";
import SystemHealthCheck from "@/components/admin/SystemHealthCheck";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const AdminQuality = () => {
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['quality-reviews'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating, created_at, comment, id, provider_id')
        .order('created_at', { ascending: false });
      return data ?? [];
    }
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['quality-bookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status, created_at');
      return data ?? [];
    }
  });

  const isLoading = reviewsLoading || bookingsLoading;

  // Calcul satisfaction client
  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
    : 0;

  // Calcul taux de complétion
  const completedBookings = bookings?.filter(b => b.status === 'completed').length ?? 0;
  const totalBookings = bookings?.length ?? 0;
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  // Taux de réclamation (avis <= 2)
  const lowRatings = reviews?.filter(r => r.rating <= 2).length ?? 0;
  const complaintRate = reviews?.length > 0 ? (lowRatings / reviews.length) * 100 : 0;

  // Avis récents négatifs comme problèmes qualité
  const qualityIssues = reviews?.filter(r => r.rating <= 2).slice(0, 10) ?? [];

  // Données mensuelles pour le graphique (6 derniers mois)
  const monthlyData = (() => {
    const months: Record<string, { month: string; avgRating: number; count: number; total: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        avgRating: 0,
        count: 0,
        total: 0
      };
    }
    reviews?.forEach(r => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) {
        months[key].total += r.rating ?? 0;
        months[key].count += 1;
      }
    });
    return Object.values(months).map(m => ({
      ...m,
      avgRating: m.count > 0 ? parseFloat((m.total / m.count).toFixed(2)) : 0
    }));
  })();

  // Répartition des avis par note
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews?.filter(r => r.rating === star).length ?? 0,
    pct: reviews?.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0
  }));

  const metrics = [
    {
      id: '1',
      name: 'Satisfaction client',
      value: avgRating,
      target: 4.5,
      trend: avgRating >= 4.5 ? 'up' : avgRating >= 4.0 ? 'stable' : 'down',
      display: avgRating.toFixed(1) + '/5',
      progressValue: (avgRating / 5) * 100,
      targetDisplay: '4.5/5'
    },
    {
      id: '2',
      name: 'Taux de complétion',
      value: completionRate,
      target: 95,
      trend: completionRate >= 95 ? 'up' : completionRate >= 80 ? 'stable' : 'down',
      display: completionRate.toFixed(1) + '%',
      progressValue: completionRate,
      targetDisplay: '95%'
    },
    {
      id: '3',
      name: 'Avis positifs',
      value: reviews?.length ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0,
      target: 80,
      trend: reviews?.length && (reviews.filter(r => r.rating >= 4).length / reviews.length) >= 0.8 ? 'up' : 'stable',
      display: reviews?.length ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) + '%' : '0%',
      progressValue: reviews?.length ? (reviews.filter(r => r.rating >= 4).length / reviews.length) * 100 : 0,
      targetDisplay: '80%'
    },
    {
      id: '4',
      name: 'Taux de réclamation',
      value: complaintRate,
      target: 5,
      trend: complaintRate <= 5 ? 'up' : complaintRate <= 10 ? 'stable' : 'down',
      display: complaintRate.toFixed(1) + '%',
      progressValue: Math.min(complaintRate * 10, 100),
      targetDisplay: '< 5%',
      inverted: true
    }
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getMetricColor = (metric: typeof metrics[0]) => {
    if (metric.inverted) return metric.value <= metric.target ? 'text-green-600' : 'text-red-600';
    return metric.value >= metric.target ? 'text-green-600' : metric.value >= metric.target * 0.85 ? 'text-yellow-600' : 'text-red-600';
  };

  const getRatingBadge = (rating: number) => {
    if (rating <= 1) return <Badge variant="destructive">Critique</Badge>;
    if (rating <= 2) return <Badge variant="default" className="bg-red-500">Faible</Badge>;
    return <Badge variant="outline">Moyen</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Qualité</h1>
        <p className="text-muted-foreground">Suivi de la qualité des services — données en temps réel</p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(metric)}`}>
                {metric.display}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Objectif : {metric.targetDisplay}</span>
                  <span>{reviews?.length ?? 0} avis</span>
                </div>
                <Progress value={metric.progressValue} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="issues">
            Avis négatifs
            {qualityIssues.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{qualityIssues.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tests">Tests Système</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de performance</CardTitle>
                <CardDescription>KPIs qualité basés sur {totalBookings} réservations et {reviews?.length ?? 0} avis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <span className={`text-sm font-bold ${getMetricColor(metric)}`}>
                        {metric.display}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des notes</CardTitle>
                <CardDescription>Distribution des {reviews?.length ?? 0} avis clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingDistribution.map(({ star, count, pct }) => (
                    <div key={star}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1">
                          {star} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </span>
                        <span className="text-muted-foreground">{count} avis ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis négatifs récents</CardTitle>
              <CardDescription>Avis clients avec note ≤ 2/5 nécessitant une attention</CardDescription>
            </CardHeader>
            <CardContent>
              {qualityIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Aucun avis négatif — excellente qualité de service !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qualityIssues.map((issue) => (
                    <Card key={issue.id} className="p-4 border-red-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`h-4 w-4 ${s <= issue.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                            {getRatingBadge(issue.rating)}
                          </div>
                          {issue.comment && (
                            <p className="text-sm text-muted-foreground mb-2 italic">"{issue.comment}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(issue.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          À traiter
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <SystemHealthCheck />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la satisfaction</CardTitle>
                <CardDescription>Note moyenne mensuelle sur les 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.some(m => m.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(2) + '/5', 'Note moyenne']}
                      />
                      <Line type="monotone" dataKey="avgRating" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3" />
                    <p>Pas encore assez de données</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avis par mois</CardTitle>
                <CardDescription>Nombre d'avis reçus par mois</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.some(m => m.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [value, 'Avis']} />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3" />
                    <p>Pas encore assez de données</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Résumé qualité</CardTitle>
                <CardDescription>Vue consolidée des indicateurs clés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{reviews?.length ?? 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avis total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{avgRating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Note moyenne</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{completedBookings}</p>
                    <p className="text-sm text-muted-foreground mt-1">Missions complètes</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{qualityIssues.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avis négatifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminQuality;
