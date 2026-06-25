import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FileText, Upload, Eye, CheckCircle, AlertCircle, X, Loader2, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface Document {
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

export interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
}

interface Props {
  requirement: DocumentRequirement;
  document: Document | undefined;
  uploading: string | null;
  uploadProgress: number;
  previewDocId: string | null;
  previewUrls: Record<string, string>;
  onUpload: (file: File, type: string) => void;
  onPreview: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

const isImage = (name: string) => /\.(png|jpe?g|webp)$/i.test(name);
const isPdf = (name: string) => /\.pdf$/i.test(name);

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

export function DocumentCard({ requirement, document, uploading, uploadProgress, previewDocId, previewUrls, onUpload, onPreview, onDelete }: Props) {
  const Icon = requirement.icon;
  const isUploading = uploading === requirement.type;

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!document?.file_url) return;
    supabase.storage
      .from('provider-documents')
      .createSignedUrl(document.file_url, 3600)
      .then(({ data }) => { if (data?.signedUrl) setSignedUrl(data.signedUrl); });
  }, [document?.file_url]);

  return (
    <Card className="relative">
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
              <p className="text-sm text-muted-foreground mb-3">{requirement.description}</p>

              {isUploading ? (
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

                  {signedUrl && isImage(document.file_name) && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                      <img src={signedUrl} alt={document.file_name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onPreview(document)} className="gap-1">
                      <Eye className="w-4 h-4" />
                      {previewDocId === document.id ? 'Masquer' : 'Aperçu'}
                    </Button>
                    <Button variant="outline" size="sm" asChild className="gap-1" disabled={!signedUrl}>
                      <a href={signedUrl || '#'} target="_blank" rel="noopener noreferrer"
                         onClick={e => !signedUrl && e.preventDefault()}>Télécharger</a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(document)} className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </Button>
                  </div>

                  {previewDocId === document.id && (
                    <div className="mt-3 border rounded-lg overflow-hidden">
                      {isImage(document.file_name) ? (
                        <img src={previewUrls[document.id] || signedUrl || ''} alt={document.file_name} className="w-full max-h-[480px] object-contain bg-muted" />
                      ) : isPdf(document.file_name) ? (
                        <iframe src={previewUrls[document.id]} className="w-full h-[520px] bg-muted" title={`Aperçu ${document.file_name}`} />
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
              disabled={isUploading}
              onClick={() => {
                const input = window.document.getElementById(`file-${requirement.type}`) as HTMLInputElement;
                if (input) { input.value = ''; input.click(); }
              }}
            >
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {document ? 'Remplacer' : 'Télécharger'}
            </Button>
            <input
              id={`file-${requirement.type}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, requirement.type); }}
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
}
