import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  User, 
  Star, 
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Users,
  ArrowRight,
  Zap,
  Phone,
  Mail,
  Eye,
  Settings,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProviderCalendar from '@/components/ProviderCalendar';
import ProviderDocuments from '@/components/ProviderDocuments';
import ProfileUpdateForm from '@/components/ProfileUpdateForm';

const ProviderDashboardNew = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ monthly: 0, total: 0 });
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user) {
      loadProviderData();
    }
  }, [user]);

  const loadProviderData = async () => {
    if (!user) return;
    
    try {
      // Charger le profil prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select(`
          *,
          profiles!providers_user_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .single();

      if (providerData) {
        setProfile(providerData);
        setEarnings({
          monthly: providerData.monthly_earnings || 0,
          total: providerData.total_earnings || 0
        });

        // Charger les missions
        const { data: missionsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name),
            profiles!bookings_client_id_fkey(first_name, last_name)
          `)
          .eq('provider_id', providerData.id)
          .order('booking_date', { ascending: false })
          .limit(10);

        setMissions(missionsData || []);

        // Charger les avis
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('provider_id', providerData.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(5);

        setReviews(reviewsData || []);

        // Charger les opportunités (missions disponibles)
        const { data: opportunitiesData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name, category)
          `)
          .is('provider_id', null)
          .eq('status', 'pending')
          .gte('booking_date', new Date().toISOString().split('T')[0])
          .limit(6);

        setOpportunities(opportunitiesData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyToMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: profile.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Candidature envoyée",
        description: "Votre candidature a été envoyée avec succès !",
      });

      loadProviderData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la candidature",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getProgressPercentage = () => {
    const monthlyGoal = 2000;
    return Math.min((earnings.monthly / monthlyGoal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const motivationalQuotes = [
    "Chaque mission est une nouvelle opportunité de briller !",
    "Votre talent fait la différence dans la vie de vos clients.",
    "Aujourd'hui est parfait pour dépasser vos objectifs !",
    "L'excellence n'est pas un acte, mais une habitude."
  ];

  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header moderne avec navigation */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Bonjour {profile?.profiles?.first_name || 'Prestataire'} ! 👋
                </h1>
                <p className="text-muted-foreground">Votre espace professionnel Bikawo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={profile?.is_verified ? "default" : "secondary"}
                className={`text-sm ${profile?.is_verified 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {profile?.is_verified ? 'Vérifié' : 'En cours de vérification'}
              </Badge>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span>Support: 0609085390</span>
              </div>
              <Button variant="outline" size="sm" className="hover:bg-primary/10">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-white/80 backdrop-blur-sm p-1 h-auto shadow-lg rounded-xl border-0">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs font-medium">Accueil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="missions" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs font-medium">Missions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="revenus" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium">Revenus</span>
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Planning</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profil" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="evaluations" 
              className="flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Star className="h-5 w-5" />
              <span className="text-xs font-medium">Avis</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-8 mt-8">
            {/* Citation motivante moderne */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent"></div>
              <CardContent className="relative p-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-foreground mb-2">Motivation du jour ✨</p>
                    <p className="text-muted-foreground italic text-lg">"{todayQuote}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques principales modernisées */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <DollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ce mois</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(earnings.monthly)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </div>
                    <span className="text-xs text-muted-foreground">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Missions actives</p>
                      <p className="text-2xl font-bold text-foreground">{missions.filter(m => ['pending', 'confirmed'].includes(m.status)).length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      À traiter
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Star className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note moyenne</p>
                      <p className="text-2xl font-bold text-foreground">{profile?.rating?.toFixed(1) || '4.8'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(profile?.rating || 4.8) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total missions</p>
                      <p className="text-2xl font-bold text-foreground">{missions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Réalisées
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Objectifs du mois modernisé */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-8 py-6">
                <CardTitle className="flex items-center gap-4 text-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
                    Objectif mensuel
                  </span>
                </CardTitle>
              </div>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Revenus</span>
                    <span className="text-lg text-muted-foreground">
                      {formatCurrency(earnings.monthly)} / {formatCurrency(2000)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-700 ease-out shadow-lg"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    <div className="absolute -top-1 right-0 transform translate-x-1/2">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-background shadow-lg"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {getProgressPercentage().toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground">de votre objectif atteint</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Opportunités disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Nouvelles opportunités
                    </span>
                    <Badge variant="secondary">{opportunities.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {opportunities.slice(0, 3).map((opportunity) => (
                      <div key={opportunity.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {opportunity.services?.name}
                          </Badge>
                          <span className="font-bold text-primary">{formatCurrency(opportunity.total_price)}</span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(opportunity.booking_date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {opportunity.start_time} - {opportunity.end_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {opportunity.address || 'À préciser'}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => applyToMission(opportunity.id)}
                        >
                          Postuler maintenant
                        </Button>
                      </div>
                    ))}
                    {opportunities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucune nouvelle opportunité</p>
                        <p className="text-xs mt-1">Revenez plus tard</p>
                      </div>
                    )}
                  </div>
                  {opportunities.length > 3 && (
                    <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('missions')}>
                      Voir toutes les opportunités
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Avis récents modernisés */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 px-6 py-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold">Avis récents</span>
                  </CardTitle>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review, index) => (
                      <div key={review.id} className="p-4 rounded-2xl bg-gradient-to-r from-background to-muted/20 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">"{review.comment}"</p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">Aucun avis pour le moment</h3>
                        <p className="text-sm text-muted-foreground">Vos premiers avis apparaîtront ici</p>
                      </div>
                    )}
                  </div>
                  {reviews.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 hover:bg-primary/5 hover:border-primary/30" 
                      onClick={() => setActiveTab('evaluations')}
                    >
                      Voir tous les avis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Missions modernisées */}
          <TabsContent value="missions" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mes Missions
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {missions.length} au total
                </Badge>
              </div>
            </div>
            
            <div className="grid gap-6">
              {missions.length > 0 ? missions.map((mission, index) => (
                <Card key={mission.id} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="relative p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-lg">
                            <Briefcase className="w-8 h-8 text-primary" />
                          </div>
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-background shadow-lg ${
                            mission.status === 'completed' ? 'bg-green-500' : 
                            mission.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}></div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {mission.services?.name || 'Service'}
                          </h3>
                          <div className="space-y-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                Client: {mission.profiles?.first_name} {mission.profiles?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>
                                {format(new Date(mission.booking_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{mission.start_time} - {mission.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>{mission.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-4">
                        <Badge 
                          className={`text-sm px-4 py-2 ${
                            mission.status === 'completed' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : mission.status === 'confirmed' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {mission.status === 'completed' ? 'Terminé' : 
                           mission.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </Badge>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(mission.total_price)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-16 text-center">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Aucune mission trouvée</h3>
                    <p className="text-muted-foreground mb-6">Vos missions apparaîtront ici une fois que vous aurez postulé</p>
                    <Button 
                      onClick={() => setActiveTab('dashboard')}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      Voir les opportunités
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenus" className="space-y-8 mt-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mes Revenus
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Revenus du mois</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-primary mb-3">
                    {formatCurrency(earnings.monthly)}
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+12% par rapport au mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Revenus totaux</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-primary mb-3">
                    {formatCurrency(earnings.total)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Depuis le début de votre activité
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Prévisions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-primary mb-3">
                    {formatCurrency(earnings.monthly * 1.2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimation fin de mois
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mon Planning</h2>
            </div>
            <ProviderCalendar />
          </TabsContent>

          <TabsContent value="profil" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mon Profil</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations personnelles */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                      {profile?.profiles?.avatar_url ? (
                        <img 
                          src={profile.profiles.avatar_url} 
                          alt="Photo de profil" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {profile?.profiles?.first_name} {profile?.profiles?.last_name}
                      </h3>
                      <p className="text-muted-foreground">{profile?.business_name || 'Prestataire Bikawo'}</p>
                      <p className="text-sm text-muted-foreground">{profile?.location}</p>
                    </div>
                  </div>
                  <ProfileUpdateForm />
                </CardContent>
              </Card>

              {/* Statut du profil */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statut du profil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Profil vérifié</span>
                      <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                        {profile?.is_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {profile?.is_verified ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Note moyenne</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{profile?.rating?.toFixed(1) || '4.8'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Missions réalisées</span>
                      <span className="font-medium">{profile?.missions_completed || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Mes documents administratifs
                </CardTitle>
                <CardDescription>
                  Téléchargez vos documents pour valider votre profil prestataire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderDocuments />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-8 mt-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mes Évaluations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">
                    {profile?.rating?.toFixed(1) || '4.8'}
                  </div>
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < Math.floor(profile?.rating || 4.8) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Note moyenne</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">
                    {reviews.length}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Avis reçus</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">
                    98%
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Taux de satisfaction</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">
                    {missions.filter(m => m.status === 'completed').length}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Missions réalisées</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Liste des avis modernisée */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-8 py-6">
                <CardTitle className="text-xl font-bold">Avis clients récents</CardTitle>
              </div>
              <CardContent className="space-y-6 p-8">
                {reviews.map((review) => (
                  <div key={review.id} className="group p-6 rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">"{review.comment}"</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Aucun avis pour le moment</h3>
                    <p className="text-muted-foreground">Vos premiers avis clients apparaîtront ici après vos premières missions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProviderDashboardNew;