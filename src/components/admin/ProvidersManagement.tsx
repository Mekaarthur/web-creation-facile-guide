import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Users,
  FileText,
  Send,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ApplicationDocumentsValidator } from './ApplicationDocumentsValidator';

interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  created_at: string;
  is_verified?: boolean;
  rating?: number;
  description?: string;
  location?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
  bookings?: any[];
  reviews?: any[];
  documents?: any[];
}

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  availability: string;
  motivation: string;
  experience_years: number | null;
  certifications: string | null;
  has_transport: boolean;
  cv_file_url: string | null;
  identity_document_url: string | null;
  criminal_record_url: string | null;
  criminal_record_date: string | null;
  siren_number: string | null;
  rib_iban_url: string | null;
  certifications_url: string | null;
  documents_complete: boolean | null;
  status: string;
  admin_comments: string | null;
  created_at: string;
  updated_at: string;
  business_name?: string;
  hourly_rate?: number;
  city?: string;
  postal_code?: string;
  description?: string;
}

export default function ProvidersManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [activeTab, setActiveTab] = useState('providers');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProviderData, setNewProviderData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    category: '',
    location: ''
  });
  const { toast } = useToast();

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { 
          action: 'list', 
          status: statusFilter === 'all' ? undefined : statusFilter, 
          searchTerm, 
          limit: 100 
        }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('Providers loaded:', data.providers.length);
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les prestataires",
        variant: "destructive"
      });
    }
  };

  const loadApplications = async () => {
    try {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProviders(), loadApplications()]);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (providerId: string, action: 'approve' | 'reject' | 'examine') => {
    try {
      if (action === 'examine') {
        const { data, error } = await supabase.functions.invoke('admin-providers', {
          body: { action: 'get_provider_details', providerId }
        });

        if (error) throw error;
        if (data?.success) {
          setSelectedProvider(data.provider);
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { action, providerId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Statut mis à jour",
          description: data.message,
        });
        loadProviders();
      }
    } catch (error: any) {
      console.error('Erreur action prestataire:', error);
      toast({
        title: "Erreur d'action",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleApplicationAction = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status, 
          admin_comments: adminComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Candidature ${status === 'approved' ? 'approuvée' : status === 'rejected' ? 'rejetée' : 'mise à jour'}`,
      });

      // Envoyer notification
      await supabase.functions.invoke('send-job-status-notification', {
        body: { applicationId, status, adminComments }
      });

      setAdminComments('');
      loadApplications();
    } catch (error: any) {
      console.error('Erreur mise à jour candidature:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la candidature",
        variant: "destructive",
      });
    }
  };

  const convertToProvider = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-applications', {
        body: { action: 'convert_to_provider', applicationId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conversion réussie",
          description: "La candidature a été convertie en prestataire",
        });
        loadData();
      }
    } catch (error: any) {
      console.error('Erreur conversion:', error);
      toast({
        title: "Erreur de conversion",
        description: error.message || "Impossible de convertir la candidature",
        variant: "destructive",
      });
    }
  };

  const handleCreateProvider = async () => {
    try {
      // Validation basique
      if (!newProviderData.email || !newProviderData.first_name || !newProviderData.last_name) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { 
          action: 'create_provider_direct',
          providerData: newProviderData
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Prestataire créé",
          description: "Le prestataire a été créé avec succès",
        });
        setIsAddingProvider(false);
        setNewProviderData({
          email: '',
          first_name: '',
          last_name: '',
          phone: '',
          business_name: '',
          category: '',
          location: ''
        });
        loadData();
      }
    } catch (error: any) {
      console.error('Erreur création prestataire:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le prestataire",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchTerm]);

  const getStatusBadge = (status: string, isProvider: boolean = true) => {
    const statusMap = isProvider ? {
      'approved': { variant: 'default', icon: CheckCircle, text: 'Approuvé', className: 'bg-green-100 text-green-800' },
      'pending': { variant: 'secondary', icon: Clock, text: 'En attente', className: '' },
      'pending_validation': { variant: 'secondary', icon: Clock, text: 'Validation finale', className: 'bg-orange-100 text-orange-800' },
      'rejected': { variant: 'destructive', icon: XCircle, text: 'Rejeté', className: '' }
    } : {
      'pending': { variant: 'secondary', icon: Clock, text: 'En attente', className: '' },
      'interview_scheduled': { variant: 'default', icon: User, text: 'Entretien programmé', className: 'bg-blue-100 text-blue-800' },
      'approved': { variant: 'default', icon: CheckCircle, text: 'Validé', className: 'bg-green-100 text-green-800' },
      'rejected': { variant: 'destructive', icon: XCircle, text: 'Rejeté', className: '' },
      'converted': { variant: 'default', icon: UserCheck, text: 'Converti', className: 'bg-purple-100 text-purple-800' }
    };

    const config = statusMap[status] || { variant: 'outline', icon: Clock, text: status, className: '' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getApplicationStats = () => {
    return {
      all: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      interview_scheduled: applications.filter(a => a.status === 'interview_scheduled').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      converted: applications.filter(a => a.status === 'converted').length,
    };
  };

  const getProviderStats = () => {
    return {
      all: providers.length,
      pending: providers.filter(p => p.status === 'pending').length,
      pending_validation: providers.filter(p => p.status === 'pending_validation').length,
      approved: providers.filter(p => p.status === 'approved').length,
      rejected: providers.filter(p => p.status === 'rejected').length,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion complète des prestataires</h1>
        <p className="text-muted-foreground">
          Gérez les candidatures (personnes qui ont postulé) et les prestataires validés (ceux déjà convertis)
        </p>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ajouter un prestataire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau prestataire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Prénom *</label>
                      <Input
                        value={newProviderData.first_name}
                        onChange={(e) => setNewProviderData({...newProviderData, first_name: e.target.value})}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nom *</label>
                      <Input
                        value={newProviderData.last_name}
                        onChange={(e) => setNewProviderData({...newProviderData, last_name: e.target.value})}
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={newProviderData.email}
                      onChange={(e) => setNewProviderData({...newProviderData, email: e.target.value})}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input
                      value={newProviderData.phone}
                      onChange={(e) => setNewProviderData({...newProviderData, phone: e.target.value})}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom de l'entreprise</label>
                    <Input
                      value={newProviderData.business_name}
                      onChange={(e) => setNewProviderData({...newProviderData, business_name: e.target.value})}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select value={newProviderData.category} onValueChange={(value) => setNewProviderData({...newProviderData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bika_kids">Garde d'enfants</SelectItem>
                        <SelectItem value="bika_maison">Services maison</SelectItem>
                        <SelectItem value="bika_vie">Services quotidiens</SelectItem>
                        <SelectItem value="bika_travel">Voyage</SelectItem>
                        <SelectItem value="bika_animals">Animaux</SelectItem>
                        <SelectItem value="bika_seniors">Services seniors</SelectItem>
                        <SelectItem value="bika_pro">Services professionnels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Localisation</label>
                    <Input
                      value={newProviderData.location}
                      onChange={(e) => setNewProviderData({...newProviderData, location: e.target.value})}
                      placeholder="Ville, code postal"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddingProvider(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateProvider}>
                      Créer le prestataire
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={loadData}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email ou entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Candidatures ({getApplicationStats().all})
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Prestataires ({getProviderStats().all})
          </TabsTrigger>
        </TabsList>

        {/* Section Candidatures */}
        <TabsContent value="applications" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Information :</strong> Cette section affiche les <strong>candidatures</strong> reçues. 
              Pour qu'une candidature devienne un prestataire actif, elle doit être validée puis convertie. 
              Les prestataires convertis apparaissent dans l'onglet "Prestataires".
            </p>
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">Tous ({getApplicationStats().all})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({getApplicationStats().pending})</TabsTrigger>
              <TabsTrigger value="interview_scheduled">Entretien ({getApplicationStats().interview_scheduled})</TabsTrigger>
              <TabsTrigger value="approved">Validés ({getApplicationStats().approved})</TabsTrigger>
              <TabsTrigger value="converted">Convertis ({getApplicationStats().converted})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés ({getApplicationStats().rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4">
              {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Aucune candidature trouvée</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {applications
                    .filter(app => statusFilter === 'all' || app.status === statusFilter)
                    .map((application) => (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {application.first_name} {application.last_name}
                              </h3>
                              {getStatusBadge(application.status, false)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {application.email}
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {application.phone}
                              </p>
                              <p>Catégorie: {application.category}</p>
                              <p>Candidature du {format(new Date(application.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedApplication(application)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Examiner
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Candidature de {application.first_name} {application.last_name}</DialogTitle>
                                </DialogHeader>
                                 {selectedApplication && (
                                   <div className="space-y-6">
                                     {/* Informations personnelles */}
                                     <div>
                                       <h3 className="font-semibold text-lg mb-3">Informations personnelles</h3>
                                       <div className="grid grid-cols-2 gap-4">
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">Email</label>
                                           <p>{selectedApplication.email}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                                           <p>{selectedApplication.phone}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
                                           <p>{selectedApplication.category}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">Expérience</label>
                                           <p>{selectedApplication.experience_years || 'Non renseigné'} ans</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">Transport</label>
                                           <p>{selectedApplication.has_transport ? '✅ Oui' : '❌ Non'}</p>
                                         </div>
                                         {selectedApplication.certifications && (
                                           <div className="col-span-2">
                                             <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                                             <p className="mt-1">{selectedApplication.certifications}</p>
                                           </div>
                                         )}
                                       </div>
                                     </div>

                                      {/* Documents - Nouveau validateur */}
                                      <ApplicationDocumentsValidator 
                                        application={selectedApplication}
                                        onDocumentUpdated={loadApplications}
                                      />

                                     <div>
                                       <label className="text-sm font-medium text-muted-foreground">Disponibilité</label>
                                       <p className="mt-1 p-3 bg-muted rounded">{selectedApplication.availability}</p>
                                     </div>

                                     <div>
                                       <label className="text-sm font-medium text-muted-foreground">Motivation</label>
                                       <p className="mt-1 p-3 bg-muted rounded">{selectedApplication.motivation}</p>
                                     </div>

                                     <div>
                                       <label className="text-sm font-medium text-muted-foreground">Commentaires admin</label>
                                       <Textarea
                                         value={adminComments}
                                         onChange={(e) => setAdminComments(e.target.value)}
                                         placeholder="Ajouter des commentaires..."
                                         className="mt-1"
                                       />
                                     </div>

                                     <div className="flex gap-2 pt-4">
                                      {selectedApplication.status === 'pending' && (
                                        <>
                                          <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleApplicationAction(selectedApplication.id, 'interview_scheduled')}
                                          >
                                            Programmer entretien
                                          </Button>
                                          <Button 
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Valider
                                          </Button>
                                        </>
                                      )}
                                      
                                      {(selectedApplication.status === 'approved' || selectedApplication.status === 'interview_scheduled') && (
                                        <Button 
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => convertToProvider(selectedApplication.id)}
                                        >
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Convertir en prestataire
                                        </Button>
                                      )}

                                      {selectedApplication.status !== 'rejected' && (
                                        <Button 
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleApplicationAction(selectedApplication.id, 'rejected')}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Rejeter
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Actions rapides */}
                            {application.status === 'pending' && (
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => handleApplicationAction(application.id, 'approved')}
                              >
                                Valider
                              </Button>
                            )}
                            
                            {(application.status === 'approved' || application.status === 'interview_scheduled') && (
                              <Button 
                                variant="secondary"
                                size="sm"
                                onClick={() => convertToProvider(application.id)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Convertir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Section Prestataires */}
        <TabsContent value="providers" className="space-y-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">Tous ({getProviderStats().all})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({getProviderStats().pending})</TabsTrigger>
              <TabsTrigger value="pending_validation">Validation ({getProviderStats().pending_validation})</TabsTrigger>
              <TabsTrigger value="approved">Approuvés ({getProviderStats().approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés ({getProviderStats().rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4">
              {providers.filter(provider => statusFilter === 'all' || provider.status === statusFilter).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Aucun prestataire trouvé</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {providers
                    .filter(provider => statusFilter === 'all' || provider.status === statusFilter)
                    .map((provider) => (
                    <Card key={provider.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {provider.business_name || `Prestataire ${provider.id.slice(0, 8)}`}
                              </h3>
                              {getStatusBadge(provider.status, true)}
                              {provider.is_verified && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>{provider.business_name || 'Pas d\'entreprise renseignée'}</p>
                              <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {provider.location || 'Localisation non renseignée'}
                              </p>
                              {provider.rating && (
                                <p className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  {provider.rating.toFixed(1)}/5
                                </p>
                              )}
                              <p>Inscrit le {format(new Date(provider.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleProviderAction(provider.id, 'examine')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du prestataire</DialogTitle>
                                </DialogHeader>
                                {selectedProvider && (
                                  <div className="space-y-6">
                                    {/* Informations générales */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Nom/Entreprise</label>
                                        <p className="font-semibold">{selectedProvider.business_name}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Note moyenne</label>
                                        <div className="flex items-center gap-2">
                                          <Star className="w-4 h-4 text-yellow-500" />
                                          <span>{selectedProvider.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                                        <p>{selectedProvider.location || 'Non renseignée'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Statut</label>
                                        {getStatusBadge(selectedProvider.status, true)}
                                      </div>
                                    </div>

                                    {/* Description */}
                                    {selectedProvider.description && (
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="mt-1 p-3 bg-muted rounded">{selectedProvider.description}</p>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4">
                                      {(selectedProvider.status === 'pending' || selectedProvider.status === 'pending_validation') && (
                                        <>
                                          <Button 
                                            variant="default" 
                                            size="sm"
                                            onClick={() => handleProviderAction(selectedProvider.id, 'approve')}
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approuver définitivement
                                          </Button>
                                          <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleProviderAction(selectedProvider.id, 'reject')}
                                          >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Rejeter
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {/* Actions rapides */}
                            {(provider.status === 'pending' || provider.status === 'pending_validation') && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleProviderAction(provider.id, 'approve')}
                                >
                                  Approuver
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleProviderAction(provider.id, 'reject')}
                                >
                                  Rejeter
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}