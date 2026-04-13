import { useState, useEffect } from "react";
import { openDocument } from "@/utils/storageHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  Building,
  CreditCard,
  Award,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type PipelineStage = "candidature" | "documents" | "onboarding" | "actif";

interface UnifiedPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  stage: PipelineStage;
  createdAt: string;
  // Application data
  application?: any;
  // Provider data
  provider?: any;
  // All documents (merged)
  allDocuments: DocumentItem[];
  // Services count
  servicesCount: number;
  serviceCategories: string[];
  providerServices?: string[];
}

interface DocumentItem {
  id: string;
  source: "application" | "provider";
  type: string;
  label: string;
  url: string | null;
  value?: string;
  status: "missing" | "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  fileName?: string;
  createdAt?: string;
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bgColor: string; icon: any }> = {
  candidature: { label: "Candidature", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", icon: Clock },
  documents: { label: "Validation docs", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", icon: FileText },
  onboarding: { label: "Onboarding", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", icon: GraduationCap },
  actif: { label: "Actif", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle },
};

const DOC_LABELS: Record<string, string> = {
  identity_document: "Pièce d'identité",
  criminal_record: "Casier judiciaire",
  siret_document: "Justificatif auto-entrepreneur",
  siren: "SIREN",
  rib_iban: "RIB / IBAN",
  cv: "CV",
  certification: "Agrément Nova",
  certifications: "Agrément Nova",
  insurance: "Assurance",
};

const DOC_ICONS: Record<string, any> = {
  identity_document: User,
  criminal_record: Shield,
  siret_document: Building,
  siren: Building,
  rib_iban: CreditCard,
  cv: FileText,
  certification: Award,
  certifications: Award,
  insurance: Shield,
};

const REQUIRED_APPLICATION_DOCUMENT_TYPES = ["identity_document", "siret_document", "rib_iban", "certifications"];
const REQUIRED_PROVIDER_DOCUMENT_TYPES = ["identity_document", "siret_document", "rib_iban", "certification"];

const normalizeKey = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const UnifiedProviderPipeline = () => {
  const [people, setPeople] = useState<UnifiedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStageFilter, setActiveStageFilter] = useState<PipelineStage | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ docId: string; source: string; applicationId?: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [appsRes, providersRes, provDocsRes, validationsRes, provServicesRes, profilesRes] = await Promise.all([
        supabase.from("job_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("providers").select("*").order("created_at", { ascending: false }),
        supabase.from("provider_documents").select("*").order("created_at", { ascending: false }),
        supabase.from("application_document_validations").select("*"),
        supabase.from("provider_services").select("*, services(id, name, category)"),
        supabase.from("profiles").select("user_id, email, first_name, last_name"),
      ]);

      const apps = appsRes.data || [];
      const providers = providersRes.data || [];
      const provDocs = provDocsRes.data || [];
      const validations = validationsRes.data || [];
      const provServices = provServicesRes.data || [];
      const profiles = profilesRes.data || [];
      const profilesByUserId = new Map(profiles.map((profile: any) => [profile.user_id, profile]));

      // Build unified list
      const emailMap = new Map<string, UnifiedPerson>();

      // Process applications first
      for (const app of apps) {
        const email = app.email?.toLowerCase();
        if (!email) continue;

        const appValidations = validations.filter((v: any) => v.application_id === app.id);
        const appDocs = buildApplicationDocs(app, appValidations);

        const stage = determineStage(app, null, appDocs);
        emailMap.set(email, {
          id: `app-${app.id}`,
          name: `${app.first_name} ${app.last_name}`,
          email: app.email,
          phone: app.phone,
          city: app.city,
          stage,
          createdAt: app.created_at,
          application: app,
          allDocuments: appDocs,
          servicesCount: 0,
          serviceCategories: app.service_categories || [app.category].filter(Boolean),
        });
      }

      // Process providers, merge if email match
      for (const prov of providers) {
        const providerDocs = provDocs
          .filter((d: any) => d.provider_id === prov.id)
          .map((d: any): DocumentItem => ({
            id: d.id,
            source: "provider" as const,
            type: d.document_type,
            label: DOC_LABELS[d.document_type] || d.document_type,
            url: d.file_url,
            status: d.status === "approved" ? "approved" : d.status === "rejected" ? "rejected" : "pending",
            rejectionReason: d.rejection_reason,
            fileName: d.file_name,
            createdAt: d.created_at,
          }));

        // Get provider's active services
        const thisProvServices = provServices.filter((ps: any) => ps.provider_id === prov.id);
        const provServiceNames = thisProvServices
          .map((ps: any) => ps.services?.name)
          .filter(Boolean);
        const provServiceCategories = [...new Set(
          thisProvServices
            .map((ps: any) => ps.services?.category)
            .filter(Boolean)
        )] as string[];

        const providerProfile = prov.user_id ? profilesByUserId.get(prov.user_id) : null;
        const providerEmail = providerProfile?.email?.toLowerCase() || null;
        const providerNameKey = normalizeKey(
          providerProfile?.first_name && providerProfile?.last_name
            ? `${providerProfile.first_name} ${providerProfile.last_name}`
            : prov.business_name
        );

        let existing = providerEmail ? emailMap.get(providerEmail) : undefined;
        if (!existing && providerNameKey) {
          existing = Array.from(emailMap.values()).find((candidate) =>
            normalizeKey(`${candidate.application?.first_name || ""} ${candidate.application?.last_name || ""}`) === providerNameKey
          );
        }

        let merged = false;
        if (existing?.application) {
          existing.provider = prov;
          existing.name = prov.business_name || existing.name;
          existing.email = providerEmail || existing.email;
          existing.servicesCount = thisProvServices.length;
          existing.serviceCategories = provServiceCategories.length > 0 ? provServiceCategories : existing.serviceCategories;
          existing.providerServices = provServiceNames;

          const existingTypes = new Set(existing.allDocuments.map(d => `${d.source}-${d.type}`));
          for (const pd of providerDocs) {
            const compoundType = `${pd.source}-${pd.type}`;
            if (!existingTypes.has(compoundType)) {
              existing.allDocuments.push(pd);
            } else {
              const idx = existing.allDocuments.findIndex(d => d.source === pd.source && d.type === pd.type);
              if (idx >= 0) existing.allDocuments[idx] = pd;
            }
          }

          existing.stage = determineStage(existing.application, prov, existing.allDocuments);
          merged = true;
        }

        if (!merged) {
          const relatedApp = apps.find((a: any) => a.email?.toLowerCase() === providerEmail);
          const stage = determineStage(null, prov, providerDocs);
          emailMap.set(providerEmail || `provider-${prov.id}`, {
            id: `prov-${prov.id}`,
            name: prov.business_name || "Prestataire sans nom",
            email: providerEmail || relatedApp?.email || "",
            phone: relatedApp?.phone || "",
            city: prov.adresse_complete || prov.location || null,
            stage,
            createdAt: prov.created_at,
            provider: prov,
            allDocuments: providerDocs,
            servicesCount: thisProvServices.length,
            serviceCategories: provServiceCategories.length > 0 
              ? provServiceCategories 
              : relatedApp?.service_categories || [],
            providerServices: provServiceNames,
          });
        }
      }

      setPeople(Array.from(emailMap.values()));
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const buildApplicationDocs = (app: any, validations: any[]): DocumentItem[] => {
    const docs: DocumentItem[] = [];
    const docDefs = [
      { type: "identity_document", label: "Pièce d'identité", url: app.identity_document_url },
      { type: "siret_document", label: "Justificatif auto-entrepreneur", url: app.siret_document_url },
      { type: "rib_iban", label: "RIB / IBAN", url: app.rib_iban_url },
      { type: "certifications", label: "Agrément Nova", url: app.certifications_url },
      { type: "criminal_record", label: "Casier judiciaire (facultatif)", url: app.criminal_record_url },
    ];

    for (const def of docDefs) {
      const validation = validations.find((v: any) => v.document_type === def.type);
      let status: DocumentItem["status"] = "missing";
      if (def.url) {
        status = validation?.status || "pending";
      }

      docs.push({
        id: `app-doc-${def.type}`,
        source: "application",
        type: def.type,
        label: def.label,
        url: def.url,
        status,
        rejectionReason: validation?.rejection_reason,
      });
    }
    return docs;
  };

  const determineStage = (app: any | null, provider: any | null, docs?: DocumentItem[]): PipelineStage => {
    if (provider?.status === "active" && provider?.is_verified) return "actif";
    if (provider) {
      const providerDocs = (docs || []).filter(d => d.source === "provider");
      const hasAllRequiredDocs = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => providerDocs.some(doc => doc.type === type));
      const allApproved = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => providerDocs.some(doc => doc.type === type && doc.status === "approved"));
      if (!hasAllRequiredDocs || !allApproved) return "documents";
      const needsOnboarding = !provider.mandat_facturation_accepte || !provider.formation_completed || !provider.identity_verified;
      if (needsOnboarding) return "onboarding";
      return "actif";
    }
    if (app) {
      const applicationDocs = (docs || []).filter(d => d.source === "application");
      const hasDocumentActivity = REQUIRED_APPLICATION_DOCUMENT_TYPES.some(type => applicationDocs.some(doc => doc.type === type && doc.status !== "missing"));
      if (app.status === "approved") return "onboarding";
      if (app.status === "documents_pending" || hasDocumentActivity) return "documents";
      if (app.status === "rejected") return "candidature";
      return "candidature";
    }
    return "candidature";
  };

  const filteredPeople = people.filter((p) => {
    if (activeStageFilter !== "all" && p.stage !== activeStageFilter) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
  });

  const stageCounts = {
    all: people.length,
    candidature: people.filter(p => p.stage === "candidature").length,
    documents: people.filter(p => p.stage === "documents").length,
    onboarding: people.filter(p => p.stage === "onboarding").length,
    actif: people.filter(p => p.stage === "actif").length,
  };

  const handleApproveApplication = async (person: UnifiedPerson) => {
    if (!person.application) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-applications", {
        body: { action: "approve", applicationId: person.application.id, adminComments: "Candidature approuvée" },
      });
      if (error) {
        // Try to extract detailed error from response
        let detail = error.message;
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            detail = body?.error || detail;
          }
        } catch {}
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      toast.success("Candidature approuvée — compte prestataire créé");
      await loadAll();
    } catch (error: any) {
      console.error("Approve error:", error);
      toast.error("Erreur d'approbation: " + (error.message || "Erreur inconnue"));
    }
  };

  const handleRejectApplication = async (person: UnifiedPerson) => {
    if (!person.application) return;
    const reason = prompt("Raison du rejet:");
    if (!reason) return;
    try {
      const { error } = await supabase.functions.invoke("admin-applications", {
        body: { action: "reject", applicationId: person.application.id, adminComments: reason },
      });
      if (error) throw error;
      toast.success("Candidature rejetée");
      await loadAll();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const handleActivateProvider = async (person: UnifiedPerson) => {
    if (!person.provider) return;
    try {
      const { error } = await supabase
        .from("providers")
        .update({ status: "active", is_verified: true })
        .eq("id", person.provider.id);
      if (error) throw error;
      toast.success("Prestataire activé !");
      await loadAll();
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
          const providerDocs = person.allDocuments
            .filter(d => d.source === "provider")
            .map(d => d.id === doc.id ? { ...d, status: "approved" as const, rejectionReason: null } : d);
          const allRequiredApproved = REQUIRED_PROVIDER_DOCUMENT_TYPES.every(type => providerDocs.some(item => item.type === type && item.status === "approved"));
          await supabase.from("providers").update({ documents_submitted: allRequiredApproved, documents_submitted_at: allRequiredApproved ? new Date().toISOString() : null }).eq("id", person.provider.id);
        }
      } else if (person.application) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("application_document_validations").upsert({
          application_id: person.application.id,
          document_type: doc.type,
          status: "approved",
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
          rejection_reason: null,
        }, { onConflict: "application_id,document_type" });
        if (error) throw error;

        const applicationDocs = person.allDocuments
          .filter(d => d.source === "application")
          .map(d => d.id === doc.id ? { ...d, status: "approved" as const, rejectionReason: null } : d);
        const allRequiredApproved = REQUIRED_APPLICATION_DOCUMENT_TYPES.every(type => applicationDocs.some(item => item.type === type && item.status === "approved"));
        const hasAllRequiredDocs = REQUIRED_APPLICATION_DOCUMENT_TYPES.every(type => applicationDocs.some(item => item.type === type && item.status !== "missing"));
        await supabase.from("job_applications").update({
          documents_complete: allRequiredApproved,
          documents_validated_at: allRequiredApproved ? new Date().toISOString() : null,
          status: ["approved", "rejected"].includes(person.application.status) ? person.application.status : (hasAllRequiredDocs ? "documents_pending" : "pending"),
        }).eq("id", person.application.id);
      }
      toast.success(`Document "${doc.label}" approuvé`);
      await loadAll();
    } catch (err: any) {
      console.error("Erreur approbation document:", err);
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
        const relatedPerson = people.find(person => person.allDocuments.some(doc => doc.id === rejectDialog.docId));
        if (relatedPerson?.provider) {
          await supabase.from("providers").update({ documents_submitted: false, documents_submitted_at: null }).eq("id", relatedPerson.provider.id);
        }
      } else if (rejectDialog.applicationId) {
        const { data: { user } } = await supabase.auth.getUser();
        const docType = rejectDialog.docId.replace("app-doc-", "");
        const { error } = await supabase.from("application_document_validations").upsert({
          application_id: rejectDialog.applicationId,
          document_type: docType,
          status: "rejected",
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        }, { onConflict: "application_id,document_type" });
        if (error) throw error;
        await supabase.from("job_applications").update({ documents_complete: false, documents_validated_at: null, status: "documents_pending" }).eq("id", rejectDialog.applicationId);
      }
      toast.success("Document rejeté");
      setRejectDialog(null);
      setRejectionReason("");
      await loadAll();
    } catch {
      toast.error("Erreur rejet");
    }
  };

  const viewDocument = async (url: string, source?: string) => {
    if (!url) return;
    const bucket = source === "provider" ? "provider-documents" : "provider-applications";
    const success = await openDocument(url, bucket);
    if (!success) {
      toast.error("Impossible d'ouvrir le document");
    }
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
      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeStageFilter === "all" ? "default" : "outline"}
          onClick={() => setActiveStageFilter("all")}
        >
          Tous ({stageCounts.all})
        </Button>
        {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const Icon = cfg.icon;
          return (
            <Button
              key={stage}
              size="sm"
              variant={activeStageFilter === stage ? "default" : "outline"}
              onClick={() => setActiveStageFilter(stage)}
              className="gap-1"
            >
              <Icon className="w-3 h-3" />
              {cfg.label} ({stageCounts[stage]})
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={loadAll} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      {filteredPeople.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Aucun résultat
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPeople.map((person) => {
            const stageCfg = STAGE_CONFIG[person.stage];
            const StageIcon = stageCfg.icon;
            const isExpanded = expandedId === person.id;
            const docsCount = person.allDocuments.length;
            const pendingDocs = person.allDocuments.filter(d => d.status === "pending").length;
            const approvedDocs = person.allDocuments.filter(d => d.status === "approved").length;
            const docProgress = docsCount > 0 ? (approvedDocs / docsCount) * 100 : 0;

            return (
              <Card key={person.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Main row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : person.id)}
                  >
                    {/* Stage indicator */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stageCfg.bgColor}`}>
                      <StageIcon className={`w-5 h-5 ${stageCfg.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{person.name}</p>
                        <Badge variant="outline" className={`text-xs ${stageCfg.color}`}>
                          {stageCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{person.email}</span>
                        {person.providerServices && person.providerServices.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {person.providerServices.length} service(s)
                          </Badge>
                        ) : person.serviceCategories.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {person.serviceCategories.length} catégorie(s)
                          </Badge>
                        ) : person.stage !== "candidature" ? (
                          <Badge variant="destructive" className="text-xs">
                            ⚠ Aucun service
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Doc progress mini */}
                    {docsCount > 0 && (
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <Progress value={docProgress} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {approvedDocs}/{docsCount}
                        </span>
                      </div>
                    )}

                    {pendingDocs > 0 && (
                      <Badge variant="secondary" className="hidden sm:flex">
                        {pendingDocs} en attente
                      </Badge>
                    )}

                    {/* Actions rapides */}
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {person.stage === "candidature" && person.application?.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApproveApplication(person)} className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Approuver
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectApplication(person)}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {person.stage === "onboarding" && person.provider && (
                        <Button size="sm" variant="outline" onClick={() => handleActivateProvider(person)} className="gap-1">
                          <UserCheck className="w-3 h-3" /> Activer
                        </Button>
                      )}
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/10">
                      {/* Pipeline steps visual */}
                      <div className="flex items-center gap-1">
                        {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((s, i) => {
                          const isCurrent = s === person.stage;
                          const isPast = (Object.keys(STAGE_CONFIG) as PipelineStage[]).indexOf(person.stage) > i;
                          return (
                            <div key={s} className="flex items-center gap-1 flex-1">
                              <div className={`h-2 flex-1 rounded-full ${isPast || isCurrent ? "bg-primary" : "bg-muted"}`} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map(s => (
                          <span key={s} className={s === person.stage ? "text-primary font-medium" : ""}>
                            {STAGE_CONFIG[s].label}
                          </span>
                        ))}
                      </div>

                      {/* Info grille */}
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Téléphone:</span>
                          <p className="font-medium">{person.phone || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ville:</span>
                          <p className="font-medium">{person.city || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inscription:</span>
                          <p className="font-medium">{new Date(person.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>

                      {/* Application details */}
                      {person.application && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Catégories:</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {person.application.service_categories?.map((cat: string) => (
                              <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                            ))}
                            {!person.application.service_categories?.length && (
                              <Badge variant="outline" className="text-xs">{person.application.category}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Services actifs du prestataire */}
                      {person.providerServices && person.providerServices.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground font-medium">Services actifs ({person.providerServices.length}) :</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {person.providerServices.map((name: string) => (
                              <Badge key={name} className="text-xs bg-primary/10 text-primary border-primary/20">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {person.provider && (!person.providerServices || person.providerServices.length === 0) && (
                        <div className="text-sm">
                          <span className="text-destructive font-medium">⚠ Aucun service sélectionné par le prestataire</span>
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Documents ({approvedDocs}/{docsCount} validés)
                        </h4>
                        <div className="space-y-2">
                          {person.allDocuments.map((doc) => {
                            const DocIcon = DOC_ICONS[doc.type] || FileText;
                            return (
                              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="p-1.5 rounded bg-primary/10">
                                    <DocIcon className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm">{doc.label}</p>
                                    <div className="flex items-center gap-2">
                                      {doc.source === "provider" && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">espace presta</span>
                                      )}
                                      {doc.source === "application" && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">candidature</span>
                                      )}
                                      {doc.fileName && (
                                        <span className="text-xs text-muted-foreground truncate">{doc.fileName}</span>
                                      )}
                                    </div>
                                    {doc.rejectionReason && (
                                      <p className="text-xs text-destructive mt-1">Rejet: {doc.rejectionReason}</p>
                                    )}
                                    {doc.value && <p className="text-xs text-muted-foreground">{doc.value}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {getStatusBadge(doc.status)}
                                  {doc.url && (
                                    <Button size="sm" variant="ghost" onClick={() => viewDocument(doc.url!, doc.source)}>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {doc.status === "pending" && doc.url && (
                                    <>
                                      <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700" onClick={() => handleApproveDoc(doc, person)}>
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setRejectDialog({
                                          docId: doc.id,
                                          source: doc.source,
                                          applicationId: person.application?.id,
                                        })}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {person.allDocuments.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucun document soumis</p>
                          )}
                        </div>
                      </div>

                      {/* Onboarding progress if provider exists */}
                      {person.provider && person.stage === "onboarding" && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            Progression onboarding
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {[
                              { label: "Documents soumis", done: person.provider.documents_submitted },
                              { label: "Mandat signé", done: person.provider.mandat_facturation_accepte },
                              { label: "Formation complétée", done: person.provider.formation_completed },
                              { label: "Identité vérifiée", done: person.provider.identity_verified },
                            ].map((step) => (
                              <div key={step.label} className={`flex items-center gap-2 p-2 rounded border text-sm ${step.done ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-muted/30"}`}>
                                {step.done ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                                <span className={step.done ? "text-emerald-700 dark:text-emerald-300" : ""}>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectionReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le document</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Raison du rejet (obligatoire)..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectionReason(""); }}>Annuler</Button>
            <Button variant="destructive" onClick={handleRejectDoc} disabled={!rejectionReason.trim()}>
              <XCircle className="w-4 h-4 mr-1" /> Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">Validé</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="text-xs">Rejeté</Badge>;
    case "missing":
      return <Badge variant="outline" className="text-xs text-muted-foreground">Manquant</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">En attente</Badge>;
  }
}

export default UnifiedProviderPipeline;
