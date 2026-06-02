import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, CheckCircle, XCircle, Star, MapPin } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Provider } from './types';

interface Props {
  providers: Provider[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  selectedProvider: Provider | null;
  getStatusBadge: (status: string, isProvider?: boolean) => JSX.Element;
  getProviderStats: () => Record<string, number>;
  handleProviderAction: (id: string, action: 'approve' | 'reject' | 'examine') => Promise<void>;
}

export function ProvidersTab({
  providers, statusFilter, setStatusFilter,
  selectedProvider, getStatusBadge, getProviderStats, handleProviderAction,
}: Props) {
  const stats = getProviderStats();
  const filtered = providers.filter(p => statusFilter === 'all' || p.status === statusFilter);

  return (
    <TabsContent value="providers" className="space-y-4">
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full">
          <TabsTrigger value="all">Tous ({stats.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
          <TabsTrigger value="pending_validation">Validation ({stats.pending_validation})</TabsTrigger>
          <TabsTrigger value="approved">Approuvés ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">Aucun prestataire trouvé</p></CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{provider.business_name || `Prestataire ${provider.id.slice(0, 8)}`}</h3>
                          {getStatusBadge(provider.status, true)}
                          {provider.is_verified && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              <CheckCircle className="w-3 h-3 mr-1" />Vérifié
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{provider.business_name || "Pas d'entreprise renseignée"}</p>
                          <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{provider.location || 'Localisation non renseignée'}</p>
                          {provider.rating && (
                            <p className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" />{provider.rating.toFixed(1)}/5</p>
                          )}
                          <p>Inscrit le {format(new Date(provider.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleProviderAction(provider.id, 'examine')}>
                              <Eye className="w-4 h-4 mr-2" />Voir détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Détails du prestataire</DialogTitle></DialogHeader>
                            {selectedProvider && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div><label className="text-sm font-medium text-muted-foreground">Nom/Entreprise</label><p className="font-semibold">{selectedProvider.business_name}</p></div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Note moyenne</label>
                                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /><span>{selectedProvider.rating?.toFixed(1) || 'N/A'}</span></div>
                                  </div>
                                  <div><label className="text-sm font-medium text-muted-foreground">Localisation</label><p>{selectedProvider.location || 'Non renseignée'}</p></div>
                                  <div><label className="text-sm font-medium text-muted-foreground">Statut</label>{getStatusBadge(selectedProvider.status, true)}</div>
                                </div>
                                {selectedProvider.description && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="mt-1 p-3 bg-muted rounded">{selectedProvider.description}</p>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                  {(selectedProvider.status === 'pending' || selectedProvider.status === 'pending_validation') && (
                                    <>
                                      <Button variant="default" size="sm" onClick={() => handleProviderAction(selectedProvider.id, 'approve')}>
                                        <CheckCircle className="w-4 h-4 mr-2" />Approuver définitivement
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleProviderAction(selectedProvider.id, 'reject')}>
                                        <XCircle className="w-4 h-4 mr-2" />Rejeter
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {(provider.status === 'pending' || provider.status === 'pending_validation') && (
                          <>
                            <Button variant="default" size="sm" onClick={() => handleProviderAction(provider.id, 'approve')}>Approuver</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleProviderAction(provider.id, 'reject')}>Rejeter</Button>
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
  );
}
