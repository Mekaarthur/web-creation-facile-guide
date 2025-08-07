import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Eye, FileText, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  business_name: string | null;
  description: string | null;
  location: string | null;
  is_verified: boolean;
  siret_number: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  provider_documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    status: string;
    upload_date: string;
  }>;
}

const ProviderValidation = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id,
          business_name,
          description,
          location,
          is_verified,
          siret_number,
          profiles (
            first_name,
            last_name
          ),
          provider_documents (
            id,
            document_type,
            file_name,
            file_url,
            status,
            upload_date
          )
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateProvider = async (providerId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ 
          is_verified: approved,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      // Mettre à jour le statut des documents si approuvé
      if (approved) {
        await supabase
          .from('provider_documents')
          .update({ status: 'approved' })
          .eq('provider_id', providerId);
      }

      toast({
        title: approved ? "Prestataire approuvé" : "Prestataire refusé",
        description: approved 
          ? "Le prestataire peut maintenant recevoir des demandes"
          : "Le prestataire a été notifié du refus",
      });

      // Rafraîchir la liste
      fetchPendingProviders();
      setSelectedProvider(null);
      setReviewNotes("");
    } catch (error) {
      console.error('Error validating provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la validation",
        variant: "destructive",
      });
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="text-green-700 bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Refusé</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getProviderName = (provider: Provider) => {
    if (provider.business_name) return provider.business_name;
    if (provider.profiles?.first_name && provider.profiles?.last_name) {
      return `${provider.profiles.first_name} ${provider.profiles.last_name}`;
    }
    return "Prestataire sans nom";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Validation des Prestataires</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Validation des Prestataires</h2>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun prestataire en attente</h3>
            <p className="text-muted-foreground">
              Tous les prestataires ont été traités.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Validation des Prestataires</h2>
        </div>
        <Badge variant="outline" className="text-orange-600">
          {providers.length} en attente
        </Badge>
      </div>

      {/* Liste des prestataires */}
      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getProviderName(provider)}
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      En attente
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {provider.location && (
                      <span className="block">📍 {provider.location}</span>
                    )}
                    {provider.siret_number && (
                      <span className="block text-xs">SIRET: {provider.siret_number}</span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Examiner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Description */}
                {provider.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {provider.description}
                    </p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents ({provider.provider_documents.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {provider.provider_documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <span className="truncate">{doc.document_type}</span>
                        {getDocumentStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => validateProvider(provider.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => validateProvider(provider.id, false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de détails */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Validation de {selectedProvider ? getProviderName(selectedProvider) : ''}
            </DialogTitle>
            <DialogDescription>
              Examinez les informations et documents avant validation
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informations personnelles</h4>
                  <div className="space-y-1 text-sm">
                    <p>Nom: {getProviderName(selectedProvider)}</p>
                    <p>Localisation: {selectedProvider.location || 'Non renseignée'}</p>
                    <p>SIRET: {selectedProvider.siret_number || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Description complète */}
              {selectedProvider.description && (
                <div>
                  <h4 className="font-medium mb-2">Description des services</h4>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm">
                    {selectedProvider.description}
                  </div>
                </div>
              )}

              {/* Documents détaillés */}
              <div>
                <h4 className="font-medium mb-4">Documents fournis</h4>
                <div className="space-y-3">
                  {selectedProvider.provider_documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.document_type}</p>
                        <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Téléchargé le {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusBadge(doc.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes de révision */}
              <div>
                <h4 className="font-medium mb-2">Notes de révision (optionnel)</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ajoutez des notes concernant cette validation..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProvider(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => validateProvider(selectedProvider.id, false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  onClick={() => validateProvider(selectedProvider.id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderValidation;