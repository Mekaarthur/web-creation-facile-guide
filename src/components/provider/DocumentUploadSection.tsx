import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  upload_date: string;
  notes?: string;
}

interface DocumentUploadSectionProps {
  providerId: string;
  onDocumentsUpdated?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'identity_card', label: 'Pièce d\'identité', required: true },
  { value: 'insurance', label: 'Attestation d\'assurance', required: true },
  { value: 'diploma', label: 'Diplômes/Certifications', required: false },
  { value: 'criminal_record', label: 'Extrait casier judiciaire', required: true },
  { value: 'iban', label: 'RIB/IBAN', required: true },
];

export const DocumentUploadSection = ({ providerId, onDocumentsUpdated }: DocumentUploadSectionProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les documents au montage
  useEffect(() => {
    loadDocuments();
  }, [providerId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', providerId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      setUploading(documentType);

      // Vérifier taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier ne doit pas dépasser 5MB');
      }

      // Vérifier format
      const allowedFormats = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedFormats.includes(file.type)) {
        throw new Error('Format non autorisé. Utilisez PDF, JPG ou PNG');
      }

      // Récupérer l'ID de l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload vers Supabase Storage avec auth.uid() dans le chemin
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtenir URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('provider-documents')
        .getPublicUrl(fileName);

      // Créer entrée dans la base de données
      const { error: dbError } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: providerId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast.success('Document uploadé avec succès');
      loadDocuments();
      onDocumentsUpdated?.();
    } catch (error: any) {
      toast.error('Erreur lors de l\'upload', { description: error.message });
    } finally {
      setUploading(null);
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType);
    if (!doc) return { status: 'missing', label: 'À uploader', variant: 'outline' as const };
    if (doc.status === 'approved') return { status: 'approved', label: 'Validé', variant: 'default' as const };
    if (doc.status === 'rejected') return { status: 'rejected', label: 'Refusé', variant: 'destructive' as const };
    return { status: 'pending', label: 'En attente', variant: 'secondary' as const };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents requis
        </CardTitle>
        <CardDescription>
          Uploadez tous les documents nécessaires pour la validation de votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const status = getDocumentStatus(docType.value);
          const doc = documents.find(d => d.document_type === docType.value);
          const isUploading = uploading === docType.value;

          return (
            <div key={docType.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <h4 className="font-medium">
                      {docType.label}
                      {docType.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {doc && (
                      <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                    )}
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              {doc?.notes && status.status === 'rejected' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Motif du refus:</strong> {doc.notes}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {doc && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                )}

                <Button
                  variant={doc ? "outline" : "default"}
                  size="sm"
                  disabled={isUploading}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(docType.value, file);
                    };
                    input.click();
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      {doc ? 'Remplacer' : 'Uploader'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Formats acceptés: PDF, JPG, PNG (max 5MB par fichier)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
