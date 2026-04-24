import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAlertsPanel } from '../../AdminAlertsPanel';
import { MissionAssignmentTrigger } from '../../MissionAssignmentTrigger';
import { AutomatedReports } from '../AutomatedReports';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Euro,
  Star,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  UserCheck,
  MessageSquare,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  FileText,
  Calendar,
  CreditCard,
  MapPin,
  Settings,
  UserCog,
  Gift,
  Lock,
  Landmark
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowEmails } from "@/hooks/useWorkflowEmails";
import { useEmergencyOrchestration } from "@/hooks/useEmergencyOrchestration";
import { useAdminCounts } from "@/hooks/useAdminCounts";

interface DashboardStats {
  revenue:      { value: number; change: string; trend: number[] };
  users:        { value: number; change: string; trend: number[] };
  missions:     { value: number; change: string; trend: number[] };
  satisfaction: { value: number; change: string; trend: number[] };
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
  amount?: string;
}

interface ServicePerformance {
  name: string;
  missions: number;
  revenue: number;
  satisfaction: number;
  growth: number;
}

interface AdminStats {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_reviews: number;
  flagged_reviews: number;
}

// ─── Metric Card ────────────────────────────────────────────────────────────

const MetricCard = ({
  title, value, change, changeType, icon: Icon, subtitle, trend, loading = false
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ElementType;
  subtitle?: string;
  trend?: number[];
  loading?: boolean;
}) => (
  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {change && !loading && (
          <Badge variant={changeType === 'positive' ? 'default' : 'destructive'} className="text-xs">
            {changeType === 'positive'
              ? <TrendingUp className="w-3 h-3 mr-1" />
              : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold mb-1">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && trend.length > 0 && (
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend.map((v, i) => ({ value: v, index: i }))}>
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
        </>
      )}
    </CardContent>
  </Card>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EnhancedModernDashboard() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { data: counts } = useAdminCounts();

  useWorkflowEmails();
  useEmergencyOrchestration();

  const [stats, setStats] = useState<DashboardStats>({
    revenue:      { value: 0, change: '+0%', trend: [] },
    users:        { value: 0, change: '+0%', trend: [] },
    missions:     { value: 0, change: '+0%', trend: [] },
    satisfaction: { value: 0, change: '+0',  trend: [] },
  });
  const [activities,          setActivities]          = useState<ActivityItem[]>([]);
  const [servicePerformance,  setServicePerformance]  = useState<ServicePerformance[]>([]);
  const [revenueData,         setRevenueData]         = useState<any[]>([]);
  const [adminStats,          setAdminStats]          = useState<AdminStats>({
    total_users: 0, total_providers: 0, total_bookings: 0,
    total_revenue: 0, pending_reviews: 0, flagged_reviews: 0,
  });
  const [quickActionCounts, setQuickActionCounts] = useState({
    pendingProviders: 0, pendingAlerts: 0, totalRevenue: 0, unreadMessages: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [timeRange,  setTimeRange]  = useState('7d');

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_stats', timeRange }
      });
      if (!error && data?.success) setStats(data.stats);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_activities', limit: 10 }
      });
      if (!error && data?.success) setActivities(data.activities);
    } catch (_) {}
  };

  const loadServicePerformance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_service_performance', timeRange }
      });
      if (!error && data?.success) setServicePerformance(data.servicePerformance);
    } catch (_) {}
  };

  const loadAdminStats = async () => {
    try {
      const [
        usersCount, providersCount, bookingsCount, reviewsData,
        pendingProvidersCount, unreadMessagesCount, completedBookings, pendingBookingsCount
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('*'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_validation']),
        supabase.from('internal_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('bookings').select('total_price').eq('status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const pendingReviews  = reviewsData.data?.filter(r => !r.is_approved) || [];
      const flaggedReviews  = reviewsData.data?.filter(r => r.is_approved === false) || [];
      const totalRevenue    = completedBookings.data?.reduce((s, b) => s + (b.total_price || 0), 0) || 0;
      const alertsCount     = (pendingProvidersCount.count || 0) + (pendingBookingsCount.count || 0) + pendingReviews.length;

      setAdminStats({
        total_users:     usersCount.count    || 0,
        total_providers: providersCount.count || 0,
        total_bookings:  bookingsCount.count  || 0,
        total_revenue:   totalRevenue,
        pending_reviews: pendingReviews.length,
        flagged_reviews: flaggedReviews.length,
      });
      setQuickActionCounts({
        pendingProviders: pendingProvidersCount.count || 0,
        pendingAlerts:    alertsCount,
        totalRevenue:     totalRevenue,
        unreadMessages:   unreadMessagesCount.count || 0,
      });
    } catch (_) {}
  };

  const handleExportData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'export_data', type: 'providers', format: 'csv' }
      });
      if (error) throw error;
      if (data?.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Export terminé" });
      }
    } catch (_) {
      toast({ title: "Erreur d'export", variant: "destructive" });
    }
  };

  const refreshData = async () => {
    await Promise.all([
      loadDashboardData(),
      loadActivities(),
      loadServicePerformance(),
      loadAdminStats(),
    ]);
  };

  useEffect(() => { refreshData(); }, [timeRange]);

  // ─── Navigation rapide items ───────────────────────────────────────────────

  const navItems = [
    { label: "Utilisateurs",      href: "/modern-admin/utilisateurs",  icon: UserCog,       count: 0 },
    { label: "Clients",           href: "/modern-admin/clients",        icon: Users,         count: 0 },
    { label: "Prestataires",      href: "/modern-admin/providers",      icon: UserCheck,     count: counts?.prestatairesPending || 0 },
    { label: "Candidatures",      href: "/modern-admin/applications",   icon: FileText,      count: counts?.candidatures || 0 },
    { label: "Missions",          href: "/modern-admin/missions",       icon: Target,        count: counts?.missionsPending || 0 },
    { label: "Réservations",      href: "/modern-admin/reservations",   icon: Calendar,      count: 0 },
    { label: "Paiements",         href: "/modern-admin/payments",       icon: CreditCard,    count: 0 },
    { label: "Factures",          href: "/modern-admin/invoices",       icon: FileText,      count: 0 },
    { label: "Messages",          href: "/modern-admin/messages",       icon: MessageSquare, count: counts?.messages || 0 },
    { label: "Alertes",           href: "/modern-admin/alerts",         icon: AlertTriangle, count: counts?.alerts || 0 },
    { label: "Avis & Modération", href: "/modern-admin/reviews",        icon: Star,          count: counts?.moderation || 0 },
    { label: "Finance",           href: "/modern-admin/finance",        icon: Euro,          count: 0 },
    { label: "Avance Immédiate",  href: "/modern-admin/urssaf-declarations", icon: Landmark, count: 0 },
    { label: "Matching IA",       href: "/modern-admin/matching",       icon: Zap,           count: 0 },
    { label: "Binômes",           href: "/modern-admin/binomes",        icon: Gift,          count: 0 },
    { label: "Sécurité",          href: "/modern-admin/security",       icon: Lock,          count: 0 },
    { label: "Zones",             href: "/modern-admin/zones",          icon: MapPin,        count: 0 },
    { label: "Paramètres",        href: "/modern-admin/settings",       icon: Settings,      count: 0 },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard Bikawo</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble • {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">3 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Chiffre d'Affaires"
          value={`${stats.revenue.value.toLocaleString()}€`}
          change={stats.revenue.change}
          changeType="positive"
          icon={Euro}
          subtitle="vs période précédente"
          trend={stats.revenue.trend}
          loading={loading}
        />
        <MetricCard
          title="Utilisateurs Actifs"
          value={stats.users.value.toLocaleString()}
          change={stats.users.change}
          changeType="positive"
          icon={Users}
          subtitle={`${adminStats.total_users} inscrits au total`}
          trend={stats.users.trend}
          loading={loading}
        />
        <MetricCard
          title="Missions Actives"
          value={stats.missions.value}
          change={stats.missions.change}
          changeType="positive"
          icon={Target}
          subtitle={`${adminStats.total_bookings} réservations total`}
          trend={stats.missions.trend}
          loading={loading}
        />
        <MetricCard
          title="Satisfaction Globale"
          value={`${stats.satisfaction.value}/5`}
          change={stats.satisfaction.change}
          changeType="positive"
          icon={Star}
          subtitle={`${adminStats.pending_reviews} avis en attente`}
          trend={stats.satisfaction.trend}
          loading={loading}
        />
      </div>

      {/* Triggers système */}
      <MissionAssignmentTrigger />
      <AdminAlertsPanel onNavigate={() => {}} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Évolution des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toLocaleString()}€`, 'Revenu']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Performance par Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicePerformance.length > 0 ? servicePerformance : [
                  { name: 'Bika Kids',   missions: 0, revenue: 0 },
                  { name: 'Bika Maison', missions: 0, revenue: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number, name: string) => [
                    name === 'missions' ? `${v} missions` : `${v}€`, name
                  ]} />
                  <Bar dataKey="missions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
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
              onClick={() => navigate('/modern-admin/providers')}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
              <span className="text-sm">Valider Prestataires</span>
              {quickActionCounts.pendingProviders > 0 && (
                <Badge variant="destructive">{quickActionCounts.pendingProviders}</Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/modern-admin/alerts')}
              disabled={loading}
            >
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span className="text-sm">Gérer Alertes</span>
              {quickActionCounts.pendingAlerts > 0 && (
                <Badge variant="default">{quickActionCounts.pendingAlerts}</Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/modern-admin/payments')}
              disabled={loading}
            >
              <Euro className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Paiements</span>
              <Badge variant="default">
                {quickActionCounts.totalRevenue > 0
                  ? `${Math.round(quickActionCounts.totalRevenue / 1000)}k€`
                  : '0€'}
              </Badge>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/modern-admin/messages')}
              disabled={loading}
            >
              <MessageSquare className="w-6 h-6 text-purple-500" />
              <span className="text-sm">Messages</span>
              {quickActionCounts.unreadMessages > 0 && (
                <Badge variant="secondary">{quickActionCounts.unreadMessages}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation rapide vers les modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Accès Rapide aux Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-center group"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground leading-tight">
                    {item.label}
                  </span>
                  {item.count > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 text-[9px] px-1 py-0 min-w-[16px] h-4 flex items-center justify-center"
                    >
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activité récente + Rapports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    activity.status === 'pending' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">{activity.amount}</Badge>
                  )}
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aucune activité récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AutomatedReports />
      </div>
    </div>
  );
}
