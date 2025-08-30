import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  FileText, 
  Gift, 
  Users, 
  CreditCard, 
  Lock,
  Download,
  LayoutDashboard,
  Receipt,
  UserCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Auth from './Auth';
import ClientDashboardNew from '@/components/ClientDashboardNew';
import BookingsList from '@/components/BookingsList';
import InvoiceManagement from '@/components/InvoiceManagement';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { RewardsSection } from '@/components/RewardsSection';
import ReferralProgram from '@/components/ReferralProgram';
import ProfileUpdateForm from '@/components/ProfileUpdateForm';
import AttestationsManager from '@/components/AttestationsManager';

const EspacePersonnel = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(user ? "dashboard" : "connexion");


  // Rediriger vers connexion si pas authentifié et tentative d'accès à un onglet protégé
  useEffect(() => {
    const protectedTabs = ["dashboard", "rendez-vous", "factures", "parrainage", "profil", "paiement", "attestations"];
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
              {user ? `Bienvenue ${user.email}` : "Connectez-vous pour accéder à votre espace personnel"}
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
            <TabsList className={`w-full mb-8 grid gap-1 ${user ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7' : 'grid-cols-1'}`}>
              {!user && (
                <TabsTrigger value="connexion" className="flex items-center gap-2 min-h-12">
                  <Lock className="w-4 h-4" />
                  Se connecter
                </TabsTrigger>
              )}
              {user && (
                <>
                  <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Tableau de Bord</span>
                  </TabsTrigger>
                  <TabsTrigger value="rendez-vous" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Rendez-vous</span>
                  </TabsTrigger>
                  <TabsTrigger value="factures" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Historique & Factures</span>
                  </TabsTrigger>
                  <TabsTrigger value="parrainage" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Parrainage</span>
                  </TabsTrigger>
                  <TabsTrigger value="profil" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Mon Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="paiement" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Paiement</span>
                  </TabsTrigger>
                  <TabsTrigger value="attestations" className="flex items-center gap-1 sm:gap-2 min-h-12 text-xs sm:text-sm">
                    <Receipt className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Attestations</span>
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
              <ClientDashboardNew onNavigateToTab={setSelectedTab} />
            </TabsContent>

            {/* Mes Rendez-vous à Venir */}
            <TabsContent value="rendez-vous" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Mes Rendez-vous à Venir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingsList userType="client" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Historique et Mes Factures */}
            <TabsContent value="factures" className="space-y-6">
              <InvoiceManagement />
            </TabsContent>

            {/* Parrainage */}
            <TabsContent value="parrainage" className="space-y-6">
              <div className="grid gap-6">
                <RewardsSection userType="client" />
                <ReferralProgram />
              </div>
            </TabsContent>

            {/* Mon Profil */}
            <TabsContent value="profil" className="space-y-6">
              <ProfileUpdateForm />
            </TabsContent>

            {/* Mes Moyens de Paiement */}
            <TabsContent value="paiement" className="space-y-6">
              <PaymentMethodsManager />
            </TabsContent>

            {/* Attestations Crédit d'Impôt et CAF */}
            <TabsContent value="attestations" className="space-y-6">
              <AttestationsManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EspacePersonnel;