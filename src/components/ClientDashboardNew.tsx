import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAnimations } from '@/hooks/useAnimations';
import { 
  Calendar, 
  Clock, 
  User, 
  Star, 
  ArrowRight,
  Gift,
  Users,
  CreditCard,
  FileText,
  TrendingUp,
  CheckCircle,
  Plus
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
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'assigned': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-muted text-muted-foreground';
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

  const { fadeInUp, staggeredAnimation } = useAnimations();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded-lg"></div>
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-48 bg-muted rounded-lg"></div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'Client';

  return (
    <div className="container mx-auto p-4 space-y-8" {...fadeInUp()}>
      {/* En-tête avec statistiques */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-secondary p-1" {...fadeInUp(100)}>
        <div className="relative bg-background/95 backdrop-blur-sm rounded-[calc(1rem-1px)] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Bonjour {firstName} ! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Bienvenue dans votre espace client Bikawo
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Gérez vos réservations, suivez vos prestations et découvrez nos services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
                  <div className="text-xs text-muted-foreground">Réservations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recentInvoices.length}</div>
                  <div className="text-xs text-muted-foreground">Factures</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-primary">4.8</div>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground">Services utilisés</div>
                </div>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-glow hover:to-primary shadow-lg" 
              onClick={() => window.location.href = '/services'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle réservation
            </Button>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Partie gauche - Contenu principal */}
        <div className="lg:col-span-8 space-y-6">
          {/* Vos Prochaines Sessions */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300" {...staggeredAnimation(0)}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg">Vos Prochaines Sessions</span>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                  onClick={() => onNavigateToTab('rendez-vous')}
                >
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className="group relative p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-background to-muted/30"
                      {...staggeredAnimation(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {booking.services?.name || 'Service'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.booking_date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })} à {booking.start_time}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Aucune réservation à venir</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Réservez votre premier service pour commencer
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/services'}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Réserver maintenant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Partie droite - Actions rapides */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-0 shadow-lg" {...staggeredAnimation(1)}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group" 
                onClick={() => onNavigateToTab('factures')}
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600 group-hover:text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Mes Factures</div>
                  <div className="text-xs text-muted-foreground">{recentInvoices.length} factures</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group" 
                onClick={() => onNavigateToTab('parrainage')}
              >
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                  <Gift className="w-4 h-4 text-purple-600 group-hover:text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Récompenses</div>
                  <div className="text-xs text-muted-foreground">Programme fidélité</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group" 
                onClick={() => onNavigateToTab('paiement')}
              >
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                  <CreditCard className="w-4 h-4 text-green-600 group-hover:text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Paiements</div>
                  <div className="text-xs text-muted-foreground">Gérer mes moyens</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group" 
                onClick={() => onNavigateToTab('profil')}
              >
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                  <User className="w-4 h-4 text-orange-600 group-hover:text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Mon Profil</div>
                  <div className="text-xs text-muted-foreground">Paramètres compte</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="border-0 shadow-lg" {...staggeredAnimation(2)}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentInvoices.slice(0, 3).map((invoice, index) => (
                <div key={invoice.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Facture #{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.issued_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {invoice.amount}€
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Services disponibles à la réservation */}
      <Card className="border-0 shadow-lg overflow-hidden" {...staggeredAnimation(3)}>
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
              Tous nos services disponibles
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Découvrez notre gamme complète de services pour vous accompagner au quotidien
          </p>
        </div>
        <CardContent className="p-6">
          <ServicesGrid />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboardNew;