import { useState } from "react";
import { BookingManagement } from '@/components/BookingManagement';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, Bell, History, FileText, UserRound, Lock, MapPin, Star, Euro, User, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingsList from "@/components/BookingsList";
import FileUpload from "@/components/FileUpload";

const EspacePrestataire = () => {
  const [selectedTab, setSelectedTab] = useState("connexion");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const prestations = [
    {
      id: "PRES001",
      client: "Marie L.",
      service: "Assist'Kids - Garde ponctuelle",
      date: "2024-01-15",
      heure: "14:00 - 18:00",
      statut: "Confirmé",
      remuneration: "120€",
      adresse: "15 rue des Lilas, Paris 15ème"
    },
    {
      id: "PRES002", 
      client: "Jean M.",
      service: "Assist'Maison - Ménage",
      date: "2024-01-18",
      heure: "09:00 - 12:00",
      statut: "En cours",
      remuneration: "60€",
      adresse: "8 avenue Victor Hugo, Paris 16ème"
    },
    {
      id: "PRES003",
      client: "Sophie D.",
      service: "Assist'Vie - Accompagnement courses",
      date: "2024-01-22",
      heure: "15:00 - 17:00",
      statut: "À venir",
      remuneration: "45€",
      adresse: "22 boulevard Saint-Germain, Paris 7ème"
    }
  ];

  const revenus = [
    {
      id: "REV001",
      periode: "Janvier 2024",
      montant: "1,240€",
      prestations: 8,
      statut: "Versé",
      date_versement: "2024-02-01"
    },
    {
      id: "REV002",
      periode: "Décembre 2023", 
      montant: "1,580€",
      prestations: 12,
      statut: "Versé",
      date_versement: "2024-01-01"
    }
  ];

  const evaluations = [
    {
      client: "Marie L.",
      service: "Garde d'enfant",
      note: 5,
      commentaire: "Excellente prestataire, très professionnelle avec les enfants",
      date: "2024-01-16"
    },
    {
      client: "Jean M.",
      service: "Ménage",
      note: 4,
      commentaire: "Travail soigné et ponctuelle",
      date: "2024-01-12"
    }
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "Confirmé": return "bg-accent text-accent-foreground";
      case "En cours": return "bg-gradient-primary text-white";
      case "À venir": return "bg-secondary text-secondary-foreground";
      case "Versé": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < note ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Mon Espace Prestataire</h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos prestations, suivez vos revenus et consultez vos évaluations
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
                <Calendar className="w-4 h-4" />
                Réservations
              </TabsTrigger>
              <TabsTrigger value="prestations" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="revenus" className="flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Revenus
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Évaluations
              </TabsTrigger>
              <TabsTrigger value="profil" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Mon Profil
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
                    {isLoginMode ? "Espace Prestataire" : "Devenir Prestataire"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {isLoginMode 
                      ? "Connectez-vous à votre espace prestataire Assist'mw" 
                      : "Rejoignez notre équipe de prestataires qualifiés"
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
                    <>
                      <div>
                        <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                        <Input id="confirm-password" type="password" placeholder="••••••••" />
                      </div>
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input id="telephone" placeholder="06 12 34 56 78" />
                      </div>
                      <div>
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input id="adresse" placeholder="Votre adresse complète" />
                      </div>
                    </>
                  )}
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setSelectedTab("prestations");
                    }}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {isLoginMode ? "Se connecter" : "Créer mon profil prestataire"}
                  </Button>
                  <div className="text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsLoginMode(!isLoginMode)}
                    >
                      {isLoginMode 
                        ? "Nouveau prestataire ? S'inscrire" 
                        : "Déjà prestataire ? Se connecter"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gestion des réservations en temps réel */}
            <TabsContent value="reservations" className="space-y-6">
              <BookingManagement />
            </TabsContent>

            {/* Prestations */}
            <TabsContent value="prestations" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Historique des prestations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BookingsList userType="provider" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenus */}
            <TabsContent value="revenus" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Euro className="w-5 h-5 text-primary" />
                      Mes revenus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {revenus.map((revenu) => (
                      <div key={revenu.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{revenu.periode}</p>
                          <p className="text-sm text-muted-foreground">{revenu.prestations} prestations</p>
                          <p className="text-sm text-muted-foreground">Versé le {revenu.date_versement}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground text-lg">{revenu.montant}</p>
                          <Badge className={getStatusColor(revenu.statut)}>{revenu.statut}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Informations de paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">RIB principal</p>
                        <p className="text-sm text-muted-foreground">IBAN: FR76 **** **** **** 1234</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">Statut auto-entrepreneur</p>
                        <p className="text-sm text-muted-foreground">SIRET: 123 456 789 00012</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">Assurance responsabilité</p>
                        <p className="text-sm text-muted-foreground">Valide jusqu'au 31/12/2024</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Modifier mes informations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Évaluations */}
            <TabsContent value="evaluations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Mes évaluations clients
                    <Badge className="bg-gradient-primary text-white">4.5/5</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluations.map((evaluation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-foreground">{evaluation.client}</p>
                          <p className="text-sm text-muted-foreground">{evaluation.service}</p>
                          <p className="text-xs text-muted-foreground">{evaluation.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(evaluation.note)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        "{evaluation.commentaire}"
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profil prestataire */}
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
                        <Input id="prenom-profil" defaultValue="Marie" />
                      </div>
                      <div>
                        <Label htmlFor="nom-profil">Nom</Label>
                        <Input id="nom-profil" defaultValue="Martin" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email-profil">Email</Label>
                      <Input id="email-profil" type="email" defaultValue="marie.martin@exemple.com" />
                    </div>
                    <div>
                      <Label htmlFor="telephone-profil">Téléphone</Label>
                      <Input id="telephone-profil" defaultValue="06 98 76 54 32" />
                    </div>
                    <div>
                      <Label htmlFor="adresse-profil">Adresse</Label>
                      <Input id="adresse-profil" defaultValue="45 avenue de la République, 75011 Paris" />
                    </div>
                    <div>
                      <Label htmlFor="business-name">Nom commercial (optionnel)</Label>
                      <Input id="business-name" defaultValue="Marie Services+" />
                    </div>
                    <div>
                      <Label htmlFor="description-profil">Description de vos services</Label>
                      <Input id="description-profil" defaultValue="Prestataire expérimentée en garde d'enfants et services domestiques" />
                    </div>
                    <div>
                      <Label htmlFor="siret-profil">Numéro SIRET</Label>
                      <Input id="siret-profil" placeholder="123 456 789 00012" />
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
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Documents de vérification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FileUpload
                        bucketName="documents"
                        path="identity"
                        acceptedTypes=".pdf,.jpg,.jpeg,.png"
                        maxSize={5}
                        title="Pièce d'identité"
                        description="Carte d'identité, passeport ou permis de conduire"
                        onUploadComplete={(url) => {
                          console.log('Document d\'identité uploadé:', url);
                        }}
                      />
                      
                      <FileUpload
                        bucketName="documents"
                        path="insurance"
                        acceptedTypes=".pdf,.jpg,.jpeg,.png"
                        maxSize={5}
                        title="Assurance responsabilité civile"
                        description="Attestation d'assurance en cours de validité"
                        onUploadComplete={(url) => {
                          console.log('Assurance uploadée:', url);
                        }}
                      />
                      
                      <FileUpload
                        bucketName="documents"
                        path="auto-entrepreneur"
                        acceptedTypes=".pdf,.jpg,.jpeg,.png"
                        maxSize={5}
                        title="Statut auto-entrepreneur"
                        description="Attestation URSSAF ou déclaration auto-entrepreneur"
                        onUploadComplete={(url) => {
                          console.log('Document auto-entrepreneur uploadé:', url);
                        }}
                      />
                      
                      <FileUpload
                        bucketName="documents"
                        path="authorizations"
                        acceptedTypes=".pdf,.jpg,.jpeg,.png"
                        maxSize={5}
                        title="Autres autorisations"
                        description="Diplômes, certifications ou autres documents professionnels"
                        onUploadComplete={(url) => {
                          console.log('Autorisation uploadée:', url);
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Planning */}
            <TabsContent value="planning" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Mon planning de disponibilités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Gérez vos disponibilités
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Définissez vos créneaux de disponibilité pour recevoir des demandes de prestations
                    </p>
                    <Button variant="hero">Configurer mon planning</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EspacePrestataire;