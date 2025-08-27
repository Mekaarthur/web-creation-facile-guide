import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  FileText, 
  Star, 
  MapPin, 
  Clock,
  Briefcase,
  Settings,
  DollarSign,
  TrendingUp,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import ProviderDashboard from '@/components/ProviderDashboard';
import ProviderNavbar from '@/components/ProviderNavbar';
import ProfileUpdateForm from '@/components/ProfileUpdateForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';

const EspacePrestataire = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    business_name: "",
    description: "",
    location: "",
    rating: 0,
    is_verified: false,
    siret_number: "",
    first_name: "",
    last_name: "",
    avatar_url: "",
    provider_id: ""
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [completedReferrals, setCompletedReferrals] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    console.log("EspacePrestataire - user:", user, "loading:", loading);
    if (user) {
      loadProviderProfile();
    }
  }, [user, loading]);

  const loadProviderProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement du profil:', error);
        return;
      }

      if (data) {
        // Charger aussi le profil utilisateur
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setProfile({
          business_name: data.business_name || "",
          description: data.description || "",
          location: data.location || "",
          rating: data.rating || 0,
          is_verified: data.is_verified || false,
          siret_number: data.siret_number || "",
          first_name: userProfile?.first_name || "",
          last_name: userProfile?.last_name || "",
          avatar_url: userProfile?.avatar_url || "",
          provider_id: data.id
        });

        // Charger les documents
        const { data: documentsData } = await supabase
          .from('provider_documents')
          .select('*')
          .eq('provider_id', data.id);
        
        if (documentsData) {
          setDocuments(documentsData);
        }

        // Charger les missions
        const { data: missionsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('provider_id', data.id);
        
        if (missionsData) {
          setMissions(missionsData);
        }

        // Utiliser les earnings calculés automatiquement par la base de données
        setTotalEarnings(data.total_earnings || 0);
        setMonthlyEarnings(data.monthly_earnings || 0);

        // Charger les notifications
        const { data: notificationsData } = await supabase
          .from('provider_notifications')
          .select('*')
          .eq('provider_id', data.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (notificationsData) {
          setNotifications(notificationsData);
        }

        // Charger le code de parrainage et les statistiques
        const { data: referralData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id);
        
        if (referralData && referralData.length > 0) {
          setReferralCode(referralData[0].referral_code);
          
          // Calculer les statistiques de parrainage
          const activeReferrals = referralData.filter(r => r.status === 'pending').length;
          const completedReferrals = referralData.filter(r => r.status === 'completed').length;
          const totalEarnings = referralData
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
          
          setActiveReferrals(activeReferrals);
          setCompletedReferrals(completedReferrals);
          setReferralEarnings(totalEarnings);
        } else {
          // Générer un nouveau code de parrainage
          const { data: newCode } = await supabase.rpc('generate_referral_code');
          if (newCode) {
            const { error: insertError } = await supabase
              .from('referrals')
              .insert({
                referrer_id: user.id,
                referral_code: newCode
              });
            
            if (!insertError) {
              setReferralCode(newCode);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updateData = {
        business_name: profile.business_name,
        description: profile.description,
        location: profile.location,
        siret_number: profile.siret_number,
        updated_at: new Date().toISOString()
      };

      // Mettre à jour aussi le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      const { data: existingProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProvider) {
        const { error } = await supabase
          .from('providers')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('providers')
          .insert([{
            user_id: user.id,
            ...updateData
          }]);

        if (error) throw error;
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Mission acceptée",
        description: "Vous avez accepté cette mission",
      });

      loadProviderProfile();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'acceptation de la mission",
        variant: "destructive",
      });
    }
  };

  const refuseMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'refused' })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Mission refusée",
        description: "Vous avez refusé cette mission",
      });

      loadProviderProfile();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du refus de la mission",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (file: File, documentType: string) => {
    if (!user) return;

    setIsUploadingDoc(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get provider ID
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!providerData) throw new Error('Provider not found');

      // Save document record
      const { error: docError } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: providerData.id,
          document_type: documentType,
          file_name: file.name,
          file_url: fileName,
          file_size: file.size
        });

      if (docError) throw docError;

      toast({
        title: "Document téléchargé",
        description: "Votre document a été téléchargé avec succès",
      });

      // Reload documents
      loadProviderProfile();

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du document",
        variant: "destructive",
      });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const configureNotifications = () => {
    toast({
      title: "Configuration des notifications",
      description: "Cette fonctionnalité sera disponible prochainement",
    });
  };

  const modifyAvailability = () => {
    // Rediriger vers l'onglet calendrier
    const calendarTab = document.querySelector('[value="calendar"]') as HTMLElement;
    calendarTab?.click();
    
    toast({
      title: "Disponibilité",
      description: "Utilisez le calendrier pour modifier vos disponibilités",
    });
  };

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à l'espace prestataire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProviderNavbar />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Espace Prestataire</h1>
              <p className="text-muted-foreground">Gérez votre profil et vos prestations</p>
            </div>
            {profile.is_verified && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-4 h-4 mr-1" />
                Vérifié
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{profile.rating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Note moyenne</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{monthlyEarnings}€</p>
                    <p className="text-sm text-muted-foreground">Revenus ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{missions.filter(m => {
                      const missionDate = new Date(m.booking_date);
                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();
                      return missionDate.getMonth() === currentMonth && missionDate.getFullYear() === currentYear;
                    }).length}</p>
                    <p className="text-sm text-muted-foreground">Missions ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalEarnings}€</p>
                    <p className="text-sm text-muted-foreground">Revenus total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="revenus" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenus
            </TabsTrigger>
            <TabsTrigger value="calendrier" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Évaluations
            </TabsTrigger>
            <TabsTrigger value="profil" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="mot-de-passe" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Mot de passe
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <ProviderDashboard onNavigateToTab={(tab) => {
              // Trouver et cliquer sur l'onglet correspondant
              const tabElement = document.querySelector(`[value="${tab}"]`) as HTMLElement;
              if (tabElement) {
                tabElement.click();
              }
            }} />
          </TabsContent>

          {/* Profil utilisateur */}
          <TabsContent value="profil" className="space-y-6">
            <ProfileUpdateForm userType="provider" />
          </TabsContent>

          {/* Mot de passe */}
          <TabsContent value="mot-de-passe" className="space-y-6">
            <PasswordChangeForm />
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Missions disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Liste des missions à venir</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenus Tab */}
          <TabsContent value="revenus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Revenus mensuels: {monthlyEarnings}€</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendrier Tab */}
          <TabsContent value="calendrier" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mon calendrier</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Gestion des disponibilités</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes évaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Note moyenne: {profile.rating}/5</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EspacePrestataire;