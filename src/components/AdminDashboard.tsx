import { useState, useEffect } from 'react';
import { AdminClientRequests } from './AdminClientRequests';
import { AdminClientRequestsEnhanced } from './AdminClientRequestsEnhanced';
import { AdminManualAssignment } from './AdminManualAssignment';
import { AdminAlertsPanel } from './AdminAlertsPanel';
import { AdminKanbanBoard } from './AdminKanbanBoard';
import { InternalMessaging } from './InternalMessaging';
import { MissionAssignmentTrigger } from './MissionAssignmentTrigger';
import ZoneGeographiqueManager from './ZoneGeographiqueManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserCheck, 
  Star, 
  TrendingUp, 
  Euro, 
  Calendar,
  AlertTriangle,
  Shield,
  BarChart3,
  Settings,
  Eye,
  Ban,
  CheckCircle,
  MessageSquare,
  CreditCard,
  Send,
  MapPin
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useWorkflowEmails } from "@/hooks/useWorkflowEmails";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Provider {
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

interface Stats {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_reviews: number;
  flagged_reviews: number;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_providers: 0,
    total_bookings: 0,
    total_revenue: 0,
    pending_reviews: 0,
    flagged_reviews: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const { toast } = useToast();
  
  // Initialiser les emails du workflow
  useWorkflowEmails();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadProviders(),
        loadReviews(),
        loadJobApplications(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    
    // Transformer pour correspondre à l'interface User
    const transformedUsers = data?.map((profile: any) => ({
      id: profile.user_id,
      email: profile.user_id, // Placeholder, l'email n'est pas accessible via l'API
      created_at: profile.created_at,
      profiles: {
        first_name: profile.first_name,
        last_name: profile.last_name
      }
    })) || [];
    
    setUsers(transformedUsers);
  };

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    // Ajouter une propriété profiles nulle pour compatibilité avec la fonction getUserDisplayName
    const providersWithProfiles = data?.map(provider => ({
      ...provider,
      profiles: null
    })) || [];
    setProviders(providersWithProfiles);
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

  const loadStats = async () => {
    try {
      // Charger les statistiques directement depuis les tables
      const [usersCount, providersCount, bookingsCount, reviewsData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('*')
      ]);

      const pendingReviews = reviewsData.data?.filter(r => !r.is_approved) || [];
      const flaggedReviews = reviewsData.data?.filter(r => r.is_approved === false) || [];

      setStats({
        total_users: usersCount.count || 0,
        total_providers: providersCount.count || 0,
        total_bookings: bookingsCount.count || 0,
        total_revenue: 0, // À calculer depuis les bookings complétées
        pending_reviews: pendingReviews.length,
        flagged_reviews: flaggedReviews.length
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setStats({
        total_users: 0,
        total_providers: 0,
        total_bookings: 0,
        total_revenue: 0,
        pending_reviews: 0,
        flagged_reviews: 0
      });
    }
  };

  const updateProviderStatus = async (providerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ status: newStatus })
        .eq('id', providerId);

      if (error) throw error;

      // Enregistrer dans l'historique
      await supabase
        .from('provider_status_history')
        .insert({
          provider_id: providerId,
          new_status: newStatus,
          admin_user_id: null, // À adapter selon votre système d'auth admin
          reason: `Changement via interface admin`
        });

      toast({
        title: "Statut mis à jour",
        description: `Le prestataire a été marqué comme ${newStatus}`,
      });

      loadProviders();
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

      // Si approuvé, créer un profil prestataire
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
      // D'abord créer un utilisateur si nécessaire
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: application.email,
        password: Math.random().toString(36).slice(-8), // Mot de passe temporaire
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

      // Créer le profil prestataire
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

      // Envoyer email de bienvenue
      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
          subject: 'Votre candidature a été approuvée',
          message: `Félicitations ! Votre candidature a été approuvée. Un compte prestataire a été créé pour vous. Vous pouvez maintenant vous connecter avec votre email.`
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

  const getUserDisplayName = (user: User | Provider) => {
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <MissionAssignmentTrigger />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">Gestion de la plateforme</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Administrateur
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">Total inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Prestataires</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total_providers}</div>
            <p className="text-xs text-muted-foreground">Professionnels actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total_bookings}</div>
            <p className="text-xs text-muted-foreground">Total effectuées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total_revenue}€</div>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Panneau d'alertes visible sur tous les onglets */}
        <AdminAlertsPanel onNavigate={setActiveTab} />
        
        <TabsList className="grid w-full grid-cols-9 lg:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="requests">Demandes clients</TabsTrigger>
          <TabsTrigger value="manual_assignment">Attribution manuelle</TabsTrigger>
          <TabsTrigger value="enhanced_requests">Gestion avancée</TabsTrigger>
          <TabsTrigger value="zones">
            <MapPin className="w-4 h-4 mr-2" />
            Zones géographiques
          </TabsTrigger>
          <TabsTrigger value="messaging">Messagerie</TabsTrigger>
          <TabsTrigger value="reviews">
            Modération
            {(stats.pending_reviews + stats.flagged_reviews) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pending_reviews + stats.flagged_reviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble du dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Bienvenue dans le tableau de bord admin</h3>
            <p className="text-muted-foreground">Utilisez les onglets pour naviguer dans les différentes sections</p>
          </div>
        </TabsContent>

        {/* Tableau Kanban */}
        <TabsContent value="kanban" className="space-y-4">
          <AdminKanbanBoard />
        </TabsContent>

        {/* Gestion des utilisateurs */}
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

        {/* Gestion des prestataires */}
        <TabsContent value="providers" className="space-y-4">
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
                  {providers.map((provider) => (
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

        {/* Gestion des candidatures */}
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
                                <div>
                                  <label className="text-sm font-medium">Expérience</label>
                                  <p className="text-sm text-muted-foreground">
                                    {application.experience_years ? `${application.experience_years} ans` : 'Non renseignée'}
                                  </p>
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
                                <div>
                                  <label className="text-sm font-medium">Statut actuel</label>
                                  <Badge variant={
                                    application.status === 'approved' ? 'default' :
                                    application.status === 'rejected' ? 'destructive' : 'secondary'
                                  }>
                                    {application.status === 'pending' ? 'En attente' :
                                     application.status === 'approved' ? 'Approuvée' :
                                     application.status === 'rejected' ? 'Rejetée' : application.status}
                                  </Badge>
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

        {/* Gestion des demandes clients */}
        <TabsContent value="requests" className="space-y-4">
          <AdminClientRequests />
        </TabsContent>

        {/* Attribution manuelle des missions */}
        <TabsContent value="manual_assignment" className="space-y-4">
          <AdminManualAssignment />
        </TabsContent>

        {/* Gestion avancée des demandes */}
        <TabsContent value="enhanced_requests" className="space-y-4">
          <AdminClientRequestsEnhanced />
        </TabsContent>

        {/* Gestion des zones géographiques */}
        <TabsContent value="zones" className="space-y-4">
          <ZoneGeographiqueManager />
        </TabsContent>

        {/* Messagerie interne */}
        <TabsContent value="messaging" className="space-y-4">
          <InternalMessaging />
        </TabsContent>

        {/* Modération des avis */}
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

        {/* Statistiques détaillées */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Activité de la plateforme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Avis en attente</span>
                  <Badge variant="secondary">{stats.pending_reviews}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avis signalés</span>
                  <Badge variant="destructive">{stats.flagged_reviews}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Prestataires vérifiés</span>
                  <Badge variant="default">
                    {providers.filter(p => p.is_verified).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Croissance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Statistiques de croissance détaillées à venir...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};