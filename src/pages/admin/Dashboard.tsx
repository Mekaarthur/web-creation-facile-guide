import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  Calendar,
  Euro,
  TrendingUp,
  Activity
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useCache } from "@/hooks/useCache";

interface Stats {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_reviews: number;
  monthly_growth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_providers: 0,
    total_bookings: 0,
    total_revenue: 0,
    pending_reviews: 0,
    monthly_growth: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const cache = useCache({ ttl: 5 }); // Cache 5 minutes

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Vérifier le cache d'abord
      const cachedStats = cache.get('dashboard-stats');
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }

      const [usersCount, providersCount, bookingsCount, reviewsData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('*')
      ]);

      const pendingReviews = reviewsData.data?.filter(r => !r.is_approved) || [];

      const newStats = {
        total_users: usersCount.count || 0,
        total_providers: providersCount.count || 0,
        total_bookings: bookingsCount.count || 0,
        total_revenue: 0,
        pending_reviews: pendingReviews.length,
        monthly_growth: 12.5
      };

      setStats(newStats);
      cache.set('dashboard-stats', newStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Vue d'ensemble de votre plateforme</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestataires</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_providers}</div>
            <p className="text-xs text-muted-foreground">
              Professionnels vérifiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bookings}</div>
            <p className="text-xs text-muted-foreground">
              Total effectuées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_revenue}€</div>
            <p className="text-xs text-muted-foreground">
              Chiffre d'affaires total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Croissance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthly_growth}%</div>
            <p className="text-xs text-muted-foreground">
              Croissance mensuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis en attente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_reviews}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une modération
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section de bienvenue */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans votre espace d'administration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Utilisez le menu de navigation pour accéder aux différentes sections :
          </p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Alertes</strong> : Gérez les situations urgentes nécessitant votre attention</li>
            <li>• <strong>Kanban</strong> : Vue visuelle des missions et leur progression</li>
            <li>• <strong>Utilisateurs</strong> : Gestion des comptes clients</li>
            <li>• <strong>Prestataires</strong> : Validation et suivi des professionnels</li>
            <li>• <strong>Demandes</strong> : Attribution manuelle et suivi des missions</li>
            <li>• <strong>Modération</strong> : Validation des avis et contenus</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}