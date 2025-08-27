import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import { 
  User, 
  Calendar, 
  FileText, 
  Gift, 
  Users, 
  CreditCard, 
  Settings,
  Lock,
  Download,
  MapPin,
  Clock,
  Star,
  History,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import ClientDashboard from '@/components/ClientDashboard';
import ProfileUpdateForm from '@/components/ProfileUpdateForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Auth from './Auth';
import BookingsList from '@/components/BookingsList';
import EnhancedCart from '@/components/EnhancedCart';
import InvoiceManagement from '@/components/InvoiceManagement';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { RewardsSection } from '@/components/RewardsSection';
import ReferralProgram from '@/components/ReferralProgram';

const EspacePersonnel = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(user ? "dashboard" : "connexion");
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "", 
    email: "",
    phone: "",
    address: ""
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Charger les données du profil utilisateur
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, address')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setProfileData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            address: data.address || ""
          });
        } else {
          // Profil inexistant, utiliser l'email de auth.users
          setProfileData(prev => ({ ...prev, email: user.email || "" }));
        }
      } catch (e: any) {
        console.error('Erreur chargement profil:', e);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos informations." });
      } finally {
        setLoadingProfile(false);
      }
    };
    
    loadProfileData();
  }, [user, toast]);

  // Rediriger vers connexion si pas authentifié et tentative d'accès à un onglet protégé
  useEffect(() => {
    const protectedTabs = ["dashboard", "reservations", "panier", "factures", "profil", "recompenses", "calendrier", "parrainage"];
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab') || selectedTab;
    
    if (!user && protectedTabs.includes(tabFromUrl)) {
      setSelectedTab("connexion");
    } else if (user && tabFromUrl && tabFromUrl !== "connexion") {
      setSelectedTab(tabFromUrl);
    } else if (user && selectedTab === "connexion") {
      setSelectedTab("dashboard");
    }
  }, [user, selectedTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  const reservations = [
    {
      id: "RES001",
      service: "Assist'Kids - Garde ponctuelle",
      date: "2024-01-15",
      heure: "14:00 - 18:00",
      statut: "Confirmé",
      prestataire: "Marie D.",
      prix: "120€"
    },
    {
      id: "RES002",
      service: "Assist'Maison - Courses express",
      date: "2024-01-18",
      heure: "16:00 - 17:30",
      statut: "En cours",
      prestataire: "Paul M.",
      prix: "45€"
    },
    {
      id: "RES003",
      service: "Assist'Travel - Transfert aéroport",
      date: "2024-01-22",
      heure: "06:00 - 08:00",
      statut: "À venir",
      prestataire: "Lucas R.",
      prix: "80€"
    }
  ];

  const factures = [
    {
      id: "FAC001",
      date: "2024-01-10",
      montant: "165€",
      statut: "Payée",
      services: "Assist'Kids (2 prestations)"
    },
    {
      id: "FAC002",
      date: "2024-01-05",
      montant: "280€",
      statut: "Payée",
      services: "Assist'Maison + Assist'Vie"
    }
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "Confirmé": return "bg-accent text-accent-foreground";
      case "En cours": return "bg-gradient-primary text-white";
      case "À venir": return "bg-secondary text-secondary-foreground";
      case "Payée": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Mon Espace Client</h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos réservations, suivez vos prestations et accédez à vos factures
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={selectedTab} onValueChange={(tab) => {
            // Vérifier l'authentification pour les onglets protégés
            const protectedTabs = ["dashboard", "reservations", "panier", "factures", "profil", "recompenses", "calendrier", "parrainage"];
            if (!user && protectedTabs.includes(tab)) {
              setSelectedTab("connexion");
              return;
            }
            setSelectedTab(tab);
            // Mettre à jour l'URL pour navigation directe
            const newUrl = new URL(window.location.href);
            if (tab === "connexion") {
              newUrl.searchParams.delete('tab');
            } else {
              newUrl.searchParams.set('tab', tab);
            }
            window.history.replaceState({}, '', newUrl);
          }} className="w-full">
            <TabsList className={`w-full mb-8 grid gap-1 ${user ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-8' : 'grid-cols-1'}`}>
              {!user && (
                <TabsTrigger value="connexion" className="flex items-center gap-2 min-h-12">
                  <Lock className="w-4 h-4" />
                  Se connecter
                </TabsTrigger>
              )}
              {user && (
                <>
                  <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="reservations" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Réservations</span>
                  </TabsTrigger>
                  <TabsTrigger value="factures" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Factures</span>
                  </TabsTrigger>
                  <TabsTrigger value="recompenses" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Gift className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Récompenses</span>
                  </TabsTrigger>
                  <TabsTrigger value="parrainage" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Parrainage</span>
                  </TabsTrigger>
                  <TabsTrigger value="profil" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="mot-de-passe" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Mot de passe</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Connexion / Inscription */}
            <TabsContent value="connexion" className="space-y-6">
              {!user ? (
                <Auth />
              ) : (
                <Card className="max-w-md mx-auto">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Bienvenue !</CardTitle>
                    <p className="text-muted-foreground">
                      Vous êtes connecté à votre espace client
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-center">
                      Email : <span className="font-medium">{user.email}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedTab("dashboard")}
                    >
                      Accéder à mon tableau de bord
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <ClientDashboard onNavigateToTab={setSelectedTab} />
            </TabsContent>

            {/* Réservations et Prestations combinées */}
            <TabsContent value="reservations" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Mes réservations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BookingsList userType="client" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Panier */}
            <TabsContent value="panier" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Mon Panier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedCart isOpen={true} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Factures et paiements */}
            <TabsContent value="factures" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <InvoiceManagement />
                <PaymentMethodsManager />
              </div>
            </TabsContent>

            {/* Profil utilisateur */}
            <TabsContent value="profil" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingProfile ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="prenom-profil" className="text-sm font-medium">Prénom</Label>
                            <Input 
                              id="prenom-profil" 
                              value={profileData.first_name}
                              onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                              className="min-h-12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nom-profil" className="text-sm font-medium">Nom</Label>
                            <Input 
                              id="nom-profil" 
                              value={profileData.last_name}
                              onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                              className="min-h-12"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email-profil" className="text-sm font-medium">Email</Label>
                          <Input 
                            id="email-profil" 
                            type="email" 
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="min-h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telephone-profil" className="text-sm font-medium">Téléphone</Label>
                          <Input 
                            id="telephone-profil" 
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            className="min-h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="adresse-profil" className="text-sm font-medium">Adresse</Label>
                          <Input 
                            id="adresse-profil" 
                            value={profileData.address}
                            onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                            className="min-h-12"
                          />
                        </div>
                      </>
                    )}
                    <Button className="w-full min-h-12" onClick={async () => {
                      try {
                        if (!user) {
                          toast({ variant: "destructive", title: "Non connecté", description: "Veuillez vous connecter pour mettre à jour vos informations." });
                          setSelectedTab("connexion");
                          return;
                        }
                        
                        setLoadingProfile(true);
                        
                        // Validation basique
                        const { first_name, last_name, email, phone, address } = profileData;
                        if (!first_name.trim() && !last_name.trim()) {
                          toast({ variant: "destructive", title: "Champs vides", description: "Veuillez saisir au moins un nom ou prénom." });
                          return;
                        }
                        
                        // Vérifier si un profil existe déjà
                        const { data: existing, error: fetchError } = await supabase
                          .from('profiles')
                          .select('id')
                          .eq('user_id', user.id)
                          .maybeSingle();
                        if (fetchError) throw fetchError;
                        
                        if (existing) {
                          const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ 
                              first_name: first_name.trim() || null, 
                              last_name: last_name.trim() || null,
                              email: email.trim() || null,
                              phone: phone.trim() || null,
                              address: address.trim() || null
                            })
                            .eq('user_id', user.id);
                          if (updateError) throw updateError;
                        } else {
                          const { error: insertError } = await supabase
                            .from('profiles')
                            .insert({ 
                              user_id: user.id, 
                              first_name: first_name.trim() || null, 
                              last_name: last_name.trim() || null,
                              email: email.trim() || null,
                              phone: phone.trim() || null,
                              address: address.trim() || null
                            });
                          if (insertError) throw insertError;
                        }
                        toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." });
                      } catch (e: any) {
                        console.error('Erreur maj profil', e);
                        toast({ variant: "destructive", title: "Erreur", description: e?.message || "Impossible de mettre à jour le profil." });
                      } finally {
                        setLoadingProfile(false);
                      }
                    }} disabled={loadingProfile}>
                      <Settings className="w-4 h-4 mr-2" />
                      {loadingProfile ? "Enregistrement..." : "Mettre à jour mes informations"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <FileUpload
                    bucketName="profiles"
                    path="avatars"
                    acceptedTypes="image/*"
                    maxSize={2}
                    title="Photo de profil"
                    description="Téléchargez votre photo de profil (JPEG, PNG, max 2MB)"
                    onUploadComplete={(url) => {
                      console.log('Avatar uploadé:', url);
                    }}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Préférences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notifications par email</p>
                          <p className="text-sm text-muted-foreground">Recevoir les confirmations de réservation</p>
                        </div>
                        <Button variant="outline" size="sm">Activé</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notifications SMS</p>
                          <p className="text-sm text-muted-foreground">Rappels de rendez-vous</p>
                        </div>
                        <Button variant="outline" size="sm">Désactivé</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Récompenses */}
            <TabsContent value="recompenses" className="space-y-6">
              <RewardsSection userType="client" />
            </TabsContent>

            {/* Calendrier familial */}
            <TabsContent value="calendrier" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Calendrier familial partagé
                    <Badge className="bg-gradient-primary text-white">Assist'Plus</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Calendrier familial
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Synchronisez vos rendez-vous familiaux et prestations Assist'mw
                    </p>
                    <Button variant="hero">Activer le calendrier</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Programme de parrainage */}
            <TabsContent value="parrainage" className="space-y-6">
              <ReferralProgram />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EspacePersonnel;