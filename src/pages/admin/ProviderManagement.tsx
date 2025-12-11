import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  LayoutGrid,
  List
} from 'lucide-react';
import { ApplicationDetails } from '@/components/admin/ApplicationDetails';
import { ProviderOnboardingTracker } from '@/components/admin/ProviderOnboardingTracker';
import { ApplicationDocumentsValidator } from '@/components/admin/ApplicationDocumentsValidator';
import ApplicationsKanban from '@/components/admin/ApplicationsKanban';

export default function ProviderManagement() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending_applications');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    onboarding: 0,
    active: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadApplications(),
        loadProviders(),
        loadStats(),
      ]);
    } catch (error: any) {
      toast.error('Erreur de chargement', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    const { data, error } = await supabase.functions.invoke('admin-applications', {
      body: { action: 'list', searchTerm, limit: 100 },
    });

    if (error) throw error;
    setApplications(data.applications || []);
  };

  const loadProviders = async () => {
    const { data, error } = await supabase.functions.invoke('admin-providers', {
      body: { action: 'list', status: 'all', searchTerm, limit: 100 },
    });

    if (error) throw error;
    setProviders(data.providers || []);
  };

  const loadStats = async () => {
    const { data: appData } = await supabase.functions.invoke('admin-applications', {
      body: { action: 'get_stats' },
    });

    const { data: provData } = await supabase.functions.invoke('admin-providers', {
      body: { action: 'get_stats' },
    });

    setStats({
      pending: appData?.stats?.pending || 0,
      approved: appData?.stats?.approved || 0,
      rejected: appData?.stats?.rejected || 0,
      onboarding: provData?.stats?.pending_onboarding || 0,
      active: provData?.stats?.active || 0,
    });
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-applications', {
        body: { 
          action: 'approve', 
          applicationId,
          adminComments: 'Candidature approuvée - Compte prestataire créé' 
        },
      });

      if (error) throw error;

      toast.success('Candidature approuvée', {
        description: 'Le compte prestataire a été créé avec succès',
      });

      setSelectedApplication(null);
      await loadData();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
      const { error } = await supabase.functions.invoke('admin-applications', {
        body: { action: 'reject', applicationId, adminComments: reason },
      });

      if (error) throw error;

      toast.success('Candidature rejetée');
      setSelectedApplication(null);
      await loadData();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const handleActivateProvider = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'active',
          is_verified: true,
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success('Prestataire activé !', {
        description: 'Il peut maintenant recevoir des missions',
      });

      setSelectedProvider(null);
      await loadData();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const filterApplications = (status: string) => {
    return applications.filter(a => a.status === status);
  };

  const filterProviders = (status: string) => {
    if (status === 'onboarding') {
      return providers.filter(p => 
        p.status === 'pending_onboarding' || 
        (!p.mandat_facturation_accepte || !p.formation_completed || !p.identity_verified)
      );
    }
    return providers.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestion Prestataires
          </h1>
          <p className="text-muted-foreground">
            Candidatures, onboarding et activation des prestataires
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Liste
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Vue Kanban */}
      {viewMode === 'kanban' ? (
        <ApplicationsKanban />
      ) : (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approuvées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-4">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejetées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-4">
            <FileText className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.onboarding}</p>
              <p className="text-sm text-muted-foreground">Onboarding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-4">
            <Users className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={loadData} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Onglets */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending_applications">
            Candidatures ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="documents_validation">
            Documents ({filterApplications('documents_pending').length})
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding ({stats.onboarding})
          </TabsTrigger>
          <TabsTrigger value="active">
            Actifs ({stats.active})
          </TabsTrigger>
        </TabsList>

        {/* Candidatures en attente */}
        <TabsContent value="pending_applications" className="space-y-4">
          {filterApplications('pending').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Aucune candidature en attente</p>
              </CardContent>
            </Card>
          ) : (
            filterApplications('pending').map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {app.first_name} {app.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                      <div className="flex gap-2 mt-2">
                        {app.service_categories?.map((cat: string) => (
                          <Badge key={cat} variant="outline">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedApplication(app)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Validation documents */}
        <TabsContent value="documents_validation" className="space-y-4">
          {filterApplications('documents_pending').map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>{app.first_name} {app.last_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ApplicationDocumentsValidator 
                  application={app}
                  onDocumentUpdated={loadData}
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Onboarding */}
        <TabsContent value="onboarding" className="space-y-4">
          {filterProviders('onboarding').map((provider) => (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {provider.business_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {provider.email}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Gérer onboarding
                    </Button>
                  </div>
                  <ProviderOnboardingTracker
                    provider={provider}
                    onActivate={() => handleActivateProvider(provider.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Actifs */}
        <TabsContent value="active" className="space-y-4">
          {filterProviders('active').map((provider) => (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {provider.business_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                    <Badge variant="default" className="mt-2">Actif</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Missions</p>
                    <p className="text-2xl font-bold">{provider.total_missions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog détails candidature */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la candidature</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <ApplicationDetails
              application={selectedApplication}
              onApprove={() => handleApprove(selectedApplication.id)}
              onReject={() => handleReject(selectedApplication.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog onboarding provider */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Suivi Onboarding - {selectedProvider?.business_name}</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <ProviderOnboardingTracker
              provider={selectedProvider}
              onActivate={() => handleActivateProvider(selectedProvider.id)}
            />
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
