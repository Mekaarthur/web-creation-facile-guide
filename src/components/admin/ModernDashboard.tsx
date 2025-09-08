import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Euro, 
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Activity,
  Calendar,
  Zap
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Mock data - À remplacer par des données réelles
const revenueData = [
  { name: 'Sem 1', revenue: 98000, growth: 12 },
  { name: 'Sem 2', revenue: 105000, growth: 15 },
  { name: 'Sem 3', revenue: 118000, growth: 18 },
  { name: 'Sem 4', revenue: 125000, growth: 22 },
];

const userGrowthData = [
  { name: 'Jan', users: 6200 },
  { name: 'Fév', users: 6800 },
  { name: 'Mar', users: 7400 },
  { name: 'Avr', users: 7800 },
  { name: 'Mai', users: 8200 },
];

const serviceData = [
  { name: 'Bika Kids', value: 33, color: '#3b82f6' },
  { name: 'Bika Maison', value: 25, color: '#10b981' },
  { name: 'Bika Vie', value: 18, color: '#f59e0b' },
  { name: 'Bika Travel', value: 12, color: '#8b5cf6' },
  { name: 'Autres', value: 12, color: '#6b7280' },
];

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  subtitle,
  trend
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: any;
  subtitle?: string;
  trend?: number[];
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {change && (
          <Badge variant={changeType === 'positive' ? 'default' : 'destructive'} className="text-xs">
            {changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      
      {trend && (
        <div className="mt-4 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.map((value, index) => ({ value, index }))}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  </Card>
);

const AlertItem = ({ 
  type, 
  message, 
  time, 
  priority 
}: { 
  type: 'warning' | 'error' | 'info';
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
    <div className={`mt-0.5 ${
      type === 'error' ? 'text-destructive' : 
      type === 'warning' ? 'text-amber-500' : 
      'text-blue-500'
    }`}>
      {type === 'error' && <AlertTriangle className="w-4 h-4" />}
      {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
      {type === 'info' && <Activity className="w-4 h-4" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{time}</p>
    </div>
    <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary'}>
      {priority}
    </Badge>
  </div>
);

export default function ModernDashboard() {
  const [stats, setStats] = useState({
    revenue: { value: 125847, change: '+12%', trend: [98000, 105000, 118000, 125000, 125847] },
    users: { value: 8234, change: '+5%', trend: [7800, 7900, 8000, 8100, 8234] },
    missions: { value: 147, change: '+8%', trend: [120, 125, 135, 140, 147] },
    satisfaction: { value: 4.8, change: '+0.1', trend: [4.6, 4.7, 4.7, 4.8, 4.8] }
  });

  const alerts = [
    {
      type: 'warning' as const,
      message: '3 prestataires en attente de validation depuis plus de 48h',
      time: 'Il y a 2 heures',
      priority: 'high' as const
    },
    {
      type: 'error' as const,
      message: 'Taux de satisfaction Bika Maison: 4.2/5 (seuil: 4.5)',
      time: 'Il y a 30 min',
      priority: 'high' as const
    },
    {
      type: 'warning' as const,
      message: 'Commission impayée: 2 347€ (5 prestataires)',
      time: 'Il y a 1 heure',
      priority: 'medium' as const
    },
    {
      type: 'info' as const,
      message: 'Nouveau client inscrit: Thomas Martin (Bika Maison)',
      time: 'Il y a 10 min',
      priority: 'low' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Bikawo</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble temps réel de votre plateforme • {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Chiffre d'Affaires"
          value={`${stats.revenue.value.toLocaleString()}€`}
          change={stats.revenue.change}
          changeType="positive"
          icon={Euro}
          subtitle="vs mois dernier"
          trend={stats.revenue.trend}
        />
        
        <MetricCard
          title="Utilisateurs Actifs"
          value={stats.users.value.toLocaleString()}
          change={stats.users.change}
          changeType="positive"
          icon={Users}
          subtitle="clients inscrits"
          trend={stats.users.trend}
        />
        
        <MetricCard
          title="Missions Aujourd'hui"
          value={stats.missions.value}
          change={stats.missions.change}
          changeType="positive"
          icon={Target}
          subtitle="missions en cours"
          trend={stats.missions.trend}
        />
        
        <MetricCard
          title="Satisfaction Globale"
          value={`${stats.satisfaction.value}/5`}
          change={stats.satisfaction.change}
          changeType="positive"
          icon={Star}
          subtitle="note moyenne"
          trend={stats.satisfaction.trend}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Évolution des Revenus (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value/1000}k€`} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()}€`, 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Croissance Utilisateurs (5 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip 
                    formatter={(value) => [value.toLocaleString(), 'Utilisateurs']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Répartition Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {serviceData.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: service.color }}
                    />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <span className="text-sm font-medium">{service.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertes & Activité Récente
            </CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.map((alert, index) => (
                <AlertItem key={index} {...alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-sm">Valider Prestataires</span>
              <Badge variant="destructive">3</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span className="text-sm">Gérer Litiges</span>
              <Badge variant="default">5</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Euro className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Paiements</span>
              <Badge variant="default">23k€</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              <span className="text-sm">Planning</span>
              <Badge variant="secondary">147</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}