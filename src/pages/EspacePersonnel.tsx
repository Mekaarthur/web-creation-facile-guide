import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, Bell, History, FileText, UserRound, Lock, User, Settings, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingsList from "@/components/BookingsList";
import FileUpload from "@/components/FileUpload";
import ReferralProgram from "@/components/ReferralProgram";
import PaymentMethodsManager from "@/components/PaymentMethodsManager";
import InvoiceManagement from "@/components/InvoiceManagement";

const EspacePersonnel = () => {
  const [selectedTab, setSelectedTab] = useState("connexion");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

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
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="connexion" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Connexion
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Réservations & Prestations
              </TabsTrigger>
              <TabsTrigger value="factures" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Factures
              </TabsTrigger>
              <TabsTrigger value="profil" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Mon Profil
              </TabsTrigger>
              <TabsTrigger value="calendrier" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="parrainage" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Parrainage
              </TabsTrigger>
            </TabsList>

            {/* Connexion / Inscription */}
            <TabsContent value="connexion" className="space-y-6">
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserRound className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isLoginMode ? "Se connecter" : "S'inscrire"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {isLoginMode 
                      ? "Accédez à votre espace client Assist'mw" 
                      : "Créez votre compte pour profiter de nos services"
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isLoginMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input id="prenom" placeholder="Votre prénom" />
                      </div>
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" placeholder="Votre nom" />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="votre.email@exemple.com" />
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" type="password" placeholder="••••••••" />
                  </div>
                  {!isLoginMode && (
                    <div>
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input id="confirm-password" type="password" placeholder="••••••••" />
                    </div>
                  )}
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setSelectedTab("reservations");
                    }}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {isLoginMode ? "Se connecter" : "Créer mon compte"}
                  </Button>
                  <div className="text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsLoginMode(!isLoginMode)}
                    >
                      {isLoginMode 
                        ? "Pas encore de compte ? S'inscrire" 
                        : "Déjà un compte ? Se connecter"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

            {/* Factures et paiements */}
            <TabsContent value="factures" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <InvoiceManagement />
                <PaymentMethodsManager />
              </div>
            </TabsContent>

            {/* Profil utilisateur */}
            <TabsContent value="profil" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prenom-profil">Prénom</Label>
                        <Input id="prenom-profil" defaultValue="Jean" />
                      </div>
                      <div>
                        <Label htmlFor="nom-profil">Nom</Label>
                        <Input id="nom-profil" defaultValue="Dupont" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email-profil">Email</Label>
                      <Input id="email-profil" type="email" defaultValue="jean.dupont@exemple.com" />
                    </div>
                    <div>
                      <Label htmlFor="telephone-profil">Téléphone</Label>
                      <Input id="telephone-profil" defaultValue="06 12 34 56 78" />
                    </div>
                    <div>
                      <Label htmlFor="adresse-profil">Adresse</Label>
                      <Input id="adresse-profil" defaultValue="123 rue de la Paix, 75001 Paris" />
                    </div>
                    <Button className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Mettre à jour mes informations
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