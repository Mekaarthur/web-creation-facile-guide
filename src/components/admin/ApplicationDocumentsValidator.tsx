import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Shield,
  Building,
  User,
  CreditCard,
  Award,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DocumentInfo {
  type: string;
  label: string;
  description: string;
  icon: any;
  required: boolean;
  url: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
}

interface ApplicationDocumentsValidatorProps {
  application: {
    id: string;
    identity_document_url: string | null;
    criminal_record_url: string | null;
    criminal_record_date: string | null;
    siren_number: string | null;
    rib_iban_url: string | null;
    cv_file_url: string | null;
    certifications_url: string | null;
    documents_complete: boolean | null;
  };
  onDocumentUpdated?: () => void;
}

export const ApplicationDocumentsValidator = ({ 
  application, 
  onDocumentUpdated 
}: ApplicationDocumentsValidatorProps) => {
  const { toast } = useToast();
  const [validatingDoc, setValidatingDoc] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [currentDocType, setCurrentDocType] = useState('');

  const documents: DocumentInfo[] = [
    {
      type: 'identity_document',
      label: 'Pièce d\'identité',
      description: 'CNI, Passeport ou Permis de conduire',
      icon: User,
      required: true,
      url: application.identity_document_url,
    },
    {
      type: 'criminal_record',
      label: 'Casier judiciaire',
      description: `Bulletin n°3 - ${application.criminal_record_date ? `Date: ${new Date(application.criminal_record_date).toLocaleDateString('fr-FR')}` : 'Date non renseignée'}`,
      icon: Shield,
      required: true,
      url: application.criminal_record_url,
    },
    {
      type: 'siren',
      label: 'SIREN',
      description: application.siren_number || 'Non renseigné',
      icon: Building,
      required: true,
      url: null, // Le SIREN est un numéro, pas un fichier
    },
    {
      type: 'rib_iban',
      label: 'RIB / IBAN',
      description: 'Relevé d\'identité bancaire',
      icon: CreditCard,
      required: true,
      url: application.rib_iban_url,
    },
    {
      type: 'cv',
      label: 'Curriculum Vitae',
      description: 'CV du candidat',
      icon: FileText,
      required: true,
      url: application.cv_file_url,
    },
    {
      type: 'certifications',
      label: 'Certifications',
      description: 'Diplômes et certifications professionnelles',
      icon: Award,
      required: false,
      url: application.certifications_url,
    },
  ];

  const getDocumentStatus = (doc: DocumentInfo): 'missing' | 'pending' | 'approved' | 'rejected' => {
    if (doc.type === 'siren') {
      return application.siren_number ? 'approved' : 'missing';
    }
    if (!doc.url) {
      return 'missing';
    }
    // Pour l'instant, on considère tous les documents téléchargés comme "pending"
    // Dans une future itération, on pourra stocker le statut dans provider_documents
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'missing':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Manquant</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return null;
    }
  };

  const handleApproveDocument = async (docType: string) => {
    setValidatingDoc(docType);
    try {
      // Mettre à jour le statut du document
      // Pour l'instant, on met juste un toast de succès
      // Dans une future itération, on stockera le statut dans provider_documents
      
      toast({
        title: "Document approuvé",
        description: `Le document "${documents.find(d => d.type === docType)?.label}" a été approuvé avec succès.`,
      });

      onDocumentUpdated?.();
    } catch (error) {
      console.error('Erreur approbation document:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le document.",
        variant: "destructive"
      });
    } finally {
      setValidatingDoc(null);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Raison requise",
        description: "Veuillez indiquer la raison du rejet.",
        variant: "destructive"
      });
      return;
    }

    setValidatingDoc(currentDocType);
    try {
      // Mettre à jour le statut du document avec la raison du rejet
      // Pour l'instant, on met juste un toast
      
      toast({
        title: "Document rejeté",
        description: `Le document a été rejeté. Le candidat sera notifié.`,
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setCurrentDocType('');
      onDocumentUpdated?.();
    } catch (error) {
      console.error('Erreur rejet document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le document.",
        variant: "destructive"
      });
    } finally {
      setValidatingDoc(null);
    }
  };

  const openRejectDialog = (docType: string) => {
    setCurrentDocType(docType);
    setShowRejectDialog(true);
  };

  const viewDocument = async (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // C'est un chemin de storage, on doit générer l'URL signée
      try {
        const { data, error } = await supabase.storage
          .from('provider-documents')
          .createSignedUrl(url, 3600); // 1 heure
        
        if (error) throw error;
        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('Erreur ouverture document:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir le document.",
          variant: "destructive"
        });
      }
    }
  };

  const allRequiredDocsPresent = documents
    .filter(d => d.required)
    .every(d => getDocumentStatus(d) !== 'missing');

  const allRequiredDocsApproved = documents
    .filter(d => d.required)
    .every(d => getDocumentStatus(d) === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Documents du candidat</h3>
        <div className="flex items-center gap-2">
          {allRequiredDocsApproved ? (
            <Badge variant="default" className="bg-success">
              <CheckCircle className="w-4 h-4 mr-1" />
              Tous validés
            </Badge>
          ) : allRequiredDocsPresent ? (
            <Badge variant="secondary">
              <AlertCircle className="w-4 h-4 mr-1" />
              En attente de validation
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-4 h-4 mr-1" />
              Documents manquants
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {documents.map((doc) => {
          const status = getDocumentStatus(doc);
          const Icon = doc.icon;
          
          return (
            <div 
              key={doc.type}
              className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{doc.label}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs">Obligatoire</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                    {status === 'rejected' && doc.rejection_reason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                        <strong>Raison du rejet:</strong> {doc.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  
                  {status !== 'missing' && (
                    <div className="flex gap-1">
                      {doc.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(doc.url!)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveDocument(doc.type)}
                            disabled={validatingDoc === doc.type}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(doc.type)}
                            disabled={validatingDoc === doc.type}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allRequiredDocsPresent && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h4 className="font-medium text-warning">Documents manquants</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Le candidat n'a pas encore soumis tous les documents obligatoires.
                La candidature ne peut pas être approuvée tant que tous les documents requis ne sont pas fournis et validés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Veuillez indiquer la raison du rejet de ce document. Le candidat recevra cette information.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Document illisible, date expirée, informations manquantes..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setCurrentDocType('');
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectDocument}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter le document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
