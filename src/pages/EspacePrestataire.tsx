import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FileUpload from "@/components/FileUpload";
import { Calendar, MapPin, Star, DollarSign, Clock, User, FileText, Settings, BarChart3, MessageSquare, Upload, CheckCircle, AlertCircle, XCircle, Camera, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EspacePrestataire = () => {
  const { user } = useAuth();
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
    avatar_url: ""
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProviderProfile();
    }
  }, [user]);

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
          avatar_url: userProfile?.avatar_url || ""
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
          
          // Calculer les revenus
          const total = missionsData
            .filter(m => m.status === 'completed')
            .reduce((sum, m) => sum + m.total_price, 0);
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthly = missionsData
            .filter(m => {
              const missionDate = new Date(m.booking_date);
              return m.status === 'completed' && 
                     missionDate.getMonth() === currentMonth && 
                     missionDate.getFullYear() === currentYear;
            })
            .reduce((sum, m) => sum + m.total_price, 0);
          
          setTotalEarnings(total);
          setMonthlyEarnings(monthly);
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

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

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
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
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
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Mettez à jour vos informations professionnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo de profil */}
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label>Photo de profil</Label>
                    <FileUpload 
                      bucketName="provider-documents"
                      path="avatar"
                      title="Changer la photo"
                      description="JPG, PNG jusqu'à 2MB"
                      acceptedTypes=".jpg,.jpeg,.png"
                      maxSize={2}
                      onUploadComplete={(url) => {
                        if (url) {
                          setProfile(prev => ({ ...prev, avatar_url: url }));
                          toast({
                            title: "Photo mise à jour",
                            description: "Votre photo de profil a été mise à jour",
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Votre prénom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Votre nom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nom de l'entreprise</Label>
                    <Input
                      id="business_name"
                      value={profile.business_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, business_name: e.target.value }))}
                      placeholder="Mon entreprise"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siret_number">Numéro SIRET</Label>
                    <Input
                      id="siret_number"
                      value={profile.siret_number}
                      onChange={(e) => setProfile(prev => ({ ...prev, siret_number: e.target.value }))}
                      placeholder="12345678901234"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Paris, France"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description de vos services</Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre expérience et vos spécialisations..."
                    rows={4}
                  />
                </div>

                <Button onClick={saveProfile} disabled={isLoading} className="w-full">
                  {isLoading ? "Sauvegarde..." : "Sauvegarder le profil"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Gestion des documents
                </CardTitle>
                <CardDescription>
                  Téléchargez vos documents professionnels et justificatifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Documents existants */}
                  {documents.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Documents téléchargés</Label>
                      <div className="grid gap-3">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {getDocumentIcon(doc.status)}
                              <div>
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.document_type.replace('_', ' ').toUpperCase()} - {doc.status === 'pending' ? 'En attente' : doc.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {doc.status === 'pending' ? 'En attente' : doc.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload de nouveaux documents */}
                  <div className="grid gap-6">
                    <FileUpload 
                      bucketName="provider-documents"
                      path="auto_entrepreneur"
                      title="Document d'auto-entrepreneur"
                      description="Téléchargez votre document d'auto-entrepreneur (PDF, JPG, PNG)"
                      acceptedTypes=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      onUploadComplete={(url) => {
                        if (url) {
                          loadProviderProfile();
                          toast({
                            title: "Document téléchargé",
                            description: "Votre document d'auto-entrepreneur a été téléchargé avec succès",
                          });
                        }
                      }}
                    />
                    
                    <FileUpload 
                      bucketName="provider-documents"
                      path="casier_judiciaire"
                      title="Casier judiciaire"
                      description="Téléchargez votre casier judiciaire (PDF, JPG, PNG)"
                      acceptedTypes=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      onUploadComplete={(url) => {
                        if (url) {
                          loadProviderProfile();
                          toast({
                            title: "Document téléchargé",
                            description: "Votre casier judiciaire a été téléchargé avec succès",
                          });
                        }
                      }}
                    />
                    
                    <FileUpload 
                      bucketName="provider-documents"
                      path="autres_autorisations"
                      title="Autres autorisations"
                      description="Téléchargez vos autres autorisations professionnelles (PDF, JPG, PNG)"
                      acceptedTypes=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      onUploadComplete={(url) => {
                        if (url) {
                          loadProviderProfile();
                          toast({
                            title: "Document téléchargé",
                            description: "Votre document a été téléchargé avec succès",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Gestion des missions
                </CardTitle>
                <CardDescription>
                  Visualisez et gérez vos missions assignées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {missions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune mission assignée pour le moment
                    </p>
                  ) : (
                    missions.map((mission) => (
                      <div key={mission.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Mission #{mission.id.slice(0, 8)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(mission.booking_date).toLocaleDateString()} - {mission.start_time}
                            </p>
                          </div>
                          <Badge variant={
                            mission.status === 'pending' ? 'secondary' :
                            mission.status === 'accepted' ? 'default' :
                            mission.status === 'completed' ? 'default' :
                            'destructive'
                          }>
                            {mission.status === 'pending' ? 'En attente' :
                             mission.status === 'accepted' ? 'Acceptée' :
                             mission.status === 'completed' ? 'Terminée' :
                             'Refusée'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p><strong>Adresse:</strong> {mission.location}</p>
                          <p><strong>Prix:</strong> {mission.total_price}€</p>
                          {mission.notes && <p><strong>Notes:</strong> {mission.notes}</p>}
                        </div>

                        {mission.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => acceptMission(mission.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accepter
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => refuseMission(mission.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paiements Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenus mensuels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{monthlyEarnings}€</p>
                    <p className="text-muted-foreground">Ce mois-ci</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenus totaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{totalEarnings}€</p>
                    <p className="text-muted-foreground">Total gagné</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {missions
                    .filter(m => m.status === 'completed')
                    .map((mission) => (
                      <div key={mission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Mission #{mission.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(mission.booking_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">+{mission.total_price}€</p>
                          <p className="text-xs text-muted-foreground">Payé</p>
                        </div>
                      </div>
                    ))}
                  {missions.filter(m => m.status === 'completed').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun paiement reçu pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Mes missions
                </CardTitle>
                <CardDescription>
                  Consultez vos missions en cours et passées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune mission pour le moment</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Les nouvelles missions apparaîtront ici une fois qu'elles vous seront assignées
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Paiements
                </CardTitle>
                <CardDescription>
                  Gérez vos paiements et factures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun paiement pour le moment</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vos paiements et factures apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Paramètres
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences et notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notifications par email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les nouvelles missions
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Disponibilité</Label>
                      <p className="text-sm text-muted-foreground">
                        Définir vos créneaux de disponibilité
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EspacePrestataire;