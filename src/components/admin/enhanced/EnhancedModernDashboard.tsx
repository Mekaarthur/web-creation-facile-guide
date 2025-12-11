import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminClientRequests } from '../../AdminClientRequests';
import { AdminClientRequestsEnhanced } from '../../AdminClientRequestsEnhanced';
import { AdminManualAssignment } from '../../AdminManualAssignment';
import { AdminAlertsPanel } from '../../AdminAlertsPanel';
import { AdminKanbanBoard } from '../../AdminKanbanBoard';
import { AdminMatchingPanel } from '../../AdminMatchingPanel';
import ModernMessaging from '../ModernMessaging';
import { MissionAssignmentTrigger } from '../../MissionAssignmentTrigger';
import { AutomatedReports } from '../AutomatedReports';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  UserCheck,
  MessageSquare,
  MapPin,
  Filter,
  Search,
  Download,
  RefreshCw,
  MoreHorizontal,
  Phone,
  Mail,
  Loader2,
  Shield,
  Ban,
  Settings,
  Send,
  BarChart3
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowEmails } from "@/hooks/useWorkflowEmails";
import { useEmergencyOrchestration } from "@/hooks/useEmergencyOrchestration";

// Interfaces pour les types de données
interface DashboardStats {
  revenue: {
    value: number;
    change: string;
    trend: number[];
  };
  users: {
    value: number;
    change: string;
    trend: number[];
  };
  missions: {
    value: number;
    change: string;
    trend: number[];
  };
  satisfaction: {
    value: number;
    change: string;
    trend: number[];
  };
}

interface Provider {
  id: string;
  name: string;
  service: string;
  missions: number;
  rating: number;
  revenue: string;
  status: string;
  phone: string;
  email: string;
  location: string;
}

interface Activity {
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

// Interfaces pour les nouvelles fonctionnalités migrées
interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface ProviderDetailed {
  id: string;
  business_name: string | null;
  is_verified: boolean;
  created_at: string;
  rating: number | null;
  user_id: string;
  description?: string;
  location?: string;
  status?: string;
  performance_score?: number;
  missions_this_week?: number;
  last_mission_date?: string;
  identity_document_url?: string;
  insurance_document_url?: string;
  diploma_document_url?: string;
  quality_agreement_signed?: boolean;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  client_id: string;
  provider_id: string;
}

interface JobApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  category: string;
  experience_years: number | null;
  status: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_reviews: number;
  flagged_reviews: number;
}

// Les données revenue et service performance sont chargées via les hooks loadAdminStats et loadServicePerformance

// Les données d'activités récentes sont maintenant chargées dynamiquement via loadActivities

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  subtitle,
  trend,
  loading = false
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: any;
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
            {changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
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
        </>
      )}
    </CardContent>
  </Card>
);

export default function EnhancedModernDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: { value: 0, change: '+0%', trend: [] },
    users: { value: 0, change: '+0%', trend: [] },
    missions: { value: 0, change: '+0%', trend: [] },
    satisfaction: { value: 0, change: '+0', trend: [] }
  });

  // États existants
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

  // Nouveaux états migrés
  const [users, setUsers] = useState<User[]>([]);
  const [providersDetailed, setProvidersDetailed] = useState<ProviderDetailed[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total_users: 0,
    total_providers: 0,
    total_bookings: 0,
    total_revenue: 0,
    pending_reviews: 0,
    flagged_reviews: 0
  });
  const [quickActionCounts, setQuickActionCounts] = useState({
    pendingProviders: 0,
    pendingAlerts: 0,
    totalRevenue: 0,
    unreadMessages: 0
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetailed | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialiser les communications automatiques
  useWorkflowEmails();
  useEmergencyOrchestration();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_stats', timeRange }
      });

      if (error) throw error;

      if (data?.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_providers', searchTerm, limit: 10 }
      });

      if (error) throw error;

      if (data?.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires",
        variant: "destructive"
      });
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_activities', limit: 20 }
      });

      if (error) throw error;

      if (data?.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les activités",
        variant: "destructive"
      });
    }
  };

  const loadServicePerformance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_service_performance', timeRange }
      });

      if (error) throw error;

      if (data?.success) {
        setServicePerformance(data.servicePerformance);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la performance des services:', error);
    }
  };

  const handleValidateProvider = async (providerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'validate_provider', providerId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Succès",
          description: data.message
        });
        loadProviders(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le prestataire",
        variant: "destructive"
      });
    }
  };

  const handleValidateAllProviders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'validate_all_providers' }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Succès",
          description: data.message
        });
        refreshData(); // Recharger toutes les données
      }
    } catch (error) {
      console.error('Erreur lors de la validation en lot:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider les prestataires",
        variant: "destructive"
      });
    }
  };

  const handleManageAlerts = () => {
    navigate('/admin/alerts');
  };

  const handleViewPayments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_payments_summary' }
      });

      if (error) throw error;

      if (data?.success) {
        const { summary } = data;
        toast({
          title: "Résumé Paiements",
          description: `En attente: ${summary.pending.amount}€ | Aujourd'hui: ${summary.today.amount}€`
        });
        // Redirection vers la page des paiements
        window.location.href = '/admin/paiements';
      }
    } catch (error) {
      console.error('Erreur lors du résumé des paiements:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le résumé des paiements",
        variant: "destructive"
      });
    }
  };

  const handleViewMessages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_messages_summary' }
      });

      if (error) throw error;

      if (data?.success) {
        const { summary } = data;
        toast({
          title: "Messages",
          description: `${summary.unread} non lu(s) | ${summary.activeConversations} conversations actives`
        });
        // Redirection vers la page des messages
        window.location.href = '/admin/messagerie';
      }
    } catch (error) {
      console.error('Erreur lors du résumé des messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le résumé des messages",
        variant: "destructive"
      });
    }
  };

  const handleContactProvider = async (providerId: string, message: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'contact_provider', providerId, message }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Succès",
          description: data.message
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'export_data', type, format: 'csv' }
      });

      if (error) throw error;

      if (data?.success) {
        // Créer et télécharger le fichier
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${type}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Succès",
          description: "Export terminé"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    }
  };

  // Nouvelles fonctions migrées
  const loadUsers = async () => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select(`
        id,
        created_at,
        first_name,
        last_name,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    const transformedUsers = data?.map((profile: any) => ({
      id: profile.user_id,
      email: profile.user_id,
      created_at: profile.created_at,
      profiles: {
        first_name: profile.first_name,
        last_name: profile.last_name
      }
    })) || [];
    
    setUsers(transformedUsers);
  };

  const loadProvidersDetailed = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    const providersWithProfiles = data?.map(provider => ({
      ...provider,
      profiles: null
    })) || [];
    setProvidersDetailed(providersWithProfiles);
  };

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReviews(data || []);
  };

  const loadJobApplications = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('id, first_name, last_name, email, category, experience_years, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setJobApplications(data || []);
  };

  const loadAdminStats = async () => {
    try {
      const [
        usersCount, 
        providersCount, 
        bookingsCount, 
        reviewsData,
        pendingProvidersCount,
        unreadMessagesCount,
        completedBookings,
        pendingBookingsCount
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('*'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_validation']),
        supabase.from('internal_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('bookings').select('total_price').eq('status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const pendingReviews = reviewsData.data?.filter(r => !r.is_approved) || [];
      const flaggedReviews = reviewsData.data?.filter(r => r.is_approved === false) || [];
      const totalRevenue = completedBookings.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Calculer les alertes (prestataires en attente + réservations en attente + avis non approuvés)
      const alertsCount = (pendingProvidersCount.count || 0) + (pendingBookingsCount.count || 0) + pendingReviews.length;

      setAdminStats({
        total_users: usersCount.count || 0,
        total_providers: providersCount.count || 0,
        total_bookings: bookingsCount.count || 0,
        total_revenue: totalRevenue,
        pending_reviews: pendingReviews.length,
        flagged_reviews: flaggedReviews.length
      });

      setQuickActionCounts({
        pendingProviders: pendingProvidersCount.count || 0,
        pendingAlerts: alertsCount,
        totalRevenue: totalRevenue,
        unreadMessages: unreadMessagesCount.count || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const updateProviderStatus = async (providerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ status: newStatus })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Le prestataire a été marqué comme ${newStatus}`,
      });

      loadProvidersDetailed();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const moderateReview = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const updates = action === 'approve' 
        ? { is_approved: true }
        : { is_approved: false };

      const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Avis approuvé" : "Avis rejeté",
        description: `L'avis a été ${action === 'approve' ? 'approuvé' : 'rejeté'}`,
      });

      loadReviews();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modérer l'avis",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const application = jobApplications.find(app => app.id === applicationId);
      if (!application) return;

      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      if (newStatus === 'approved') {
        await createProviderFromApplication(application);
      }

      toast({
        title: "Statut mis à jour",
        description: `La candidature a été ${newStatus === 'approved' ? 'approuvée et un compte prestataire a été créé' : newStatus === 'rejected' ? 'rejetée' : 'mise à jour'}`,
      });

      loadJobApplications();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const createProviderFromApplication = async (application: JobApplication) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: application.email,
        password: Math.random().toString(36).slice(-8),
        email_confirm: true,
        user_metadata: {
          first_name: application.first_name,
          last_name: application.last_name
        }
      });

      if (authError && authError.message !== 'User already registered') {
        throw authError;
      }

      const userId = authData?.user?.id;
      if (!userId) return;

      const { error: providerError } = await supabase
        .from('providers')
        .upsert({
          user_id: userId,
          business_name: `${application.first_name} ${application.last_name}`,
          description: `Prestataire ${application.category}`,
          is_verified: false,
          status: 'pending_validation'
        });

      if (providerError) throw providerError;

      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
          subject: 'Votre candidature a été approuvée',
          message: `Félicitations ! Votre candidature a été approuvée. Un compte prestataire a été créé pour vous.`
        }
      });

    } catch (error) {
      console.error('Erreur création prestataire:', error);
      toast({
        title: "Avertissement",
        description: "Candidature approuvée mais erreur lors de la création du compte prestataire",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (user: User | ProviderDetailed) => {
    if ('business_name' in user && user.business_name) {
      return user.business_name;
    }
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`;
    }
    if ('user_id' in user) {
      return `Prestataire ${user.user_id.slice(0, 8)}`;
    }
    return "Utilisateur";
  };

  const refreshData = async () => {
    await Promise.all([
      loadDashboardData(),
      loadProviders(),
      loadActivities(),
      loadServicePerformance(),
      loadUsers(),
      loadProvidersDetailed(),
      loadReviews(),
      loadJobApplications(),
      loadAdminStats()
    ]);
  };

  useEffect(() => {
    refreshData();
  }, [timeRange]);

  useEffect(() => {
    loadProviders();
  }, [searchTerm]);

  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard Bikawo</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble complète • {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
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
          
          <Button variant="outline" size="sm" onClick={() => handleExportData('providers')}>
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
          subtitle="clients + prestataires"
          trend={stats.users.trend}
          loading={loading}
        />
        
        <MetricCard
          title="Missions Actives"
          value={stats.missions.value}
          change={stats.missions.change}
          changeType="positive"
          icon={Target}
          subtitle="en cours + planifiées"
          trend={stats.missions.trend}
          loading={loading}
        />
        
        <MetricCard
          title="Satisfaction Globale"
          value={`${stats.satisfaction.value}/5`}
          change={stats.satisfaction.change}
          changeType="positive"
          icon={Star}
          subtitle="moyenne pondérée"
          trend={stats.satisfaction.trend}
          loading={loading}
        />
      </div>

      {/* Mission Assignment Trigger */}
      <MissionAssignmentTrigger />
      
      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        {/* Panneau d'alertes visible sur tous les onglets */}
        <AdminAlertsPanel onNavigate={() => {}} />
        
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="matching">🤖 Matching IA</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="requests">Demandes clients</TabsTrigger>
          <TabsTrigger value="manual_assignment">Attribution manuelle</TabsTrigger>
          <TabsTrigger value="enhanced_requests">Gestion avancée</TabsTrigger>
          <TabsTrigger value="messaging">Messagerie</TabsTrigger>
          <TabsTrigger value="reviews">
            Modération
            {(adminStats.pending_reviews + adminStats.flagged_reviews) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {adminStats.pending_reviews + adminStats.flagged_reviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">📊 Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Évolution des Revenus
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

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Performance par Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicePerformance.length > 0 ? servicePerformance : [
                      { name: 'Bika Kids', missions: 156, revenue: 45200, satisfaction: 4.8, growth: 15 },
                      { name: 'Bika Maison', missions: 234, revenue: 67800, satisfaction: 4.6, growth: 8 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'missions' ? `${value} missions` : `${value}€`,
                          name === 'missions' ? 'Missions' : 'Revenue'
                        ]}
                      />
                      <Bar dataKey="missions" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
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
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
                  <span className="text-sm">Valider Prestataires</span>
                  <Badge variant="destructive">{quickActionCounts.pendingProviders}</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/admin/alerts')}
                  disabled={loading}
                >
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-sm">Gérer Alertes</span>
                  <Badge variant="default">{quickActionCounts.pendingAlerts}</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/admin/payments')}
                  disabled={loading}
                >
                  <Euro className="w-6 h-6 text-blue-500" />
                  <span className="text-sm">Paiements</span>
                  <Badge variant="default">{quickActionCounts.totalRevenue > 0 ? `${Math.round(quickActionCounts.totalRevenue / 1000)}k€` : '0€'}</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/admin/messages')}
                  disabled={loading}
                >
                  <MessageSquare className="w-6 h-6 text-purple-500" />
                  <span className="text-sm">Messages</span>
                  <Badge variant="secondary">{quickActionCounts.unreadMessages}</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Gestion détaillée des prestataires */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion des prestataires</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providersDetailed.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>{getUserDisplayName(provider)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            provider.status === 'active' ? "default" :
                            provider.status === 'suspended' ? "destructive" :
                            provider.status === 'in_training' ? "secondary" :
                            provider.status === 'deactivated' ? "outline" : "secondary"
                          }>
                            {provider.status === 'active' ? "Actif" :
                             provider.status === 'pending_validation' ? "En attente" :
                             provider.status === 'suspended' ? "Suspendu" :
                             provider.status === 'in_training' ? "En formation" :
                             provider.status === 'deactivated' ? "Désactivé" : provider.status}
                          </Badge>
                          {provider.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {provider.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{provider.rating}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {provider.performance_score && (
                            <Badge variant="outline" className="text-xs">
                              Score: {provider.performance_score}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(provider.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {provider.status === 'pending_validation' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProviderStatus(provider.id, 'active')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activer
                            </Button>
                          )}
                          {provider.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProviderStatus(provider.id, 'suspended')}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Suspendre
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedProvider(provider)}>
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Gestion du prestataire</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Nom / Entreprise</label>
                                    <p className="text-sm text-muted-foreground">{getUserDisplayName(provider)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Score de performance</label>
                                    <p className="text-sm text-muted-foreground">{provider.performance_score || "0"}/100</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Missions cette semaine</label>
                                    <p className="text-sm text-muted-foreground">{provider.missions_this_week || 0}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Dernière mission</label>
                                    <p className="text-sm text-muted-foreground">
                                      {provider.last_mission_date 
                                        ? format(new Date(provider.last_mission_date), 'dd/MM/yyyy', { locale: fr })
                                        : "Aucune"}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Statut</label>
                                  <Select
                                    value={provider.status || 'pending_validation'}
                                    onValueChange={(value) => updateProviderStatus(provider.id, value)}
                                  >
                                    <SelectTrigger className="w-full mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending_validation">En attente de validation</SelectItem>
                                      <SelectItem value="active">Actif</SelectItem>
                                      <SelectItem value="suspended">Suspendu</SelectItem>
                                      <SelectItem value="in_training">En formation</SelectItem>
                                      <SelectItem value="deactivated">Désactivé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Documents</label>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Badge variant={provider.identity_document_url ? "default" : "secondary"}>
                                      CNI: {provider.identity_document_url ? "✓" : "✗"}
                                    </Badge>
                                    <Badge variant={provider.insurance_document_url ? "default" : "secondary"}>
                                      Assurance: {provider.insurance_document_url ? "✓" : "✗"}
                                    </Badge>
                                    <Badge variant={provider.diploma_document_url ? "default" : "secondary"}>
                                      Diplômes: {provider.diploma_document_url ? "✓" : "✗"}
                                    </Badge>
                                    <Badge variant={provider.quality_agreement_signed ? "default" : "secondary"}>
                                      Engagement: {provider.quality_agreement_signed ? "✓" : "✗"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'pending' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    {activity.amount && (
                      <Badge variant="outline" className="font-medium">
                        {activity.amount}
                      </Badge>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nouveau contenu migré */}
        <TabsContent value="kanban" className="space-y-4">
          <AdminKanbanBoard />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <AdminMatchingPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{getUserDisplayName(user)}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails utilisateur</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Nom</label>
                                <p className="text-sm text-muted-foreground">{getUserDisplayName(user)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">ID</label>
                                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Date d'inscription</label>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(user.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des candidatures</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidat</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Expérience</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        {application.first_name} {application.last_name}
                      </TableCell>
                      <TableCell>{application.category}</TableCell>
                      <TableCell>
                        {application.experience_years ? `${application.experience_years} ans` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          application.status === 'approved' ? 'default' :
                          application.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {application.status === 'pending' ? 'En attente' :
                           application.status === 'approved' ? 'Approuvée' :
                           application.status === 'rejected' ? 'Rejetée' : application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails candidature</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Candidat</label>
                                  <p className="text-sm text-muted-foreground">
                                    {application.first_name} {application.last_name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-muted-foreground">{application.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Catégorie</label>
                                  <p className="text-sm text-muted-foreground">{application.category}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="default" size="sm">
                                <Settings className="w-4 h-4 mr-1" />
                                Gestion
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Gestion de candidature</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Candidat</label>
                                  <p className="text-sm text-muted-foreground">
                                    {application.first_name} {application.last_name}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Actions</label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => updateApplicationStatus(application.id, 'approved')}
                                      disabled={application.status === 'approved'}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approuver
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                      disabled={application.status === 'rejected'}
                                    >
                                      <Ban className="w-4 h-4 mr-1" />
                                      Rejeter
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <AdminClientRequests />
        </TabsContent>

        <TabsContent value="manual_assignment" className="space-y-4">
          <AdminManualAssignment />
        </TabsContent>

        <TabsContent value="enhanced_requests" className="space-y-4">
          <AdminClientRequestsEnhanced />
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <ModernMessaging />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération des avis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Commentaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>Client {review.client_id.slice(0, 8)}</TableCell>
                      <TableCell>Prestataire {review.provider_id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.comment || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.is_approved ? "default" : "secondary"}>
                          {review.is_approved ? "Approuvé" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderateReview(review.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderateReview(review.id, 'reject')}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AutomatedReports />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Rapports programmés
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Les rapports automatiques peuvent être configurés pour être envoyés par email chaque semaine.</p>
                <p className="mt-2">Contactez l'administrateur système pour activer cette fonctionnalité.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}