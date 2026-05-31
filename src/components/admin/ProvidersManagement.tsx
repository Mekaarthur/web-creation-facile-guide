import { useState } from 'react';
import { sanitizeSearch } from '@/lib/sanitizeSearch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, XCircle, Clock, User, Users, FileText, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Provider, Application } from './providers/types';
import { ApplicationsTab } from './providers/ApplicationsTab';
import { ProvidersTab } from './providers/ProvidersTab';

const PROVIDERS_KEY = (status: string, search: string) => ['admin-providers-list', status, search] as const;
const APPS_KEY     = (status: string, search: string) => ['admin-applications-list', status, search] as const;

export default function ProvidersManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminComments, setAdminComments]   = useState('');
  const [activeTab, setActiveTab]           = useState('providers');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProviderData, setNewProviderData] = useState({
    email: '', first_name: '', last_name: '', phone: '', business_name: '', category: '', location: ''
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: PROVIDERS_KEY(statusFilter, searchTerm),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { action: 'list', status: statusFilter === 'all' ? undefined : statusFilter, searchTerm, limit: 100 },
      });
      if (error) throw error;
      return data?.providers || [];
    },
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: APPS_KEY(statusFilter, searchTerm),
    queryFn: async () => {
      let query = supabase.from('job_applications').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (searchTerm) query = query.or(`first_name.ilike.%${sanitizeSearch(searchTerm)}%,last_name.ilike.%${sanitizeSearch(searchTerm)}%,email.ilike.%${sanitizeSearch(searchTerm)}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const loading = providersLoading || appsLoading;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-providers-list'] });
    qc.invalidateQueries({ queryKey: ['admin-applications-list'] });
  };

  const handleProviderAction = async (providerId: string, action: 'approve' | 'reject' | 'examine') => {
    try {
      if (action === 'examine') {
        const { data, error } = await supabase.functions.invoke('admin-providers', { body: { action: 'get_provider_details', providerId } });
        if (error) throw error;
        if (data?.success) setSelectedProvider(data.provider);
        return;
      }
      const { data, error } = await supabase.functions.invoke('admin-providers', { body: { action, providerId } });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Statut mis à jour", description: data.message });
        qc.invalidateQueries({ queryKey: ['admin-providers-list'] });
      }
    } catch (error: any) {
      toast({ title: "Erreur d'action", description: error.message || "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleApplicationAction = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status, admin_comments: adminComments, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      if (error) throw error;
      toast({ title: "Statut mis à jour", description: `Candidature ${status === 'approved' ? 'approuvée' : status === 'rejected' ? 'rejetée' : 'mise à jour'}` });
      await supabase.functions.invoke('send-job-status-notification', { body: { applicationId, status, adminComments } });
      setAdminComments('');
      qc.invalidateQueries({ queryKey: ['admin-applications-list'] });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour la candidature", variant: "destructive" });
    }
  };

  const convertToProvider = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-applications', { body: { action: 'convert_to_provider', applicationId } });
      if (error) throw error;
      if (data?.success) { toast({ title: "Conversion réussie", description: "La candidature a été convertie en prestataire" }); invalidateAll(); }
    } catch (error: any) {
      toast({ title: "Erreur de conversion", description: error.message || "Impossible de convertir la candidature", variant: "destructive" });
    }
  };

  const handleCreateProvider = async () => {
    if (!newProviderData.email || !newProviderData.first_name || !newProviderData.last_name) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', { body: { action: 'create_provider_direct', providerData: newProviderData } });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Prestataire créé", description: "Le prestataire a été créé avec succès" });
        setIsAddingProvider(false);
        setNewProviderData({ email: '', first_name: '', last_name: '', phone: '', business_name: '', category: '', location: '' });
        invalidateAll();
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de créer le prestataire", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string, isProvider = true) => {
    const statusMap = isProvider ? {
      'approved':          { variant: 'default',     icon: CheckCircle, text: 'Approuvé',          className: 'bg-green-100 text-green-800' },
      'pending':           { variant: 'secondary',   icon: Clock,       text: 'En attente',         className: '' },
      'pending_validation':{ variant: 'secondary',   icon: Clock,       text: 'Validation finale',  className: 'bg-orange-100 text-orange-800' },
      'rejected':          { variant: 'destructive', icon: XCircle,     text: 'Rejeté',             className: '' },
    } : {
      'pending':             { variant: 'secondary',   icon: Clock,      text: 'En attente',          className: '' },
      'interview_scheduled': { variant: 'default',     icon: User,       text: 'Entretien programmé', className: 'bg-blue-100 text-blue-800' },
      'approved':            { variant: 'default',     icon: CheckCircle,text: 'Validé',              className: 'bg-green-100 text-green-800' },
      'rejected':            { variant: 'destructive', icon: XCircle,    text: 'Rejeté',              className: '' },
      'converted':           { variant: 'default',     icon: UserCheck,  text: 'Converti',            className: 'bg-purple-100 text-purple-800' },
    };
    const config = (statusMap as any)[status] || { variant: 'outline', icon: Clock, text: status, className: '' };
    const Icon = config.icon;
    return <Badge variant={config.variant as any} className={config.className}><Icon className="w-3 h-3 mr-1" />{config.text}</Badge>;
  };

  const getApplicationStats = () => ({
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    interview_scheduled: applications.filter(a => a.status === 'interview_scheduled').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    converted: applications.filter(a => a.status === 'converted').length,
  });

  const getProviderStats = () => ({
    all: providers.length,
    pending: providers.filter(p => p.status === 'pending').length,
    pending_validation: providers.filter(p => p.status === 'pending_validation').length,
    approved: providers.filter(p => p.status === 'approved').length,
    rejected: providers.filter(p => p.status === 'rejected').length,
  });

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm"><UserCheck className="w-4 h-4 mr-2" />Ajouter un prestataire</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Créer un nouveau prestataire</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Prénom *</label>
                      <Input value={newProviderData.first_name} onChange={(e) => setNewProviderData({...newProviderData, first_name: e.target.value})} placeholder="Prénom" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nom *</label>
                      <Input value={newProviderData.last_name} onChange={(e) => setNewProviderData({...newProviderData, last_name: e.target.value})} placeholder="Nom" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input type="email" value={newProviderData.email} onChange={(e) => setNewProviderData({...newProviderData, email: e.target.value})} placeholder="email@exemple.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input value={newProviderData.phone} onChange={(e) => setNewProviderData({...newProviderData, phone: e.target.value})} placeholder="+33 6 12 34 56 78" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom de l'entreprise</label>
                    <Input value={newProviderData.business_name} onChange={(e) => setNewProviderData({...newProviderData, business_name: e.target.value})} placeholder="Nom de l'entreprise" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select value={newProviderData.category} onValueChange={(value) => setNewProviderData({...newProviderData, category: value})}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie" /></SelectTrigger>
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
                    <Input value={newProviderData.location} onChange={(e) => setNewProviderData({...newProviderData, location: e.target.value})} placeholder="Ville, code postal" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddingProvider(false)}>Annuler</Button>
                    <Button onClick={handleCreateProvider}>Créer le prestataire</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={invalidateAll}>Actualiser</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher par nom, email ou entreprise..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />Candidatures ({getApplicationStats().all})
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />Prestataires ({getProviderStats().all})
          </TabsTrigger>
        </TabsList>

        <ApplicationsTab
          applications={applications}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
          adminComments={adminComments}
          setAdminComments={setAdminComments}
          getStatusBadge={getStatusBadge}
          getApplicationStats={getApplicationStats}
          handleApplicationAction={handleApplicationAction}
          convertToProvider={convertToProvider}
          loadApplications={() => qc.invalidateQueries({ queryKey: ['admin-applications-list'] })}
        />

        <ProvidersTab
          providers={providers}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedProvider={selectedProvider}
          getStatusBadge={getStatusBadge}
          getProviderStats={getProviderStats}
          handleProviderAction={handleProviderAction}
        />
      </Tabs>
    </div>
  );
}
