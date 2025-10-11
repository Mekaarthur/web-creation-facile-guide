import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Gift, Clock, ArrowRight, Download, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

const ClientDashboard = ({ onNavigateToTab }: ClientDashboardProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [activeRewards, setActiveRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Charger le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      // Charger les prochaines réservations
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          providers(business_name)
        `)
        .eq('client_id', user.id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .limit(3);

      setUpcomingBookings(bookingsData || []);

      // Charger les dernières factures
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('issued_date', { ascending: false })
        .limit(3);

      setRecentInvoices(invoicesData || []);

      // Charger les récompenses actives
      const { data: rewardsData } = await supabase
        .from('client_rewards')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .order('earned_date', { ascending: false })
        .limit(3);

      setActiveRewards(rewardsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
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
          Bienvenue {profile?.first_name || user?.email?.split('@')[0]} !
        </h1>
        <p className="text-muted-foreground text-lg">
          Voici un aperçu de votre activité Bikawo
        </p>
      </div>

      {/* Blocs principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes prochaines réservations */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mes prochaines réservations
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('reservations')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{booking.services?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: fr })} - {booking.start_time}
                      </p>
                      <p className="text-xs text-muted-foreground">{booking.providers?.business_name}</p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} text-white text-xs`}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                  
                  {booking.provider_id && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => {
                          window.location.href = `/provider/${booking.provider_id}`;
                        }}
                      >
                        Voir prestataire
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => {
                          window.location.href = `/booking/${booking.id}/track`;
                        }}
                      >
                        Suivre mission
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune réservation à venir</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.href = '/services'}
                >
                  Réserver maintenant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dernières factures */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Dernières factures
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('factures')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Facture #{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invoice.issued_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{invoice.amount}€</p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune facture disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes récompenses */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Mes récompenses
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('recompenses')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRewards.length > 0 ? (
              activeRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Bon psychologue</p>
                    <p className="text-xs text-muted-foreground">
                      Expire le {format(new Date(reward.expires_at), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant="secondary">Actif</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune récompense active</p>
                <p className="text-xs mt-1">Utilisez nos services pour gagner des récompenses !</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendrier de mes prestations */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Calendrier de mes prestations
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigateToTab('calendrier')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Calendrier partagé famille</p>
              <p className="text-xs mt-1">Synchronisez vos prestations avec votre famille</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => onNavigateToTab('calendrier')}
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

export default ClientDashboard;