import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Mail,
  Phone,
  FileCheck,
  GraduationCap,
  Shield
} from 'lucide-react';

interface Provider {
  id: string;
  business_name: string;
  status: string;
  formation_completed: boolean;
  mandat_facturation_accepte: boolean;
  created_at: string;
  user_id?: string;
}

const ProviderOnboardingManager = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending_documents');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, status, formation_completed, mandat_facturation_accepte, created_at, user_id')
        .in('status', ['pending', 'documents_pending', 'training_pending', 'inactive'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateDocuments = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'active'
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success('Documents validés', {
        description: 'Prestataire mis à jour'
      });
      loadProviders();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const rejectDocuments = async (providerId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'inactive'
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success('Documents rejetés', {
        description: 'Le prestataire a été désactivé'
      });
      loadProviders();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const activateProvider = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'active',
          is_verified: true
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success('Prestataire activé !', {
        description: 'Il peut maintenant recevoir des missions'
      });
      loadProviders();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const getStatusBadge = (provider: Provider) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'En attente', variant: 'secondary', icon: Clock },
      documents_pending: { label: 'Documents à valider', variant: 'secondary', icon: FileText },
      documents_validated: { label: 'Documents OK', variant: 'default', icon: CheckCircle },
      documents_rejected: { label: 'Documents rejetés', variant: 'destructive', icon: XCircle },
      training_pending: { label: 'Formation en cours', variant: 'secondary', icon: GraduationCap },
      active: { label: 'Actif', variant: 'default', icon: CheckCircle }
    };

    const status = statusMap[provider.status] || statusMap.pending;
    const Icon = status.icon;

    return (
      <Badge variant={status.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  };

  const getOnboardingProgress = (provider: Provider) => {
    const isActive = provider.status === 'active';
    const hasMandate = provider.mandat_facturation_accepte;
    const hasTraining = provider.formation_completed;
    
    const steps = [
      { key: 'documents', done: isActive, label: 'Documents' },
      { key: 'mandate', done: hasMandate, label: 'Mandat' },
      { key: 'training', done: hasTraining, label: 'Formation' }
    ];

    const completed = steps.filter(s => s.done).length;
    const percentage = (completed / steps.length) * 100;

    return { steps, completed, total: steps.length, percentage };
  };

  const filterProviders = (status: string) => {
    switch (status) {
      case 'pending_documents':
        return providers.filter(p => p.status === 'pending' || p.status === 'documents_pending');
      case 'pending_mandate':
        return providers.filter(p => p.status === 'active' && !p.mandat_facturation_accepte);
      case 'pending_training':
        return providers.filter(p => p.mandat_facturation_accepte && !p.formation_completed);
      case 'ready_activation':
        return providers.filter(p => 
          p.mandat_facturation_accepte && 
          p.formation_completed && 
          p.status !== 'active'
        );
      default:
        return providers;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion Onboarding Prestataires
          </CardTitle>
          <CardDescription>
            Validation documents, signature mandat, formation et activation
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending_documents">
            Documents ({filterProviders('pending_documents').length})
          </TabsTrigger>
          <TabsTrigger value="pending_mandate">
            Mandats ({filterProviders('pending_mandate').length})
          </TabsTrigger>
          <TabsTrigger value="pending_training">
            Formation ({filterProviders('pending_training').length})
          </TabsTrigger>
          <TabsTrigger value="ready_activation">
            À activer ({filterProviders('ready_activation').length})
          </TabsTrigger>
        </TabsList>

        {['pending_documents', 'pending_mandate', 'pending_training', 'ready_activation'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterProviders(tab).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Aucun prestataire dans cette catégorie</p>
                </CardContent>
              </Card>
            ) : (
              filterProviders(tab).map(provider => {
                const progress = getOnboardingProgress(provider);
                
                return (
                  <Card key={provider.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{provider.business_name}</h3>
                            {getStatusBadge(provider)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              ID: {provider.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="font-medium">{progress.completed}/{progress.total} étapes</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-2">
                          {progress.steps.map(step => (
                            <div key={step.key} className="flex items-center gap-1 text-xs">
                              {step.done ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={step.done ? 'text-green-500' : 'text-muted-foreground'}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {tab === 'pending_documents' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => validateDocuments(provider.id)}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              Valider documents
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Raison du rejet:');
                                if (reason) rejectDocuments(provider.id, reason);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {tab === 'ready_activation' && (
                          <Button
                            size="sm"
                            onClick={() => activateProvider(provider.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activer le prestataire
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProviderOnboardingManager;
