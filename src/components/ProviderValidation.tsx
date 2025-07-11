import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, FileText, User, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProviderData {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  is_verified: boolean;
  siret_number: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface DocumentData {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  upload_date: string;
}

const ProviderValidation = () => {
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [validationDialog, setValidationDialog] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [validationType, setValidationType] = useState<"approve" | "reject">("approve");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingProviders();
  }, []);

  const loadPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq('is_verified', false);

      if (error) throw error;
      setProviders((data as any) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDocuments = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', providerId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  const handleProviderSelect = (provider: ProviderData) => {
    setSelectedProvider(provider);
    loadProviderDocuments(provider.id);
  };

  const handleValidation = async () => {
    if (!selectedProvider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          is_verified: validationType === "approve",
        })
        .eq('id', selectedProvider.id);

      if (error) throw error;

      // Mettre à jour le statut des documents
      if (validationType === "approve") {
        await supabase
          .from('provider_documents')
          .update({ status: 'approved' })
          .eq('provider_id', selectedProvider.id);
      }

      toast({
        title: validationType === "approve" ? "Prestataire approuvé" : "Prestataire rejeté",
        description: `Le prestataire a été ${validationType === "approve" ? 'approuvé' : 'rejeté'} avec succès.`,
      });

      setValidationDialog(false);
      setSelectedProvider(null);
      loadPendingProviders();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation",
        variant: "destructive",
      });
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getProviderName = (provider: ProviderData) => {
    if (provider.business_name) return provider.business_name;
    if (provider.profiles?.first_name && provider.profiles?.last_name) {
      return `${provider.profiles.first_name} ${provider.profiles.last_name}`;
    }
    return "Prestataire";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Validation des prestataires</h2>
        <Badge variant="secondary">{providers.length} en attente</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Liste des prestataires */}
        <Card>
          <CardHeader>
            <CardTitle>Prestataires en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun prestataire en attente de validation
                </p>
              ) : (
                providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProvider?.id === provider.id
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{getProviderName(provider)}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.siret_number ? `SIRET: ${provider.siret_number}` : "Particulier"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Détails du prestataire sélectionné */}
        {selectedProvider ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Détails du prestataire</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setValidationType("reject");
                      setValidationDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setValidationType("approve");
                      setValidationDialog(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-3">
                <h4 className="font-semibold">Informations générales</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium">{getProviderName(selectedProvider)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {selectedProvider.business_name ? "Entreprise" : "Particulier"}
                    </p>
                  </div>
                  {selectedProvider.siret_number && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">SIRET</p>
                      <p className="font-medium">{selectedProvider.siret_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProvider.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedProvider.description}</p>
                </div>
              )}

              {/* Documents */}
              <div className="space-y-3">
                <h4 className="font-semibold">Documents fournis</h4>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun document fourni</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.document_type}</p>
                            <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(doc.status)}
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              Voir
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-20">
              <div className="text-center space-y-2">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Sélectionnez un prestataire pour voir les détails</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de validation */}
      <Dialog open={validationDialog} onOpenChange={setValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationType === "approve" ? "Approuver le prestataire" : "Rejeter le prestataire"}
            </DialogTitle>
            <DialogDescription>
              {validationType === "approve"
                ? "Ce prestataire sera marqué comme vérifié et pourra commencer à accepter des missions."
                : "Ce prestataire sera rejeté et ne pourra pas accepter de missions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes de validation</label>
              <Textarea
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Ajoutez des notes sur votre décision..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationDialog(false)}>
              Annuler
            </Button>
            <Button
              variant={validationType === "approve" ? "default" : "destructive"}
              onClick={handleValidation}
            >
              {validationType === "approve" ? "Approuver" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderValidation;