import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap,
  MessageSquare
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCounts } from "@/hooks/useAdminCounts";

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
  const navigate = useNavigate();
  const { data: adminCounts } = useAdminCounts();
  const [stats, setStats] = useState({
    revenue: { value: 0, change: '', trend: [] as number[] },
    users: { value: 0, change: '', trend: [] as number[] },
    missions: { value: 0, change: '', trend: [] as number[] },
    satisfaction: { value: 0, change: '', trend: [] as number[] }
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [quickStats, setQuickStats] = useState({
    pendingProviders: 0,
    pendingAlerts: 0,
    totalRevenue: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load revenue data from bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_price, booking_date, status')
          .eq('status', 'completed')
          .gte('booking_date', format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
          .order('booking_date');

        // Aggregate revenue by week
        const revenueByWeek = bookings?.reduce((acc: any, booking) => {
          const weekStart = format(new Date(booking.booking_date), 'dd MMM', { locale: fr });
          if (!acc[weekStart]) acc[weekStart] = 0;
          acc[weekStart] += booking.total_price;
          return acc;
        }, {}) || {};

        setRevenueData(Object.entries(revenueByWeek).map(([name, revenue]) => ({ name, revenue })));

        // Calculate total revenue
        const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

        // Load user count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        // Load user growth data from profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', format(subMonths(new Date(), 5), 'yyyy-MM-dd'))
          .order('created_at');

        // Aggregate users by month
        const usersByMonth = profiles?.reduce((acc: any, profile) => {
          const month = format(startOfMonth(new Date(profile.created_at)), 'MMM yyyy', { locale: fr });
          if (!acc[month]) acc[month] = 0;
          acc[month] += 1;
          return acc;
        }, {}) || {};

        let cumulative = 0;
        setUserGrowthData(Object.entries(usersByMonth).map(([name, count]: [string, any]) => {
          cumulative += count;
          return { name, users: cumulative };
        }));

        // Load missions count for today
        const today = new Date().toISOString().split('T')[0];
        const { count: todayMissions } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('booking_date', today);

        // Load average rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('is_approved', true);
        
        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        // Load service distribution
        const { data: serviceBookings } = await supabase
          .from('bookings')
          .select('service_id, services(name)')
          .eq('status', 'completed');

        const serviceCount = serviceBookings?.reduce((acc: any, booking: any) => {
          const serviceName = booking.services?.name || 'Autre';
          if (!acc[serviceName]) acc[serviceName] = 0;
          acc[serviceName] += 1;
          return acc;
        }, {}) || {};

        const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#f59e0b'];
        setServiceData(Object.entries(serviceCount).map(([name, value], index) => ({ 
          name, 
          value, 
          color: COLORS[index % COLORS.length] 
        })));

        // Load pending providers
        const { count: pendingProviders } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'pending_validation']);

        // Load unread messages
        const { count: unreadMessages } = await supabase
          .from('internal_messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false);

        // Update stats
        setStats({
          revenue: { value: totalRevenue, change: '', trend: Object.values(revenueByWeek) as number[] },
          users: { value: usersCount || 0, change: '', trend: [] },
          missions: { value: todayMissions || 0, change: '', trend: [] },
          satisfaction: { value: parseFloat(avgRating.toFixed(1)), change: '', trend: [] }
        });

        setQuickStats({
          pendingProviders: pendingProviders || 0,
          pendingAlerts: adminCounts?.alerts || 0,
          totalRevenue,
          unreadMessages: unreadMessages || 0
        });

        // Build real alerts
        const realAlerts: typeof alerts = [];
        
        if ((pendingProviders || 0) > 0) {
          realAlerts.push({
            type: 'warning',
            message: `${pendingProviders} prestataire(s) en attente de validation`,
            time: 'Maintenant',
            priority: 'high'
          });
        }

        if ((unreadMessages || 0) > 0) {
          realAlerts.push({
            type: 'info',
            message: `${unreadMessages} message(s) non lu(s)`,
            time: 'Maintenant',
            priority: 'medium'
          });
        }

        const { count: pendingBookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        if ((pendingBookings || 0) > 0) {
          realAlerts.push({
            type: 'warning',
            message: `${pendingBookings} réservation(s) en attente`,
            time: 'Maintenant',
            priority: 'medium'
          });
        }

        setAlerts(realAlerts);

      } catch (error) {
        console.error('Error loading chart data:', error);
      }
    };

    loadAllData();
  }, [adminCounts]);

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
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/admin/providers?status=pending')}
            >
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-sm">Valider Prestataires</span>
              <Badge variant="destructive">{quickStats.pendingProviders}</Badge>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/admin/alerts')}
            >
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span className="text-sm">Gérer Alertes</span>
              <Badge variant="default">{quickStats.pendingAlerts}</Badge>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/admin/payments')}
            >
              <Euro className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Paiements</span>
              <Badge variant="default">{quickStats.totalRevenue > 0 ? `${Math.round(quickStats.totalRevenue / 1000)}k€` : '0€'}</Badge>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/admin/messages')}
            >
              <MessageSquare className="w-6 h-6 text-purple-500" />
              <span className="text-sm">Messages</span>
              <Badge variant="secondary">{quickStats.unreadMessages}</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}