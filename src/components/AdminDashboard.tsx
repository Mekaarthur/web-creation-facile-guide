import { useState, useEffect } from 'react';
import { AdminClientRequests } from './AdminClientRequests';
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
  CheckCircle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

interface Stats {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_reviews: number;
  flagged_reviews: number;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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
  const { toast } = useToast();

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

  const verifyProvider = async (providerId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('providers')
        .update({ is_verified: true })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Prestataire vérifié",
        description: "Le prestataire a été vérifié avec succès",
      });

      loadProviders();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le prestataire",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">Total inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestataires</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_providers}</div>
            <p className="text-xs text-muted-foreground">Professionnels actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bookings}</div>
            <p className="text-xs text-muted-foreground">Total effectuées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_revenue}€</div>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="requests">Demandes clients</TabsTrigger>
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
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
                        <Badge variant={provider.is_verified ? "default" : "secondary"}>
                          {provider.is_verified ? "Vérifié" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {provider.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{provider.rating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(provider.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!provider.is_verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifyProvider(provider.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Vérifier
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
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

        {/* Gestion des demandes clients */}
        <TabsContent value="requests" className="space-y-4">
          <AdminClientRequests />
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