import { useState, useEffect } from 'react';
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
  Loader2
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Mock data étendu
const revenueData = [
  { name: 'Sem 1', revenue: 98000, growth: 12, missions: 245, providers: 34 },
  { name: 'Sem 2', revenue: 105000, growth: 15, missions: 267, providers: 36 },
  { name: 'Sem 3', revenue: 118000, growth: 18, missions: 289, providers: 38 },
  { name: 'Sem 4', revenue: 125000, growth: 22, missions: 312, providers: 41 },
];

const servicePerformanceData = [
  { name: 'Bika Kids', missions: 156, revenue: 45200, satisfaction: 4.8, growth: 15 },
  { name: 'Bika Maison', missions: 234, revenue: 67800, satisfaction: 4.6, growth: 8 },
  { name: 'Bika Seniors', missions: 89, revenue: 28900, satisfaction: 4.9, growth: 22 },
  { name: 'Bika Travel', missions: 67, revenue: 23400, satisfaction: 4.4, growth: -5 },
  { name: 'Bika Vie', missions: 123, revenue: 41200, satisfaction: 4.7, growth: 12 },
];

const recentActivities = [
  {
    id: 1,
    type: 'booking',
    message: 'Nouvelle réservation Bika Kids par Marie Dubois',
    time: 'Il y a 2 min',
    status: 'success',
    amount: '89€'
  },
  {
    id: 2,
    type: 'provider',
    message: 'Nouvelle candidature prestataire - Sophie Martin',
    time: 'Il y a 5 min',
    status: 'pending'
  },
  {
    id: 3,
    type: 'payment',
    message: 'Paiement reçu - Mission #1247',
    time: 'Il y a 8 min',
    status: 'success',
    amount: '125€'
  },
  {
    id: 4,
    type: 'alert',
    message: 'Satisfaction Bika Travel sous le seuil (4.4/5)',
    time: 'Il y a 15 min',
    status: 'warning'
  },
  {
    id: 5,
    type: 'review',
    message: 'Nouveau commentaire 5⭐ - Mission #1245',
    time: 'Il y a 18 min',
    status: 'success'
  }
];

const topProviders = [
  {
    id: 1,
    name: 'Sophie Martin',
    service: 'Bika Kids',
    missions: 45,
    rating: 4.9,
    revenue: '4,580€',
    status: 'active',
    phone: '+33 6 12 34 56 78',
    location: 'Paris 15e'
  },
  {
    id: 2,
    name: 'Julie Bernard',
    service: 'Bika Maison',
    missions: 38,
    rating: 4.8,
    revenue: '3,920€',
    status: 'active',
    phone: '+33 6 23 45 67 89',
    location: 'Boulogne'
  },
  {
    id: 3,
    name: 'Claire Rousseau',
    service: 'Bika Seniors',
    missions: 52,
    rating: 4.9,
    revenue: '5,240€',
    status: 'active',
    phone: '+33 6 34 56 78 90',
    location: 'Neuilly'
  }
];

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
    revenue: { value: 125847, change: '+12%', trend: [98000, 105000, 118000, 125000, 125847] },
    users: { value: 8234, change: '+5%', trend: [7800, 7900, 8000, 8100, 8234] },
    missions: { value: 147, change: '+8%', trend: [120, 125, 135, 140, 147] },
    satisfaction: { value: 4.8, change: '+0.1', trend: [4.6, 4.7, 4.7, 4.8, 4.8] }
  });

  const [providers, setProviders] = useState<Provider[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

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

  const refreshData = async () => {
    await Promise.all([
      loadDashboardData(),
      loadProviders(),
      loadActivities(),
      loadServicePerformance()
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

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
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
                  onClick={() => handleValidateProvider('all')}
                >
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-sm">Valider Prestataires</span>
                  <Badge variant="destructive">12</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toast({ title: "Gestion des alertes", description: "Fonctionnalité en cours de développement" })}
                >
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-sm">Gérer Alertes</span>
                  <Badge variant="default">5</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/admin/paiements'}
                >
                  <Euro className="w-6 h-6 text-blue-500" />
                  <span className="text-sm">Paiements</span>
                  <Badge variant="default">23k€</Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/admin/messagerie'}
                >
                  <MessageSquare className="w-6 h-6 text-purple-500" />
                  <span className="text-sm">Messages</span>
                  <Badge variant="secondary">23</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Top Providers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                Top Prestataires
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Missions</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {provider.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.service}</Badge>
                      </TableCell>
                      <TableCell>{provider.missions}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {provider.rating}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{provider.revenue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {provider.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails du prestataire</DialogTitle>
                                <DialogDescription>
                                  Informations détaillées pour {provider.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="font-medium">Email:</span> {provider.email}</div>
                                  <div><span className="font-medium">Téléphone:</span> {provider.phone}</div>
                                  <div><span className="font-medium">Service:</span> {provider.service}</div>
                                  <div><span className="font-medium">Missions:</span> {provider.missions}</div>
                                  <div><span className="font-medium">Note:</span> {provider.rating}/5</div>
                                  <div><span className="font-medium">CA:</span> {provider.revenue}</div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Contacter le prestataire</DialogTitle>
                                <DialogDescription>
                                  Envoyer un message à {provider.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea placeholder="Tapez votre message..." id={`message-${provider.id}`} />
                                <Button onClick={() => {
                                  const messageEl = document.getElementById(`message-${provider.id}`) as HTMLTextAreaElement;
                                  if (messageEl?.value) {
                                    handleContactProvider(provider.id, messageEl.value);
                                    messageEl.value = '';
                                  }
                                }}>
                                  Envoyer
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
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
      </Tabs>
    </div>
  );
}