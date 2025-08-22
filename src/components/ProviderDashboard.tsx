import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Clock, CheckCircle, ArrowRight, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProviderDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

const ProviderDashboard = ({ onNavigateToTab }: ProviderDashboardProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcomingMissions, setUpcomingMissions] = useState<any[]>([]);
  const [recentMissions, setRecentMissions] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Charger le profil prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (providerData) {
        // Charger aussi le profil utilisateur
        const { data: userProfileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setProfile({
          ...providerData,
          first_name: userProfileData?.first_name,
          last_name: userProfileData?.last_name
        });

        // Charger les missions à venir
        const { data: upcomingMissionsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name),
            profiles!bookings_client_id_fkey(first_name, last_name)
          `)
          .eq('provider_id', providerData.id)
          .gte('booking_date', new Date().toISOString().split('T')[0])
          .in('status', ['confirmed', 'assigned'])
          .order('booking_date', { ascending: true })
          .limit(3);

        setUpcomingMissions(upcomingMissionsData || []);

        // Charger les missions récentes terminées
        const { data: recentMissionsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name),
            profiles!bookings_client_id_fkey(first_name, last_name)
          `)
          .eq('provider_id', providerData.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(3);

        setRecentMissions(recentMissionsData || []);

        // Utiliser les earnings du profil prestataire
        setMonthlyEarnings(providerData.monthly_earnings || 0);
        setTotalEarnings(providerData.total_earnings || 0);
      }

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'assigned': return 'Assigné';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bienvenue {profile?.business_name || profile?.first_name || user?.email?.split('@')[0]} !
        </h1>
        <p className="text-muted-foreground text-lg">
          Voici un aperçu de votre activité prestataire
        </p>
        {profile?.is_verified && (
          <Badge className="bg-green-500 text-white mt-2">
            <CheckCircle className="w-4 h-4 mr-1" />
            Prestataire vérifié
          </Badge>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">{monthlyEarnings}€</p>
                <p className="text-sm text-blue-600">Revenus ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">{totalEarnings}€</p>
                <p className="text-sm text-green-600">Revenus total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{upcomingMissions.length}</p>
                <p className="text-sm text-purple-600">Missions à venir</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocs principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missions à venir */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Missions à venir
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('missions')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMissions.length > 0 ? (
              upcomingMissions.map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mission.services?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mission.booking_date), 'dd MMMM yyyy', { locale: fr })} - {mission.start_time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {mission.profiles?.first_name} {mission.profiles?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(mission.status)} text-white text-xs mb-1`}>
                      {getStatusLabel(mission.status)}
                    </Badge>
                    <p className="text-xs font-medium">{mission.total_price}€</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune mission à venir</p>
                <p className="text-xs mt-1">Vous recevrez vos nouvelles missions ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missions passées */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Missions passées
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('prestations')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMissions.length > 0 ? (
              recentMissions.map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mission.services?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mission.booking_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {mission.profiles?.first_name} {mission.profiles?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500 text-white text-xs mb-1">
                      Terminé
                    </Badge>
                    <p className="text-xs font-medium">{mission.total_price}€</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune mission terminée</p>
                <p className="text-xs mt-1">Vos prestations terminées apparaîtront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes revenus */}
        <Card className="hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mes revenus
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('invoices')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir détail
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ce mois-ci</h4>
                  <p className="text-2xl font-bold text-blue-700">{monthlyEarnings}€</p>
                  <p className="text-sm text-blue-600">Revenus bruts</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Total</h4>
                  <p className="text-2xl font-bold text-green-700">{totalEarnings}€</p>
                  <p className="text-sm text-green-600">Revenus cumulés</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onNavigateToTab('invoices')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Voir mes fiches de rémunération
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendrier */}
        <Card className="hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Mon calendrier
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('calendar')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Gérez vos disponibilités</p>
              <p className="text-xs mt-1">Définissez vos créneaux de travail et vos congés</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => onNavigateToTab('calendar')}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Accéder au calendrier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderDashboard;