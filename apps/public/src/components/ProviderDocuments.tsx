import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Shield, Building, User as UserIcon, Award } from 'lucide-react';
import { DocumentCard, type Document, type DocumentRequirement } from '@/components/provider/DocumentCard';

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  { type: 'identity_document', label: 'Pièce d\'identité (CNI, passeport)', description: 'Carte d\'identité, passeport ou permis de conduire recto-verso', icon: UserIcon, required: true },
  { type: 'criminal_record', label: 'Casier judiciaire (moins de 3 mois)', description: 'Extrait de casier judiciaire (bulletin n°3) — facultatif', icon: Shield, required: false },
  { type: 'siret_document', label: 'Justificatif auto-entrepreneur', description: 'Attestation URSSAF, extrait KBIS ou certificat d\'inscription', icon: Building, required: true },
  { type: 'rib_iban', label: 'RIB / IBAN', description: 'Relevé d\'identité bancaire pour recevoir vos paiements', icon: Building, required: true },
  { type: 'certification', label: 'Agrément NOVA (optionnel)', description: "Requis uniquement si vous souhaitez bénéficier de l'avance immédiate URSSAF", icon: Shield, required: false },
  { type: 'certifications_other', label: 'Certifications', description: 'Diplômes, formations, certificats professionnels (optionnel)', icon: Award, required: false },
  { type: 'insurance', label: 'Assurance RC Pro', description: 'Attestation d\'assurance responsabilité civile professionnelle', icon: Award, required: false },
];

const ProviderDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const queryKey = ['provider-documents', user?.id] as const;

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: providerData } = await supabase.from('providers').select('*').eq('user_id', user!.id).single();
      if (!providerData) return { provider: null, documents: [] as Document[] };
      const { data: documentsData } = await supabase
        .from('provider_documents').select('*')
        .eq('provider_id', providerData.id)
        .order('upload_date', { ascending: false });
      return { provider: providerData, documents: (documentsData || []) as Document[] };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const provider = data?.provider ?? null;
  const documents = data?.documents ?? [];

  useEffect(() => {
    if (!provider?.id) return;
    const channel = supabase
      .channel(`provider-docs-${provider.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'provider_documents', filter: `provider_id=eq.${provider.id}` }, (payload) => {
        qc.setQueryData(queryKey, (prev: typeof data) => {
          if (!prev) return prev;
          return { ...prev, documents: prev.documents.map(doc => doc.id === payload.new.id ? { ...doc, ...payload.new } as Document : doc) };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [provider?.id, qc]);

  const getStoragePathFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const marker = '/storage/v1/object/public/provider-documents/';
      const idx = u.pathname.indexOf(marker);
      return idx !== -1 ? decodeURIComponent(u.pathname.substring(idx + marker.length)) : '';
    } catch { return ''; }
  };

  const getDocumentForType = (type: string) => documents.find(doc => doc.document_type === type);

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!provider || !file) return;
    setUploading(documentType);
    setUploadProgress(0);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Le fichier ne peut pas dépasser 10MB');
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) throw new Error('Seuls les fichiers PDF, JPEG et PNG sont acceptés');

      setUploadProgress(20);
      const existingDoc = getDocumentForType(documentType);
      if (existingDoc) {
        const oldPath = getStoragePathFromUrl(existingDoc.file_url);
        if (oldPath) await supabase.storage.from('provider-documents').remove([oldPath]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${documentType}_${Date.now()}.${fileExt}`;
      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage.from('provider-documents').upload(fileName, file);
      if (uploadError) throw uploadError;
      setUploadProgress(70);

      if (existingDoc) {
        const { error } = await supabase.from('provider_documents').update({
          file_name: file.name, file_url: fileName, status: 'pending',
          upload_date: new Date().toISOString(), approved_at: null, rejected_at: null, rejection_reason: null, reviewed_by: null,
        }).eq('id', existingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('provider_documents').insert({
          provider_id: provider.id, document_type: documentType, file_name: file.name, file_url: fileName, status: 'pending',
        });
        if (error) throw error;
      }

      setUploadProgress(100);
      toast({ title: 'Document téléchargé', description: 'Votre document a été envoyé et est en cours de vérification' });
      qc.invalidateQueries({ queryKey });
    } catch (error: any) {
      toast({ title: "Erreur de téléchargement", description: error.message || "Impossible de télécharger le document", variant: "destructive" });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (doc: Document) => {
    try {
      const storagePath = getStoragePathFromUrl(doc.file_url);
      if (storagePath) {
        const { error } = await supabase.storage.from('provider-documents').remove([storagePath]);
        if (error) console.warn('Erreur suppression storage:', error);
      }
      const { error } = await supabase.from('provider_documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast({ title: 'Document supprimé', description: 'Le document a été supprimé avec succès' });
      qc.invalidateQueries({ queryKey });
    } catch (error: any) {
      toast({ title: 'Erreur de suppression', description: error.message || 'Impossible de supprimer le document', variant: 'destructive' });
    }
  };

  const handlePreview = async (doc: Document) => {
    if (previewDocId === doc.id) {
      setPreviewDocId(null);
      const url = previewUrls[doc.id];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      setPreviewUrls(prev => { const copy = { ...prev }; delete copy[doc.id]; return copy; });
      return;
    }
    try {
      setPreviewDocId(doc.id);
      if (/\.pdf$/i.test(doc.file_name)) {
        const res = await fetch(doc.file_url, { credentials: 'omit' });
        const blob = await res.blob();
        setPreviewUrls(prev => ({ ...prev, [doc.id]: URL.createObjectURL(blob) }));
      } else {
        setPreviewUrls(prev => ({ ...prev, [doc.id]: doc.file_url }));
      }
    } catch {
      toast({ title: 'Prévisualisation indisponible', description: 'Téléchargez le fichier pour le consulter.', variant: 'destructive' });
      setPreviewDocId(null);
    }
  };

  const completionPct = () => {
    const required = DOCUMENT_REQUIREMENTS.filter(r => r.required);
    const approved = required.filter(r => getDocumentForType(r.type)?.status === 'approved');
    return Math.round((approved.length / required.length) * 100);
  };

  const submitAllDocuments = async () => {
    setSubmitting(true);
    try {
      const missing = DOCUMENT_REQUIREMENTS.filter(r => r.required && !getDocumentForType(r.type));
      if (missing.length > 0) {
        toast({ title: "Documents manquants", description: `Il manque ${missing.length} document(s) requis`, variant: "destructive" });
        return;
      }
      const { error } = await supabase.from('providers').update({
        documents_submitted: false, documents_submitted_at: null,
        status: 'documents_pending', updated_at: new Date().toISOString(),
      }).eq('id', provider!.id);
      if (error) throw error;
      toast({ title: "Documents soumis avec succès ! 🎉", description: "Vos documents seront examinés sous 48h ouvrées" });
      qc.invalidateQueries({ queryKey });
    } catch (error: any) {
      toast({ title: "Erreur de soumission", description: error.message || "Impossible de soumettre les documents", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pct = completionPct();

  return (
    <div className="space-y-6">
      {/* Progression */}
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
              <span className="text-sm text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="w-full" />
            <p className="text-xs text-muted-foreground">Documents requis approuvés pour commencer vos missions</p>
          </div>
        </CardContent>
      </Card>

      {/* Cards par type de document */}
      <div className="grid gap-4">
        {DOCUMENT_REQUIREMENTS.map(requirement => (
          <DocumentCard
            key={requirement.type}
            requirement={requirement}
            document={getDocumentForType(requirement.type)}
            uploading={uploading}
            uploadProgress={uploadProgress}
            previewDocId={previewDocId}
            previewUrls={previewUrls}
            onUpload={handleFileUpload}
            onPreview={handlePreview}
            onDelete={deleteDocument}
          />
        ))}
      </div>

      {/* Bouton soumission */}
      {pct === 100 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Tous vos documents sont prêts !</h4>
                  <p className="text-sm text-muted-foreground">Soumettez vos documents pour validation par notre équipe</p>
                </div>
              </div>
              <Button size="lg" onClick={submitAllDocuments} disabled={submitting} className="gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Soumission...</> : <><Upload className="w-4 h-4" /> Soumettre tous mes documents</>}
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
