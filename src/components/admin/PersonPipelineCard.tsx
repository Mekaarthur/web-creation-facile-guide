import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText, Clock, CheckCircle, XCircle, UserCheck, ExternalLink,
  ChevronDown, ChevronUp, User, Shield, Building, CreditCard, Award,
} from 'lucide-react';

export type PipelineStage = 'candidature' | 'documents' | 'onboarding' | 'actif';

export interface DocumentItem {
  id: string;
  source: 'application' | 'provider';
  type: string;
  label: string;
  url: string | null;
  value?: string;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  fileName?: string;
  createdAt?: string;
}

export interface UnifiedPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  stage: PipelineStage;
  createdAt: string;
  application?: any;
  provider?: any;
  allDocuments: DocumentItem[];
  servicesCount: number;
  serviceCategories: string[];
  providerServices?: string[];
}

export interface RejectDialogState {
  docId: string;
  source: string;
  applicationId?: string;
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bgColor: string; icon: any }> = {
  candidature: { label: 'Candidature',     color: 'text-blue-600',    bgColor: 'bg-blue-50 dark:bg-blue-950/30',     icon: Clock },
  documents:   { label: 'Validation docs', color: 'text-purple-600',  bgColor: 'bg-purple-50 dark:bg-purple-950/30', icon: FileText },
  onboarding:  { label: 'Onboarding',      color: 'text-amber-600',   bgColor: 'bg-amber-50 dark:bg-amber-950/30',   icon: UserCheck },
  actif:       { label: 'Actif',           color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', icon: CheckCircle },
};

const DOC_ICONS: Record<string, any> = {
  identity_document: User, criminal_record: Shield,
  siret_document: Building, siren: Building,
  rib_iban: CreditCard, cv: FileText,
  certification: Award, certifications: Award, insurance: Shield,
};

const REQUIRED_APPLICATION_DOCUMENT_TYPES = ['identity_document', 'siret_document', 'rib_iban', 'certifications'];

interface Props {
  person: UnifiedPerson;
  isExpanded: boolean;
  onToggle: () => void;
  onApproveApp: (person: UnifiedPerson) => void;
  onRejectApp: (person: UnifiedPerson) => void;
  onActivate: (person: UnifiedPerson) => void;
  onApproveDoc: (doc: DocumentItem, person: UnifiedPerson) => void;
  onOpenRejectDialog: (state: RejectDialogState) => void;
  onViewDoc: (url: string, source: string) => void;
}

export function PersonPipelineCard({ person, isExpanded, onToggle, onApproveApp, onRejectApp, onActivate, onApproveDoc, onOpenRejectDialog, onViewDoc }: Props) {
  const stageCfg   = STAGE_CONFIG[person.stage];
  const StageIcon  = stageCfg.icon;
  const docsCount  = person.allDocuments.length;
  const pendingDocs  = person.allDocuments.filter(d => d.status === 'pending').length;
  const approvedDocs = person.allDocuments.filter(d => d.status === 'approved').length;
  const docProgress  = docsCount > 0 ? (approvedDocs / docsCount) * 100 : 0;

  const allRequiredAppDocsApproved = (() => {
    const appDocs = person.allDocuments.filter(d => d.source === 'application');
    return REQUIRED_APPLICATION_DOCUMENT_TYPES.every(type => appDocs.some(doc => doc.type === type && doc.status === 'approved'));
  })();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stageCfg.bgColor}`}>
            <StageIcon className={`w-5 h-5 ${stageCfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground truncate">{person.name}</p>
              <Badge variant="outline" className={`text-xs ${stageCfg.color}`}>{stageCfg.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{person.email}</span>
              {person.providerServices && person.providerServices.length > 0 ? (
                <Badge variant="outline" className="text-xs">{person.providerServices.length} service(s)</Badge>
              ) : person.serviceCategories.length > 0 ? (
                <Badge variant="outline" className="text-xs">{person.serviceCategories.length} catégorie(s)</Badge>
              ) : person.stage !== 'candidature' ? (
                <Badge variant="destructive" className="text-xs">⚠ Aucun service</Badge>
              ) : null}
            </div>
          </div>

          {docsCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 w-32">
              <Progress value={docProgress} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{approvedDocs}/{docsCount}</span>
            </div>
          )}
          {pendingDocs > 0 && <Badge variant="secondary" className="hidden sm:flex">{pendingDocs} en attente</Badge>}

          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {person.stage === 'candidature' && person.application?.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onApproveApp(person)} className="gap-1">
                  <CheckCircle className="w-3 h-3" /> Approuver
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRejectApp(person)}>
                  <XCircle className="w-3 h-3" />
                </Button>
              </>
            )}
            {person.stage === 'documents' && person.application && !person.provider && allRequiredAppDocsApproved && (
              <Button size="sm" onClick={() => onApproveApp(person)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-3 h-3" /> Approuver & Créer prestataire
              </Button>
            )}
            {person.stage === 'onboarding' && person.provider && (
              <Button size="sm" variant="outline" onClick={() => onActivate(person)} className="gap-1">
                <UserCheck className="w-3 h-3" /> Activer
              </Button>
            )}
          </div>

          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>

        {/* Expanded panel */}
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/10">
            {/* Pipeline progress bar */}
            <div className="flex items-center gap-1">
              {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((s, i) => {
                const isPast = (Object.keys(STAGE_CONFIG) as PipelineStage[]).indexOf(person.stage) > i;
                const isCurrent = s === person.stage;
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`h-2 flex-1 rounded-full ${isPast || isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map(s => (
                <span key={s} className={s === person.stage ? 'text-primary font-medium' : ''}>{STAGE_CONFIG[s].label}</span>
              ))}
            </div>

            {/* Contact */}
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground">Téléphone:</span><p className="font-medium">{person.phone || '—'}</p></div>
              <div><span className="text-muted-foreground">Ville:</span><p className="font-medium">{person.city || '—'}</p></div>
              <div><span className="text-muted-foreground">Inscription:</span><p className="font-medium">{new Date(person.createdAt).toLocaleDateString('fr-FR')}</p></div>
            </div>

            {/* Service categories */}
            {person.application && (
              <div className="text-sm">
                <span className="text-muted-foreground">Catégories:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {person.application.service_categories?.length
                    ? person.application.service_categories.map((cat: string) => <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>)
                    : <Badge variant="outline" className="text-xs">{person.application.category}</Badge>
                  }
                </div>
              </div>
            )}

            {/* Documents */}
            {person.allDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Documents</p>
                <div className="space-y-2">
                  {person.allDocuments.map((doc) => {
                    const DocIcon = DOC_ICONS[doc.type] || FileText;
                    return (
                      <div key={`${doc.source}-${doc.id}`} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <DocIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{doc.label}</p>
                            {doc.rejectionReason && <p className="text-xs text-destructive truncate">Rejet: {doc.rejectionReason}</p>}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{doc.source === 'provider' ? 'Prestataire' : 'Candidature'}</Badge>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {doc.status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {doc.status === 'rejected' && <XCircle className="w-4 h-4 text-destructive" />}
                          {doc.status === 'pending'  && <Clock className="w-4 h-4 text-amber-500" />}
                          {doc.status === 'missing'  && <span className="text-xs text-muted-foreground">Manquant</span>}
                          {doc.url && (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onViewDoc(doc.url!, doc.source)}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          {doc.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600" onClick={() => onApproveDoc(doc, person)}>
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => onOpenRejectDialog({ docId: doc.id, source: doc.source, applicationId: doc.source === 'application' ? person.application?.id : undefined })}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Provider onboarding status */}
            {person.provider && (
              <div className="grid sm:grid-cols-3 gap-3 text-sm pt-2 border-t">
                {[
                  ['Mandat facturation', person.provider.mandat_facturation_accepte, 'Accepté', 'Non accepté'],
                  ['Formation', person.provider.formation_completed, 'Complétée', 'Non complétée'],
                  ['Identité', person.provider.identity_verified, 'Vérifiée', 'Non vérifiée'],
                ].map(([label, value, yes, no]) => (
                  <div key={label as string}>
                    <span className="text-muted-foreground">{label}:</span>
                    <p className={`font-medium ${value ? 'text-emerald-600' : 'text-muted-foreground'}`}>{value ? yes : no}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons in expanded view */}
            {person.stage === 'onboarding' && person.provider && (
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => onActivate(person)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <UserCheck className="w-3 h-3" /> Activer le prestataire
                </Button>
              </div>
            )}
            {person.stage === 'candidature' && person.application?.status === 'pending' && (
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onRejectApp(person)} className="gap-1">
                  <XCircle className="w-3 h-3" /> Rejeter
                </Button>
                <Button size="sm" onClick={() => onApproveApp(person)} className="gap-1">
                  <CheckCircle className="w-3 h-3" /> Approuver candidature
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
