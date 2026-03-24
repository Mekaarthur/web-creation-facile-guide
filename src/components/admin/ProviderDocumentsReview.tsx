import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ProviderDoc {
  id: string;
  provider_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  provider?: { business_name: string; user_id: string };
}

const DOC_LABELS: Record<string, string> = {
  identity_document: "Pièce d'identité",
  criminal_record: "Casier judiciaire",
  siret_document: "SIRET / SIREN",
  rib_iban: "RIB / IBAN",
  certification: "Certification",
  cv: "CV",
  insurance: "Assurance",
};

export const ProviderDocumentsReview = () => {
  const [documents, setDocuments] = useState<ProviderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingDoc, setRejectingDoc] = useState<ProviderDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("provider_documents")
      .select(`
        *,
        provider:providers!provider_documents_provider_id_fkey(business_name, user_id)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erreur chargement documents");
    } else {
      setDocuments((data as any[]) || []);
    }
    setLoading(false);
  };

  const handleApprove = async (doc: ProviderDoc) => {
    const { error } = await supabase
      .from("provider_documents")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", doc.id);

    if (error) {
      toast.error("Erreur lors de l'approbation");
    } else {
      toast.success(`Document "${DOC_LABELS[doc.document_type] || doc.document_type}" approuvé`);
      loadDocuments();
    }
  };

  const handleReject = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) {
      toast.error("Veuillez indiquer la raison du rejet");
      return;
    }

    const { error } = await supabase
      .from("provider_documents")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", rejectingDoc.id);

    if (error) {
      toast.error("Erreur lors du rejet");
    } else {
      toast.success("Document rejeté");
      setRejectingDoc(null);
      setRejectionReason("");
      loadDocuments();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1 inline" />En attente</Badge>;
    }
  };

  // Group documents by provider
  const grouped = documents.reduce<Record<string, { providerName: string; docs: ProviderDoc[] }>>((acc, doc) => {
    const key = doc.provider_id;
    if (!acc[key]) {
      acc[key] = {
        providerName: doc.provider?.business_name || "Prestataire inconnu",
        docs: [],
      };
    }
    acc[key].docs.push(doc);
    return acc;
  }, {});

  if (loading) return <div className="p-4">Chargement des documents...</div>;

  return (
    <div className="space-y-6">
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucun document soumis</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([providerId, { providerName, docs }]) => {
          const pendingCount = docs.filter(d => d.status === "pending").length;
          return (
            <Card key={providerId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {providerName}
                  </div>
                  {pendingCount > 0 && (
                    <Badge variant="secondary">{pendingCount} en attente</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {DOC_LABELS[doc.document_type] || doc.document_type}
                          </p>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_name} • {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        </p>
                        {doc.rejection_reason && (
                          <p className="text-xs text-destructive">Raison: {doc.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        {doc.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(doc)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingDoc(doc)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Rejection dialog */}
      <Dialog open={!!rejectingDoc} onOpenChange={() => setRejectingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raison du rejet</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Indiquez la raison du rejet (obligatoire)..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectingDoc(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmer le rejet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
