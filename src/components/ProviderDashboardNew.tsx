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
    <div className="min-h-screen bg-background">
      {/* Header avec navigation */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bienvenue {profile?.profiles?.first_name || 'Prestataire'} ! 👋
              </h1>
              <p className="text-muted-foreground">Gérez votre activité et développez vos revenus</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                {profile?.is_verified ? 'Vérifié' : 'En attente'}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Support: 06 09 08 53 90</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-6 bg-muted/50 p-1 h-auto">
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-xs font-medium">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs font-medium">Missions</span>
            </TabsTrigger>
            <TabsTrigger value="revenus" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Planning</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Star className="h-4 w-4" />
              <span className="text-xs font-medium">Avis</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-8 mt-8">
            {/* Citation motivante */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Motivation du jour</p>
                    <p className="text-sm text-muted-foreground italic">"{todayQuote}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(earnings.monthly)}</p>
                      <p className="text-xs text-green-600 mt-1">+12% vs mois dernier</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Missions actives</p>
                      <p className="text-2xl font-bold text-foreground">{missions.filter(m => ['pending', 'confirmed'].includes(m.status)).length}</p>
                      <p className="text-xs text-blue-600 mt-1">À traiter</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Note moyenne</p>
                      <p className="text-2xl font-bold text-foreground">{profile?.rating?.toFixed(1) || '4.8'}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(profile?.rating || 4.8) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total missions</p>
                      <p className="text-2xl font-bold text-foreground">{missions.length}</p>
                      <p className="text-xs text-purple-600 mt-1">Réalisées</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Objectifs du mois */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Objectif mensuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenus</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(earnings.monthly)} / {formatCurrency(2000)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getProgressPercentage().toFixed(0)}% de votre objectif atteint
                  </p>
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

              {/* Avis récents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Avis récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'dd/MM', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun avis pour le moment</p>
                        <p className="text-xs mt-1">Vos premiers avis apparaîtront ici</p>
                      </div>
                    )}
                  </div>
                  {reviews.length > 3 && (
                    <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('evaluations')}>
                      Voir tous les avis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Autres tabs simplifiés */}
          <TabsContent value="missions" className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mes Missions</h2>
            </div>
            
            <div className="grid gap-4">
              {missions.length > 0 ? missions.map((mission) => (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{mission.services?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Client: {mission.profiles?.first_name} {mission.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(mission.booking_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">{mission.address}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={mission.status === 'completed' ? 'bg-green-500' : mission.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'}>
                          {mission.status === 'completed' ? 'Terminé' : mission.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </Badge>
                        <p className="font-bold">{formatCurrency(mission.total_price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucune mission trouvée</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenus" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">Mes Revenus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenus du mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(earnings.monthly)}
                  </div>
                  <p className="text-sm text-green-600">
                    +12% par rapport au mois dernier
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenus totaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(earnings.total)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Depuis le début
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prévisions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
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

          <TabsContent value="evaluations" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">Mes Évaluations</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {profile?.rating?.toFixed(1) || '4.8'}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(profile?.rating || 4.8) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {reviews.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Avis reçus</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    98%
                  </div>
                  <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {missions.filter(m => m.status === 'completed').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Missions réalisées</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Liste des avis */}
            <Card>
              <CardHeader>
                <CardTitle>Avis clients récents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun avis pour le moment</p>
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