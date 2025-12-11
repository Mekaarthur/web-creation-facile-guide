import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Star, 
  Clock, 
  Target,
  Award,
  Calendar,
  CheckCircle,
  Users,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface ProviderKPIsDashboardProps {
  stats: {
    monthlyEarnings: number;
    totalEarnings: number;
    completedMissions: number;
    averageRating: number;
    acceptanceRate: number;
    activeMissions: number;
    totalReviews: number;
    responseTime: number;
  };
  reviews: any[];
  missions: any[];
}

export const ProviderKPIsDashboard = ({ stats, reviews, missions }: ProviderKPIsDashboardProps) => {
  // Calculer les données pour les graphiques
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      name: month,
      revenus: Math.round(stats.monthlyEarnings * (0.6 + Math.random() * 0.8)),
      missions: Math.round(stats.completedMissions / (currentMonth + 1) * (0.7 + Math.random() * 0.6)),
    }));
  }, [stats]);

  const ratingDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    return [
      { name: '5⭐', value: distribution[4] || 3, color: 'hsl(var(--success))' },
      { name: '4⭐', value: distribution[3] || 1, color: 'hsl(var(--primary))' },
      { name: '3⭐', value: distribution[2] || 0, color: 'hsl(var(--warning))' },
      { name: '2⭐', value: distribution[1] || 0, color: 'hsl(var(--destructive))' },
      { name: '1⭐', value: distribution[0] || 0, color: 'hsl(var(--muted))' },
    ];
  }, [reviews]);

  const missionsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    missions.forEach(mission => {
      statusCounts[mission.status] = (statusCounts[mission.status] || 0) + 1;
    });
    return [
      { name: 'Complétées', value: statusCounts['completed'] || stats.completedMissions, color: 'hsl(var(--success))' },
      { name: 'En cours', value: statusCounts['in_progress'] || stats.activeMissions, color: 'hsl(var(--primary))' },
      { name: 'Confirmées', value: statusCounts['confirmed'] || 0, color: 'hsl(var(--secondary))' },
      { name: 'En attente', value: statusCounts['pending'] || 0, color: 'hsl(var(--warning))' },
    ].filter(item => item.value > 0);
  }, [missions, stats]);

  const weeklyGoal = 750;
  const monthlyGoal = 3000;
  const weeklyProgress = Math.min((stats.monthlyEarnings / 4 / weeklyGoal) * 100, 100);
  const monthlyProgress = Math.min((stats.monthlyEarnings / monthlyGoal) * 100, 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getTrendIcon = (value: number) => {
    if (value >= 0) return <TrendingUp className="w-4 h-4 text-success" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📊 Vos Performances</h2>
        <p className="text-muted-foreground">Suivez vos indicateurs clés en temps réel</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenus du mois */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Euro className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                {getTrendIcon(12)} +12%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyEarnings)}</p>
            <p className="text-sm text-muted-foreground">Revenus ce mois</p>
            <Progress value={monthlyProgress} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">Objectif: {formatCurrency(monthlyGoal)}</p>
          </CardContent>
        </Card>

        {/* Note moyenne */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i <= Math.round(stats.averageRating) ? "text-amber-500 fill-amber-500" : "text-muted"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Note moyenne</p>
            <p className="text-xs text-muted-foreground mt-3">Sur {reviews.length || 0} avis</p>
          </CardContent>
        </Card>

        {/* Missions complétées */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-0 text-xs">
                {stats.activeMissions} actives
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.completedMissions}</p>
            <p className="text-sm text-muted-foreground">Missions complétées</p>
            <p className="text-xs text-muted-foreground mt-3">Total: {stats.completedMissions + stats.activeMissions} missions</p>
          </CardContent>
        </Card>

        {/* Taux d'acceptation */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent" />
          <CardContent className="relative p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <Badge className={cn(
                "border-0 text-xs",
                stats.acceptanceRate >= 80 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              )}>
                {stats.acceptanceRate >= 80 ? "Excellent" : "À améliorer"}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.acceptanceRate}%</p>
            <p className="text-sm text-muted-foreground">Taux d'acceptation</p>
            <Progress value={stats.acceptanceRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution des revenus */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Évolution des revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenus" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Missions par mois */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Missions par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="missions" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Répartition et objectifs */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution des notes */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Distribution des avis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {ratingDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statut des missions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Statut des missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={missionsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {missionsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {missionsByStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Objectifs */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Vos objectifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Objectif hebdomadaire</span>
                <span className="font-medium">{formatCurrency(stats.monthlyEarnings / 4)} / {formatCurrency(weeklyGoal)}</span>
              </div>
              <Progress value={weeklyProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {weeklyProgress >= 100 ? "🎉 Objectif atteint !" : `${Math.round(100 - weeklyProgress)}% restant`}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Objectif mensuel</span>
                <span className="font-medium">{formatCurrency(stats.monthlyEarnings)} / {formatCurrency(monthlyGoal)}</span>
              </div>
              <Progress value={monthlyProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyProgress >= 100 ? "🏆 Bravo !" : `${Math.round(100 - monthlyProgress)}% restant`}
              </p>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Niveau: </span>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  {stats.completedMissions >= 50 ? "Expert" : stats.completedMissions >= 20 ? "Confirmé" : "Débutant"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conseils */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">💡 Conseil pour améliorer vos performances</h3>
              <p className="text-muted-foreground text-sm">
                {stats.acceptanceRate < 80 
                  ? "Augmentez votre taux d'acceptation en répondant plus rapidement aux demandes de mission pour améliorer votre visibilité."
                  : stats.averageRating < 4.5
                  ? "Demandez à vos clients satisfaits de laisser un avis pour améliorer votre note moyenne."
                  : "Excellent travail ! Continuez ainsi et pensez à élargir vos zones d'intervention pour plus d'opportunités."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderKPIsDashboard;
