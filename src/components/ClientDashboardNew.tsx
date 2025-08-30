import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  User, 
  Star, 
  ArrowRight,
  Gift,
  Users,
  CreditCard,
  FileText
} from 'lucide-react';
import ServicesGrid from '@/components/ServicesGrid';

interface ClientDashboardNewProps {
  onNavigateToTab: (tab: string) => void;
}

const ClientDashboardNew = ({ onNavigateToTab }: ClientDashboardNewProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Charger le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Charger les prochaines réservations
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, services(name)')
        .eq('client_id', user?.id)
        .in('status', ['pending', 'confirmed', 'assigned'])
        .order('booking_date', { ascending: true })
        .limit(3);

      setUpcomingBookings(bookingsData || []);

      // Charger les factures récentes
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user?.id)
        .order('issued_date', { ascending: false })
        .limit(3);

      setRecentInvoices(invoicesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'assigned': return 'Assigné';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'Client';

  return (
    <div className="space-y-6">
      {/* Layout Principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Partie gauche - Message de bienvenue */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Bonjour {firstName} ! 👋
                  </h2>
                  <p className="text-muted-foreground text-lg mb-4">
                    Bienvenue dans votre espace client Bikawo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gérez vos réservations, suivez vos prestations et découvrez nos services
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vos Prochaines Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Vos Prochaines Sessions
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onNavigateToTab('rendez-vous')}
                >
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{booking.services?.name || 'Service'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.booking_date).toLocaleDateString('fr-FR')} à {booking.start_time}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune réservation à venir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Partie droite - Tableau de bord miniaturisé */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raccourcis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => onNavigateToTab('factures')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Mes Factures
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => onNavigateToTab('parrainage')}
              >
                <Gift className="w-4 h-4 mr-2" />
                Récompenses
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => onNavigateToTab('paiement')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Paiement
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => onNavigateToTab('profil')}
              >
                <User className="w-4 h-4 mr-2" />
                Mon Profil
              </Button>
            </CardContent>
          </Card>

          {/* Stats rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
                <div className="text-sm text-muted-foreground">Réservations à venir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recentInvoices.length}</div>
                <div className="text-sm text-muted-foreground">Factures ce mois</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.8</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  Satisfaction
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Services disponibles à la réservation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Tous nos services disponibles à la réservation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServicesGrid />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboardNew;