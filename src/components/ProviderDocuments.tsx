import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Shield,
  Building,
  User as UserIcon,
  Loader2,
  Trash2,
  Award
} from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  upload_date: string;
  notes?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  icon: any;
  required: boolean;
}

const ProviderDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const documentRequirements: DocumentRequirement[] = [
    {
      type: 'identity_document',
      label: 'Pièce d\'identité',
      description: 'Carte d\'identité, passeport ou permis de conduire recto-verso',
      icon: UserIcon,
      required: true
    },
    {
      type: 'criminal_record',
      label: 'Casier judiciaire',
      description: 'Extrait de casier judiciaire (bulletin n°3) de moins de 3 mois',
      icon: Shield,
      required: true
    },
    {
      type: 'siret_document',
      label: 'SIRET Auto-entrepreneur',
      description: 'Extrait KBIS ou attestation URSSAF pour auto-entrepreneur',
      icon: Building,
      required: true
    },
    {
      type: 'rib_iban',
      label: 'RIB / IBAN',
      description: 'Relevé d\'identité bancaire pour recevoir vos paiements',
      icon: Building,
      required: true
    },
    {
      type: 'certification',
      label: 'Agrément Nova',
      description: 'Agrément Nova ou accréditation officielle (obligatoire)',
      icon: Shield,
      required: true
    },
    {
      type: 'insurance',
      label: 'Assurance RC Pro',
      description: 'Attestation d\'assurance responsabilité civile professionnelle',
      icon: Award,
      required: false
    }
  ];

  useEffect(() => {
    if (user) {
      loadProviderDocuments();
    }
  }, [user]);

  // Realtime: écouter les changements de statut des documents (validation admin)
  useEffect(() => {
    if (!provider?.id) return;

    const channel = supabase
      .channel(`provider-docs-${provider.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_documents',
          filter: `provider_id=eq.${provider.id}`
        },
        (payload) => {
          // Mettre à jour le document modifié en temps réel
          setDocuments(prev => prev.map(doc => 
            doc.id === payload.new.id 
              ? { ...doc, ...payload.new } as Document
              : doc
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [provider?.id]);

  const loadProviderDocuments = async () => {
    try {
      // Récupérer le profil prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Charger les documents
        const { data: documentsData } = await supabase
          .from('provider_documents')
          .select('*')
          .eq('provider_id', providerData.id)
          .order('upload_date', { ascending: false });

        setDocuments((documentsData || []) as Document[]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Récupère le chemin Storage à partir de l'URL publique
  const getStoragePathFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const marker = '/storage/v1/object/public/provider-documents/';
      const idx = u.pathname.indexOf(marker);
      if (idx !== -1) {
        return decodeURIComponent(u.pathname.substring(idx + marker.length));
      }
      return '';
    } catch {
      return '';
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!provider || !file) return;

    setUploading(documentType);
    setUploadProgress(0);

    try {
      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier ne peut pas dépasser 10MB');
      }

      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Seuls les fichiers PDF, JPEG et PNG sont acceptés');
      }

      // Simuler la progression pendant l'upload
      setUploadProgress(20);

      // Si un document de ce type existe déjà, on le remplace
      const existingDoc = getDocumentForType(documentType);
      if (existingDoc) {
        const oldPath = getStoragePathFromUrl(existingDoc.file_url);
        if (oldPath) {
          await supabase.storage.from('provider-documents').remove([oldPath]);
        }
      }

      // Créer un nom de fichier unique avec l'user_id
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${documentType}_${Date.now()}.${fileExt}`;

      setUploadProgress(40);

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      if (existingDoc) {
        // Mettre à jour l'entrée existante
        const { error: updateError } = await supabase
          .from('provider_documents')
          .update({
            file_name: file.name,
            file_url: fileName,
            status: 'pending',
            upload_date: new Date().toISOString(),
            approved_at: null,
            rejected_at: null,
            rejection_reason: null,
            reviewed_by: null,
          })
          .eq('id', existingDoc.id);
        if (updateError) throw updateError;
      } else {
        // Enregistrer en base de données (nouvelle entrée)
        const { error: dbError } = await supabase
          .from('provider_documents')
          .insert({
            provider_id: provider.id,
            document_type: documentType,
            file_name: file.name,
            file_url: urlData.publicUrl,
            status: 'pending'
          });
        if (dbError) throw dbError;
      }

      setUploadProgress(100);

      toast({
        title: 'Document téléchargé',
        description: 'Votre document a été envoyé et est en cours de vérification',
      });

      await loadProviderDocuments();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le document",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const submitAllDocuments = async () => {
    setSubmitting(true);
    try {
      const requiredDocs = documentRequirements.filter(req => req.required);
      const missingDocs = requiredDocs.filter(req => !getDocumentForType(req.type));
      
      if (missingDocs.length > 0) {
        toast({
          title: "Documents manquants",
          description: `Il manque ${missingDocs.length} document(s) requis`,
          variant: "destructive",
        });
        return;
      }

      // Mettre à jour le statut du provider
      const { error } = await supabase
        .from('providers')
        .update({ 
          documents_submitted: false,
          documents_submitted_at: null,
          status: 'documents_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast({
        title: "Documents soumis avec succès ! 🎉",
        description: "Vos documents seront examinés sous 48h ouvrées",
      });

      await loadProviderDocuments();
    } catch (error: any) {
      toast({
        title: "Erreur de soumission",
        description: error.message || "Impossible de soumettre les documents",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const deleteDocument = async (doc: Document) => {
    try {
      // Supprimer le fichier du storage (si possible)
      const storagePath = getStoragePathFromUrl(doc.file_url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('provider-documents')
          .remove([storagePath]);
        if (storageError) {
          console.warn('Erreur suppression storage:', storageError);
        }
      }

      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('provider_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès',
      });

      loadProviderDocuments();
    } catch (error: any) {
      toast({
        title: 'Erreur de suppression',
        description: error.message || 'Impossible de supprimer le document',
        variant: 'destructive',
      });
    }
  };
  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string, doc?: Document) => {
    switch (status) {
      case 'approved': 
        return doc?.approved_at 
          ? `✅ Validé le ${new Date(doc.approved_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : '✅ Validé';
      case 'pending': return '⏳ En attente de validation';
      case 'rejected': 
        return doc?.rejected_at 
          ? `❌ Refusé le ${new Date(doc.rejected_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : '❌ Refusé';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  const isImage = (name: string) => /\.(png|jpe?g|webp)$/i.test(name);
  const isPdf = (name: string) => /\.(pdf)$/i.test(name);

  const getCompletionPercentage = () => {
    const requiredDocs = documentRequirements.filter(req => req.required);
    const approvedRequiredDocs = requiredDocs.filter(req => {
      const doc = getDocumentForType(req.type);
      return doc && doc.status === 'approved';
    });
    return Math.round((approvedRequiredDocs.length / requiredDocs.length) * 100);
  };

  const viewDocument = (document: Document) => {
    window.open(document.file_url, '_blank');
  };

  const handlePreview = async (doc: Document) => {
    // Toggle off
    if (previewDocId === doc.id) {
      setPreviewDocId(null);
      const url = previewUrls[doc.id];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      setPreviewUrls((prev) => {
        const copy = { ...prev };
        delete copy[doc.id];
        return copy;
      });
      return;
    }

    try {
      setPreviewDocId(doc.id);
      if (isPdf(doc.file_name)) {
        const res = await fetch(doc.file_url, { credentials: 'omit' });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrls((prev) => ({ ...prev, [doc.id]: blobUrl }));
      } else {
        setPreviewUrls((prev) => ({ ...prev, [doc.id]: doc.file_url }));
      }
    } catch (e) {
      console.error('Preview error', e);
      toast({
        title: 'Prévisualisation indisponible',
        description: 'Téléchargez le fichier pour le consulter.',
        variant: 'destructive',
      });
      setPreviewDocId(null);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progression des documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mes documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression de vérification</span>
              <span className="text-sm text-muted-foreground">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Documents requis approuvés pour commencer vos missions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents requis */}
      <div className="grid gap-4">
        {documentRequirements.map((requirement) => {
          const document = getDocumentForType(requirement.type);
          const Icon = requirement.icon;
          
          return (
            <Card key={requirement.type} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{requirement.label}</h3>
                        {requirement.required && (
                          <Badge variant="secondary" className="text-xs">Requis</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {requirement.description}
                      </p>
                      
                      {uploading === requirement.type ? (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Téléchargement en cours...</span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="w-full" />
                        </div>
                      ) : document ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={getStatusColor(document.status)}>
                                {getStatusIcon(document.status)}
                                <span className="ml-1">{getStatusLabel(document.status, document)}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {document.file_name}
                              </span>
                            </div>
                          {/* Aperçu du document si c'est une image */}
                          {document.file_url && (document.file_name.endsWith('.jpg') || document.file_name.endsWith('.jpeg') || document.file_name.endsWith('.png')) && (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                              <img 
                                src={document.file_url} 
                                alt={document.file_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(document)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                {previewDocId === document.id ? 'Masquer' : 'Aperçu'}
                              </Button>
                              <Button variant="outline" size="sm" asChild className="gap-1">
                                <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                                  Télécharger
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteDocument(document)}
                                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </Button>
                            </div>

                            {previewDocId === document.id && (
                              <div className="mt-3 border rounded-lg overflow-hidden">
                                {isImage(document.file_name) ? (
                                  <img src={previewUrls[document.id] || document.file_url} alt={document.file_name} className="w-full max-h-[480px] object-contain bg-muted" />
                                ) : isPdf(document.file_name) ? (
                                  <iframe
                                    src={previewUrls[document.id]}
                                    className="w-full h-[520px] bg-muted"
                                    title={`Aperçu ${document.file_name}`}
                                  />
                                ) : (
                                  <p className="text-sm text-muted-foreground p-4">Aperçu non disponible pour ce format. Utilisez Télécharger.</p>
                                )}
                              </div>
                            )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun document téléchargé</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={document ? "outline" : "default"}
                      size="sm"
                      disabled={uploading === requirement.type}
                      onClick={() => {
                        const input = window.document.getElementById(`file-${requirement.type}`) as HTMLInputElement;
                        if (input) {
                          input.value = '';
                          input.click();
                        }
                      }}
                    >
                      {uploading === requirement.type ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {document ? 'Remplacer' : 'Télécharger'}
                    </Button>
                    <input
                      id={`file-${requirement.type}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, requirement.type);
                        }
                      }}
                    />
                  </div>
                </div>
                
                {document?.status === 'rejected' && (document.rejection_reason || document.notes) && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Motif du rejet :</strong> {document.rejection_reason || document.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bouton de soumission */}
      {getCompletionPercentage() === 100 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Tous vos documents sont prêts !</h4>
                  <p className="text-sm text-muted-foreground">
                    Soumettez vos documents pour validation par notre équipe
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={submitAllDocuments}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Soumission...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Soumettre tous mes documents
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations importantes */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-2">Informations importantes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Les documents sont vérifiés sous 48h ouvrées</li>
                <li>• Formats acceptés : PDF, JPEG, PNG (max 10MB)</li>
                <li>• Les documents doivent être lisibles et récents</li>
                <li>• Vous pourrez commencer les missions une fois tous les documents requis approuvés</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDocuments;