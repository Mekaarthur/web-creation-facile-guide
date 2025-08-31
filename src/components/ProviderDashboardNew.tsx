import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  User, 
  Star, 
  GraduationCap, 
  Gift, 
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Target,
  Filter,
  Heart,
  Award,
  BookOpen,
  Users,
  Share2,
  Copy,
  RefreshCw,
  FileText,
  CreditCard,
  Settings,
  Phone,
  MessageCircle,
  Camera,
  Download,
  PlusCircle,
  Edit3,
  Eye,
  ArrowRight,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ProviderDashboardNew = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ monthly: 0, total: 0 });
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>({ code: '', active: 0, completed: 0, earnings: 0 });
  const [monthlyGoal, setMonthlyGoal] = useState(2000);
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
          .order('booking_date', { ascending: false });

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

        // Charger les données de parrainage
        const { data: referralData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id);

        if (referralData && referralData.length > 0) {
          setRewards({
            code: referralData[0].referral_code,
            active: referralData.filter(r => r.status === 'pending').length,
            completed: referralData.filter(r => r.status === 'completed').length,
            earnings: referralData.filter(r => r.status === 'completed')
              .reduce((sum, r) => sum + (r.reward_amount || 0), 0)
          });
        }
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
    return Math.min((earnings.monthly / monthlyGoal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const motivationalQuotes = [
    "Chaque mission est une nouvelle opportunité de briller !",
    "Votre talent fait la différence dans la vie de vos clients.",
    "Aujourd'hui est parfait pour dépasser vos objectifs !",
    "L'excellence n'est pas un acte, mais une habitude.",
    "Transformez chaque service en expérience mémorable !"
  ];

  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 bg-secondary/20 h-auto p-1">
          <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs">Tableau de Bord</span>
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs">Mes Missions</span>
          </TabsTrigger>
          <TabsTrigger value="revenus" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Revenus</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Planning</span>
          </TabsTrigger>
          <TabsTrigger value="profil" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <User className="h-4 w-4" />
            <span className="text-xs">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Star className="h-4 w-4" />
            <span className="text-xs">Évaluations</span>
          </TabsTrigger>
          <TabsTrigger value="formation" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs">Formation</span>
          </TabsTrigger>
          <TabsTrigger value="parrainage" className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Gift className="h-4 w-4" />
            <span className="text-xs">Parrainage</span>
          </TabsTrigger>
        </TabsList>

        {/* A) TABLEAU DE BORD */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Message de bienvenue */}
          <div className="bg-gradient-to-r from-secondary/10 to-secondary/20 rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Bienvenue cher Bika Pro {profile?.profiles?.first_name || 'Prestataire'} ! 👋
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  Prêt(e) à générer des revenus aujourd'hui ?
                </p>
                <div className="bg-secondary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-secondary" />
                    <p className="font-medium text-secondary">Motivation du jour</p>
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{todayQuote}"</p>
                </div>
              </div>
              
              {/* Dashboard miniature */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-secondary/20 to-secondary/30 border-secondary/30">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-xl font-bold text-secondary">{formatCurrency(earnings.monthly)}</p>
                    <p className="text-xs text-muted-foreground">Ce mois</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-secondary/20 to-secondary/30 border-secondary/30">
                  <CardContent className="p-4 text-center">
                    <Briefcase className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-xl font-bold text-secondary">{missions.filter(m => m.status === 'pending').length}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-secondary/20 to-secondary/30 border-secondary/30">
                  <CardContent className="p-4 text-center">
                    <Star className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-xl font-bold text-secondary">{profile?.rating?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Note moyenne</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-secondary/20 to-secondary/30 border-secondary/30">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-xl font-bold text-secondary">{reviews.length}</p>
                    <p className="text-xs text-muted-foreground">Avis récents</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Objectifs du mois */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                Objectifs du mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Objectif revenus</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(earnings.monthly)} / {formatCurrency(monthlyGoal)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getProgressPercentage().toFixed(0)}% de votre objectif atteint
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vos Opportunités du Jour */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-secondary" />
                  Vos Opportunités du Jour
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Près de chez moi
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Mes spécialités
                  </Button>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Bien rémunérées
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="border-secondary/20 hover:border-secondary/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {opportunity.services?.name}
                          </Badge>
                          <span className="font-bold text-secondary">{formatCurrency(opportunity.total_price)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(opportunity.booking_date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {opportunity.start_time} - {opportunity.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {opportunity.address || 'À préciser'}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-secondary hover:bg-secondary/90"
                          onClick={() => applyToMission(opportunity.id)}
                        >
                          Postuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {opportunities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune opportunité disponible pour le moment</p>
                  <p className="text-xs mt-1">Revenez plus tard pour découvrir de nouvelles missions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* B) MES MISSIONS */}
        <TabsContent value="missions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mes Missions</h2>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <Tabs defaultValue="en-cours" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="en-cours">En cours</TabsTrigger>
              <TabsTrigger value="a-venir">À venir</TabsTrigger>
              <TabsTrigger value="en-attente">En attente validation</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="en-cours" className="space-y-4">
              <div className="grid gap-4">
                {missions.filter(m => m.status === 'in_progress').map((mission) => (
                  <Card key={mission.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{mission.services?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Client: {mission.profiles?.first_name} {mission.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{mission.address}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className="bg-secondary">En cours</Badge>
                          <p className="font-bold">{formatCurrency(mission.total_price)}</p>
                          <div className="flex gap-2">
                            <Button size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Contacter
                            </Button>
                            <Button size="sm" variant="outline">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Signaler
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="a-venir" className="space-y-4">
              <div className="grid gap-4">
                {missions.filter(m => m.status === 'confirmed' && new Date(m.booking_date) > new Date()).map((mission) => (
                  <Card key={mission.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{mission.services?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(mission.booking_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          <p className="text-sm text-muted-foreground">{mission.address}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className="bg-blue-500">Confirmé</Badge>
                          <p className="font-bold">{formatCurrency(mission.total_price)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="en-attente" className="space-y-4">
              <div className="grid gap-4">
                {missions.filter(m => m.status === 'pending').map((mission) => (
                  <Card key={mission.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{mission.services?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(mission.booking_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant="secondary">En attente</Badge>
                          <p className="font-bold">{formatCurrency(mission.total_price)}</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accepter
                            </Button>
                            <Button size="sm" variant="destructive">
                              Décliner
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="historique" className="space-y-4">
              <div className="grid gap-4">
                {missions.filter(m => m.status === 'completed').slice(0, 10).map((mission) => (
                  <Card key={mission.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{mission.services?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Terminé le {format(new Date(mission.completed_at), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className="bg-green-500">Terminé</Badge>
                          <p className="font-bold">{formatCurrency(mission.total_price)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* C) MES REVENUS ET PAIEMENTS */}
        <TabsContent value="revenus" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mes Revenus et Paiements</h2>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Télécharger rapport
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenus du mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">
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
                <div className="text-3xl font-bold text-secondary mb-2">
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
                <div className="text-3xl font-bold text-secondary mb-2">
                  {formatCurrency(earnings.monthly * 1.2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Estimation fin de mois
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique d'évolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Graphique d'évolution des revenus</p>
                  <p className="text-xs">Fonctionnalité disponible prochainement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Moyens de paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Moyens de paiement
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Compte bancaire principal</p>
                      <p className="text-sm text-muted-foreground">IBAN: FR76 **** **** **** **42</p>
                    </div>
                  </div>
                  <Badge>Par défaut</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* D) MON PLANNING */}
        <TabsContent value="planning" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mon Planning</h2>
            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau créneau
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Calendrier interactif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Calendrier interactif</p>
                      <p className="text-xs">Cliquez pour définir vos disponibilités</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Créneaux récurrents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">Lundi - Vendredi</p>
                    <p className="text-muted-foreground">09:00 - 18:00</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Samedi</p>
                    <p className="text-muted-foreground">09:00 - 14:00</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prochaines indisponibilités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune indisponibilité programmée</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* E) MON PROFIL PRESTATAIRE */}
        <TabsContent value="profil" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mon Profil Prestataire</h2>
            <Button>
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier le profil
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto flex items-center justify-center">
                  {profile?.profiles?.avatar_url ? (
                    <img 
                      src={profile.profiles.avatar_url} 
                      alt="Photo de profil" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Changer la photo
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input value={profile?.profiles?.first_name || ''} readOnly />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input value={profile?.profiles?.last_name || ''} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Nom commercial</Label>
                    <Input value={profile?.business_name || ''} readOnly />
                  </div>
                  <div>
                    <Label>Présentation</Label>
                    <Textarea 
                      value={profile?.description || ''} 
                      readOnly 
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zone d'intervention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Localisation</Label>
                      <Input value={profile?.location || ''} readOnly />
                    </div>
                    <div>
                      <Label>Rayon d'intervention</Label>
                      <Input value="20 km" readOnly />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* F) ÉVALUATIONS ET AVIS */}
        <TabsContent value="evaluations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Évaluations et Avis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {profile?.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(profile?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Note globale</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {reviews.length}
                </div>
                <p className="text-sm text-muted-foreground">Avis reçus</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  98%
                </div>
                <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  95%
                </div>
                <p className="text-sm text-muted-foreground">Ponctualité</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges de reconnaissance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Badges de reconnaissance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-yellow-500 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Top prestataire
                </Badge>
                <Badge className="bg-green-500 text-white px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Ponctuel
                </Badge>
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  <Heart className="h-3 w-3 mr-1" />
                  Recommandé
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Avis récents */}
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
                          className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
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
                  <p className="text-xs mt-1">Vos premiers avis apparaîtront ici</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* G) FORMATION ET SUPPORT */}
        <TabsContent value="formation" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Formation et Support</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  Modules de formation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Excellence du service</p>
                    <p className="text-xs text-muted-foreground">Perfectionnez votre approche client</p>
                  </div>
                  <Button size="sm">Commencer</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Gestion du temps</p>
                    <p className="text-xs text-muted-foreground">Optimisez votre planning</p>
                  </div>
                  <Button size="sm" variant="outline">Voir</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Communication client</p>
                    <p className="text-xs text-muted-foreground">Maîtrisez l'art de la relation client</p>
                  </div>
                  <Button size="sm" variant="outline">Voir</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                  Centre d'aide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Support téléphonique
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat en direct
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  FAQ Prestataires
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Communauté
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Événements communautaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Webinaire : Développer sa clientèle</h4>
                    <Badge>15 Mars</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Découvrez les meilleures stratégies pour fidéliser vos clients et développer votre activité.
                  </p>
                  <Button size="sm">
                    S'inscrire
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* H) PARRAINAGE ET RÉCOMPENSES */}
        <TabsContent value="parrainage" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Parrainage et Récompenses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Gift className="h-8 w-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-bold text-secondary mb-2">
                  {rewards.active}
                </div>
                <p className="text-sm text-muted-foreground">Parrainages actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-secondary mb-2">
                  {rewards.completed}
                </div>
                <p className="text-sm text-muted-foreground">Parrainages réussis</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-secondary mb-2">
                  {formatCurrency(rewards.earnings)}
                </div>
                <p className="text-sm text-muted-foreground">Gains parrainage</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-secondary" />
                Votre code de parrainage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Votre code unique :</p>
                  <p className="text-2xl font-bold text-secondary">{rewards.code || 'Génération en cours...'}</p>
                </div>
                <Button>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Partagez ce code avec vos proches et gagnez <strong>30€</strong> pour chaque nouveau prestataire qui rejoint Bikawo grâce à vous !</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Système de récompenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Points fidélité</p>
                      <p className="text-sm text-muted-foreground">Gagnez des points à chaque mission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary">1,240</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Récompenses disponibles</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Formation premium</span>
                        <span className="text-secondary">500 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus 50€</span>
                        <span className="text-secondary">1000 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kit professionnel</span>
                        <span className="text-secondary">800 pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Comment gagner des points</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Mission réalisée</span>
                        <span>+10 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avis 5 étoiles</span>
                        <span>+25 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parrainage réussi</span>
                        <span>+100 pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboardNew;