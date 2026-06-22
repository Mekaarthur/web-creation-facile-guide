import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { openDocument } from "@/utils/storageHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  PersonPipelineCard, STAGE_CONFIG,
  type PipelineStage, type DocumentItem, type UnifiedPerson, type RejectDialogState,
} from "@/components/admin/PersonPipelineCard";

const DOC_LABELS: Record<string, string> = {
  identity_document: "Pièce d'identité",
  criminal_record:   "Casier judiciaire",
  siret_document:    "Justificatif auto-entrepreneur",
  siren:             "SIREN",
  rib_iban:          "RIB / IBAN",
  cv:                "CV",
  certification:     "Agrément Nova",
  certifications:    "Agrément Nova",
  insurance:         "Assurance",
};

const REQUIRED_APPLICATION_DOCUMENT_TYPES = ["identity_document", "siret_document", "rib_iban", "certifications"];
const REQUIRED_PROVIDER_DOCUMENT_TYPES    = ["identity_document", "siret_document", "rib_iban", "certification"];

const normalizeKey = (value?: string | null) =>
  (value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const PIPELINE_KEY = ['admin-unified-pipeline'] as const;

function buildApplicationDocs(app: any, validations: any[]): DocumentItem[] {
  const docDefs = [
    { type: "identity_document", label: "Pièce d'identité",              url: app.identity_document_url },
    { type: "siret_document",    label: "Justificatif auto-entrepreneur", url: app.siret_document_url },
    { type: "rib_iban",          label: "RIB / IBAN",                    url: app.rib_iban_url },
    { type: "certifications",    label: "Agrément Nova",                  url: app.certifications_url },
    { type: "criminal_record",   label: "Casier judiciaire (facultatif)", url: app.criminal_record_url },
  ];
  return docDefs.map(def => {
    const validation = validations.find((v: any) => v.document_type === def.type);
    let status: DocumentItem["status"] = "missing";
    if (def.url) status = validation?.status || "pending";
    return { id: `app-doc-${def.type}`, source: "application" as const, type: def.type, label: def.label, url: def.url, status, rejectionReason: validation?.rejection_reason };
  });
}

function determineStage(app: any | null, provider: any | null, docs?: DocumentItem[]): PipelineStage {
  if (provider?.status === "active" && provider?.is_verified) return "actif";
  if (provider) {
    const provDocs = (docs || []).filter(d => d.source === "provider");
    const hasAll   = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => provDocs.some(doc => doc.type === type));
    const allOk    = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => provDocs.some(doc => doc.type === type && doc.status === "approved"));
    if (!hasAll || !allOk) return "documents";
    if (!provider.mandat_facturation_accepte || !provider.formation_completed || !provider.identity_verified) return "onboarding";
    return "actif";
  }
  if (app) {
    const appDocs = (docs || []).filter(d => d.source === "application");
    const hasActivity = REQUIRED_APPLICATION_DOCUMENT_TYPES.some(type => appDocs.some(doc => doc.type === type && doc.status !== "missing"));
    if (app.status === "approved") return "onboarding";
    if (app.status === "documents_pending" || hasActivity) return "documents";
    return "candidature";
  }
  return "candidature";
}

async function fetchAll(): Promise<UnifiedPerson[]> {
  const [appsRes, providersRes, provDocsRes, validationsRes, provServicesRes, profilesRes] = await Promise.all([
    supabase.from("job_applications").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("providers").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("provider_documents").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("application_document_validations").select("*").limit(500),
    supabase.from("provider_services").select("*, services!provider_services_service_id_fkey(id, name, category)").limit(500),
    supabase.from("profiles").select("user_id, email, first_name, last_name"),
  ]).catch(err => {
    console.error('[fetchAll] Promise.all rejected:', err);
    throw err;
  });

  if (appsRes.error) console.error('[fetchAll] job_applications:', appsRes.error);
  if (providersRes.error) console.error('[fetchAll] providers:', providersRes.error);
  if (provDocsRes.error) console.error('[fetchAll] provider_documents:', provDocsRes.error);
  if (validationsRes.error) console.error('[fetchAll] application_document_validations:', validationsRes.error);
  if (provServicesRes.error) console.error('[fetchAll] provider_services:', provServicesRes.error);
  if (profilesRes.error) console.error('[fetchAll] profiles:', profilesRes.error);

  const apps = appsRes.data || [], providers = providersRes.data || [], provDocs = provDocsRes.data || [];
  const validations = validationsRes.data || [], provServices = provServicesRes.data || [], profiles = profilesRes.data || [];
  const profilesByUserId = new Map(profiles.map((p: any) => [p.user_id, p]));
  const emailMap = new Map<string, UnifiedPerson>();

  for (const app of apps) {
    const email = app.email?.toLowerCase();
    if (!email) continue;
    const appDocs = buildApplicationDocs(app, validations.filter((v: any) => v.application_id === app.id));
    emailMap.set(email, {
      id: `app-${app.id}`, name: `${app.first_name} ${app.last_name}`, email: app.email,
      phone: app.phone, city: app.city, stage: determineStage(app, null, appDocs), createdAt: app.created_at,
      application: app, allDocuments: appDocs, servicesCount: 0,
      serviceCategories: app.service_categories || [app.category].filter(Boolean),
    });
  }

  for (const prov of providers) {
    const providerDocs = provDocs.filter((d: any) => d.provider_id === prov.id).map((d: any): DocumentItem => ({
      id: d.id, source: "provider" as const, type: d.document_type,
      label: DOC_LABELS[d.document_type] || d.document_type, url: d.file_url,
      status: d.status === "approved" ? "approved" : d.status === "rejected" ? "rejected" : "pending",
      rejectionReason: d.rejection_reason, fileName: d.file_name, createdAt: d.created_at,
    }));

    const thisProvServices = provServices.filter((ps: any) => ps.provider_id === prov.id);
    const provServiceNames = thisProvServices.map((ps: any) => ps.services?.name).filter(Boolean);
    const provServiceCategories = [...new Set(thisProvServices.map((ps: any) => ps.services?.category).filter(Boolean))] as string[];
    const providerProfile = prov.user_id ? profilesByUserId.get(prov.user_id) : null;
    const providerEmail   = (providerProfile as any)?.email?.toLowerCase() || null;
    const providerNameKey = normalizeKey(
      (providerProfile as any)?.first_name && (providerProfile as any)?.last_name
        ? `${(providerProfile as any).first_name} ${(providerProfile as any).last_name}`
        : prov.business_name
    );

    let existing = providerEmail ? emailMap.get(providerEmail) : undefined;
    if (!existing && providerNameKey) {
      existing = Array.from(emailMap.values()).find(c =>
        normalizeKey(`${c.application?.first_name || ""} ${c.application?.last_name || ""}`) === providerNameKey
      );
    }

    if (existing?.application) {
      existing.provider = prov;
      existing.name = prov.business_name || existing.name;
      existing.email = providerEmail || existing.email;
      existing.servicesCount = thisProvServices.length;
      existing.serviceCategories = provServiceCategories.length > 0 ? provServiceCategories : existing.serviceCategories;
      existing.providerServices  = provServiceNames;
      const existingTypes = new Set(existing.allDocuments.map(d => `${d.source}-${d.type}`));
      for (const pd of providerDocs) {
        const key = `${pd.source}-${pd.type}`;
        if (!existingTypes.has(key)) existing.allDocuments.push(pd);
        else { const idx = existing.allDocuments.findIndex(d => d.source === pd.source && d.type === pd.type); if (idx >= 0) existing.allDocuments[idx] = pd; }
      }
      existing.stage = determineStage(existing.application, prov, existing.allDocuments);
    } else {
      const relatedApp = apps.find((a: any) => a.email?.toLowerCase() === providerEmail);
      emailMap.set(providerEmail || `provider-${prov.id}`, {
        id: `prov-${prov.id}`, name: prov.business_name || "Prestataire sans nom",
        email: providerEmail || relatedApp?.email || "", phone: relatedApp?.phone || "",
        city: prov.adresse_complete || prov.location || null,
        stage: determineStage(null, prov, providerDocs), createdAt: prov.created_at,
        provider: prov, allDocuments: providerDocs, servicesCount: thisProvServices.length,
        serviceCategories: provServiceCategories.length > 0 ? provServiceCategories : relatedApp?.service_categories || [],
        providerServices: provServiceNames,
      });
    }
  }

  return Array.from(emailMap.values());
}

export const UnifiedProviderPipeline = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm]       = useState("");
  const [activeStageFilter, setActiveStageFilter] = useState<PipelineStage | "all">("all");
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [rejectDialog, setRejectDialog]   = useState<RejectDialogState | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: people = [], isLoading: loading } = useQuery<UnifiedPerson[]>({ queryKey: PIPELINE_KEY, queryFn: fetchAll });
  const invalidate = () => qc.invalidateQueries({ queryKey: PIPELINE_KEY });

  const filteredPeople = people.filter((p) => {
    if (activeStageFilter !== "all" && p.stage !== activeStageFilter) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
  });

  const stageCounts = {
    all:         people.length,
    candidature: people.filter(p => p.stage === "candidature").length,
    documents:   people.filter(p => p.stage === "documents").length,
    onboarding:  people.filter(p => p.stage === "onboarding").length,
    actif:       people.filter(p => p.stage === "actif").length,
  };

  const handleApproveApplication = async (person: UnifiedPerson) => {
    if (!person.application) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-applications", {
        body: { action: "approve", applicationId: person.application.id, adminComments: "Candidature approuvée" },
      });
      if (error) {
        let detail = error.message;
        try { const ctx = (error as any).context; if (ctx && typeof ctx.json === 'function') { const body = await ctx.json(); detail = body?.error || detail; } } catch {}
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      toast.success("Candidature approuvée — compte prestataire créé");
      invalidate();
    } catch (error: any) {
      toast.error("Erreur d'approbation: " + (error.message || "Erreur inconnue"));
    }
  };

  const handleRejectApplication = async (person: UnifiedPerson) => {
    if (!person.application) return;
    const reason = prompt("Raison du rejet :");
    if (!reason) return;
    try {
      const { error } = await supabase.functions.invoke("admin-applications", { body: { action: "reject", applicationId: person.application.id, adminComments: reason } });
      if (error) throw error;
      supabase.functions.invoke("send-modern-notification", { body: { type: "provider_rejected", recipient: { email: person.email, name: person.name, firstName: person.name.split(" ")[0] }, data: { reason } } }).catch(() => {});
      toast.success("Candidature rejetée");
      invalidate();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const handleActivateProvider = async (person: UnifiedPerson) => {
    if (!person.provider) return;
    try {
      const { error } = await supabase.from("providers").update({ status: "active", is_verified: true }).eq("id", person.provider.id);
      if (error) throw error;
      supabase.functions.invoke("send-modern-notification", { body: { type: "provider_welcome", recipient: { email: person.email, name: person.name, firstName: person.name.split(" ")[0] }, data: { providerName: person.name } } }).catch(() => {});
      toast.success("Prestataire activé !");
      invalidate();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const handleApproveDoc = async (doc: DocumentItem, person: UnifiedPerson) => {
    try {
      if (doc.source === "provider") {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("provider_documents").update({ status: "approved", approved_at: new Date().toISOString(), rejected_at: null, reviewed_by: user?.id, rejection_reason: null }).eq("id", doc.id);
        if (error) throw error;
        if (person.provider) {
          const provDocs = person.allDocuments.filter(d => d.source === "provider").map(d => d.id === doc.id ? { ...d, status: "approved" as const } : d);
          const allOk = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => provDocs.some(item => item.type === type && item.status === "approved"));
          await supabase.from("providers").update({ documents_submitted: allOk, documents_submitted_at: allOk ? new Date().toISOString() : null }).eq("id", person.provider.id);
        }
      } else if (person.application) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("application_document_validations").upsert({ application_id: person.application.id, document_type: doc.type, status: "approved", validated_by: user?.id, validated_at: new Date().toISOString(), rejection_reason: null }, { onConflict: "application_id,document_type" });
        if (error) throw error;
        const appDocs = person.allDocuments.filter(d => d.source === "application").map(d => d.id === doc.id ? { ...d, status: "approved" as const } : d);
        const allOk = REQUIRED_APPLICATION_DOCUMENT_TYPES.every(type => appDocs.some(item => item.type === type && item.status === "approved"));
        const hasAll = REQUIRED_APPLICATION_DOCUMENT_TYPES.every(type => appDocs.some(item => item.type === type && item.status !== "missing"));
        await supabase.from("job_applications").update({ documents_complete: allOk, documents_validated_at: allOk ? new Date().toISOString() : null, status: ["approved", "rejected"].includes(person.application.status) ? person.application.status : (hasAll ? "documents_pending" : "pending") }).eq("id", person.application.id);
      }
      toast.success(`Document "${doc.label}" approuvé`);
      invalidate();
    } catch (err: any) {
      toast.error("Erreur approbation: " + (err?.message || "Erreur inconnue"));
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectDialog || !rejectionReason.trim()) return;
    try {
      if (rejectDialog.source === "provider") {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("provider_documents").update({ status: "rejected", approved_at: null, rejected_at: new Date().toISOString(), reviewed_by: user?.id, rejection_reason: rejectionReason }).eq("id", rejectDialog.docId);
        if (error) throw error;
        const relatedPerson = people.find(p => p.allDocuments.some(d => d.id === rejectDialog.docId));
        if (relatedPerson?.provider) await supabase.from("providers").update({ documents_submitted: false, documents_submitted_at: null }).eq("id", relatedPerson.provider.id);
      } else if (rejectDialog.applicationId) {
        const { data: { user } } = await supabase.auth.getUser();
        const docType = rejectDialog.docId.replace("app-doc-", "");
        const { error } = await supabase.from("application_document_validations").upsert({ application_id: rejectDialog.applicationId, document_type: docType, status: "rejected", validated_by: user?.id, validated_at: new Date().toISOString(), rejection_reason: rejectionReason }, { onConflict: "application_id,document_type" });
        if (error) throw error;
        await supabase.from("job_applications").update({ documents_complete: false, documents_validated_at: null, status: "documents_pending" }).eq("id", rejectDialog.applicationId);
      }
      toast.success("Document rejeté");
      setRejectDialog(null);
      setRejectionReason("");
      invalidate();
    } catch {
      toast.error("Erreur rejet");
    }
  };

  const viewDocument = async (url: string, source?: string) => {
    if (!url) return;
    const bucket = source === "provider" ? "provider-documents" : "provider-applications";
    const success = await openDocument(url, bucket);
    if (!success) toast.error("Impossible d'ouvrir le document");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={activeStageFilter === "all" ? "default" : "outline"} onClick={() => setActiveStageFilter("all")}>
          Tous ({stageCounts.all})
        </Button>
        {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const Icon = cfg.icon;
          return (
            <Button key={stage} size="sm" variant={activeStageFilter === stage ? "default" : "outline"} onClick={() => setActiveStageFilter(stage)} className="gap-1">
              <Icon className="w-3 h-3" />{cfg.label} ({stageCounts[stage]})
            </Button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={invalidate} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {filteredPeople.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Aucun résultat</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredPeople.map((person) => (
            <PersonPipelineCard
              key={person.id}
              person={person}
              isExpanded={expandedId === person.id}
              onToggle={() => setExpandedId(expandedId === person.id ? null : person.id)}
              onApproveApp={handleApproveApplication}
              onRejectApp={handleRejectApplication}
              onActivate={handleActivateProvider}
              onApproveDoc={handleApproveDoc}
              onOpenRejectDialog={setRejectDialog}
              onViewDoc={viewDocument}
            />
          ))}
        </div>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectionReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Raison du rejet</DialogTitle></DialogHeader>
          <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Indiquez la raison du rejet..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectionReason(""); }}>Annuler</Button>
            <Button variant="destructive" onClick={handleRejectDoc} disabled={!rejectionReason.trim()}>Confirmer le rejet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
