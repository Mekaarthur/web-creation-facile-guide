import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Trash2
} from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  upload_date: string;
  notes?: string;
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
      type: 'insurance_document',
      label: 'Assurance professionnelle',
      description: 'Attestation d\'assurance responsabilité civile professionnelle',
      icon: Shield,
      required: false
    },
    {
      type: 'rib_iban',
      label: 'RIB / IBAN',
      description: 'Relevé d\'identité bancaire pour recevoir vos paiements',
      icon: Building,
      required: true
    }
  ];

  useEffect(() => {
    if (user) {
      loadProviderDocuments();
    }
  }, [user]);

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

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!provider || !file) return;

    setUploading(documentType);

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

      // Créer un nom de fichier unique avec l'user_id au lieu du provider_id
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('provider-documents')
        .getPublicUrl(fileName);

      // Enregistrer en base de données
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

      toast({
        title: "Document téléchargé",
        description: "Votre document a été envoyé et est en cours de vérification",
      });

      loadProviderDocuments();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le document",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const deleteDocument = async (documentId: string, fileName: string) => {
    try {
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('provider-documents')
        .remove([fileName]);

      if (storageError) {
        console.warn('Erreur suppression storage:', storageError);
      }

      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('provider_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });

      loadProviderDocuments();
    } catch (error: any) {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer le document",
        variant: "destructive",
      });
    }
  };

  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
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
                      
                      {document ? (
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(document.status)}>
                            {getStatusIcon(document.status)}
                            <span className="ml-1">{getStatusLabel(document.status)}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {document.file_name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDocument(document)}
                              title="Voir le document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(document.id, document.file_url.split('/').pop() || '')}
                              title="Supprimer le document"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun document téléchargé</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label 
                      htmlFor={`file-${requirement.type}`} 
                      className="cursor-pointer"
                    >
                      <Button 
                        variant={document ? "outline" : "default"}
                        size="sm"
                        disabled={uploading === requirement.type}
                        asChild
                      >
                        <span>
                          {uploading === requirement.type ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {document ? 'Remplacer' : 'Télécharger'}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id={`file-${requirement.type}`}
                      type="file"
                      accept="image/*,.pdf"
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
                
                {document?.status === 'rejected' && document.notes && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Motif du rejet :</strong> {document.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informations importantes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Informations importantes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
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