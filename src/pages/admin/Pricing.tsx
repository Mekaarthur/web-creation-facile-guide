import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Euro, Save, History, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { universeServices, calculateProviderPrice } from "@/utils/universeServices";

interface DbPrice {
  service_slug: string;
  client_price: number;
  updated_at: string;
}

interface AuditEntry {
  id: string;
  service_slug: string;
  service_name: string;
  universe_id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
  reason: string | null;
  admin_name: string;
}

interface EditState {
  slug: string;
  universeName: string;
  universeId: string;
  serviceName: string;
  currentPrice: number;
  newPrice: string;
}

const formatPrice = (p: number | string) =>
  typeof p === "number" ? `${p.toFixed(2)} €` : p;

const diffBadge = (old_: number, new_: number) => {
  const diff = new_ - old_;
  if (diff === 0) return <Badge variant="secondary"><Minus className="w-3 h-3 mr-1" />Inchangé</Badge>;
  if (diff > 0)
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <TrendingUp className="w-3 h-3 mr-1" />+{diff.toFixed(2)} €
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200">
      <TrendingDown className="w-3 h-3 mr-1" />{diff.toFixed(2)} €
    </Badge>
  );
};

async function fetchDbPrices(): Promise<Record<string, DbPrice>> {
  const { data, error } = await supabase
    .from("service_pricing" as any)
    .select("service_slug, client_price, updated_at");
  if (error) throw error;
  const map: Record<string, DbPrice> = {};
  (data || []).forEach((row: any) => { map[row.service_slug] = row; });
  return map;
}

async function fetchAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase.functions.invoke("admin-pricing", {
    body: { action: "get_audit_log", limit: 100 },
  });
  if (error) throw error;
  if (data?.success) return data.logs;
  return [];
}

const AdminPricing = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("prices");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editReason, setEditReason] = useState("");

  const { data: dbPrices = {}, isLoading: loadingPrices, refetch: refetchPrices } = useQuery<Record<string, DbPrice>>({
    queryKey: ['admin-pricing'],
    queryFn: fetchDbPrices,
  });

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery<AuditEntry[]>({
    queryKey: ['admin-pricing-audit'],
    queryFn: fetchAuditLog,
    enabled: activeTab === 'history',
  });

  const openEdit = (
    slug: string,
    universeId: string,
    universeName: string,
    serviceName: string,
    currentPrice: number | string,
  ) => {
    const price = typeof currentPrice === "number" ? currentPrice : 0;
    setEditState({ slug, universeId, universeName, serviceName, currentPrice: price, newPrice: String(price) });
    setEditReason("");
  };

  const savePrice = async () => {
    if (!editState) return;
    const newPrice = parseFloat(editState.newPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({ title: "Prix invalide", description: "Entrez un nombre positif", variant: "destructive" });
      return;
    }
    setSaving(editState.slug);
    try {
      const { data, error } = await supabase.functions.invoke("admin-pricing", {
        body: {
          action: "update",
          serviceSlug: editState.slug,
          universeId: editState.universeId,
          serviceName: editState.serviceName,
          newPrice,
          reason: editReason || null,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur inconnue");
      toast({ title: "Prix mis à jour", description: `${editState.serviceName} : ${newPrice.toFixed(2)} €/h` });
      setEditState(null);
      qc.invalidateQueries({ queryKey: ['admin-pricing'] });
      qc.invalidateQueries({ queryKey: ['admin-pricing-audit'] });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const hasOverride = (slug: string) => !!dbPrices[slug];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des prix</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Modifiez les prix à la demande — le prestataire reçoit toujours 72 % du prix client
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchPrices()} disabled={loadingPrices}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prices">
            <Euro className="w-4 h-4 mr-2" />Prix des services
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />Historique des modifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4 mt-4">
          {universeServices.map((universe) => {
            const isOpen = expanded[universe.id] !== false;
            const modifiedCount = universe.subServices.filter((s) => hasOverride(s.id)).length;

            return (
              <Card key={universe.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors pb-3"
                  onClick={() => setExpanded((p) => ({ ...p, [universe.id]: !isOpen }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOpen
                        ? <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      }
                      <div>
                        <CardTitle className="text-lg">{universe.name}</CardTitle>
                        <p className="text-sm text-muted-foreground font-normal">
                          {universe.description} — {universe.subServices.length} services
                        </p>
                      </div>
                    </div>
                    {modifiedCount > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {modifiedCount} prix personnalisé{modifiedCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0">
                    <div className="divide-y divide-border/50">
                      <div className="hidden md:grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <span>Service</span>
                        <span className="text-center">Prix par défaut</span>
                        <span className="text-center">Prix actuel</span>
                        <span className="text-center">Part prestataire</span>
                        <span className="text-center">Action</span>
                      </div>

                      {universe.subServices.map((service) => {
                        const staticPrice = service.clientPrice;
                        const dbPrice = dbPrices[service.id]?.client_price;
                        const activePrice = dbPrice ?? (typeof staticPrice === "number" ? staticPrice : null);
                        const overridden = hasOverride(service.id);
                        const isSaving = saving === service.id;

                        return (
                          <div
                            key={service.id}
                            className="py-3 grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px_100px] gap-3 md:gap-4 items-center"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm truncate">{service.name}</span>
                              {overridden && (
                                <Badge variant="outline" className="text-[10px] flex-shrink-0 border-primary/40 text-primary">
                                  Modifié
                                </Badge>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-sm text-muted-foreground">{formatPrice(staticPrice)}</span>
                            </div>
                            <div className="text-center">
                              {activePrice !== null ? (
                                <span className={`text-sm font-semibold ${overridden ? "text-primary" : ""}`}>
                                  {activePrice.toFixed(2)} €
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">Sur devis</span>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-sm text-muted-foreground">
                                {activePrice !== null
                                  ? `${calculateProviderPrice(activePrice).toFixed(2)} €`
                                  : "—"}
                              </span>
                            </div>
                            <div className="text-center">
                              <Button
                                size="sm"
                                variant={overridden ? "default" : "outline"}
                                className="h-8 text-xs"
                                disabled={isSaving || staticPrice === "Sur devis"}
                                onClick={() =>
                                  openEdit(service.id, universe.id, universe.name, service.name, activePrice ?? staticPrice)
                                }
                              >
                                {isSaving ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Euro className="w-3 h-3 mr-1" />
                                    Modifier
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                Journal des modifications de prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune modification enregistrée</p>
                  <p className="text-xs mt-1">Les changements de prix apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_140px_120px] gap-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                    <span>Service</span>
                    <span className="text-center">Ancien</span>
                    <span className="text-center">Nouveau</span>
                    <span className="text-center">Variation</span>
                    <span>Admin</span>
                    <span>Date</span>
                  </div>
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_140px_120px] gap-2 md:gap-3 items-center py-3 border-b border-border/30 hover:bg-muted/20 rounded-lg px-2 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{log.service_name}</p>
                        <p className="text-xs text-muted-foreground">{log.universe_id.replace("bika_", "Bika ").replace(/^\w/, c => c.toUpperCase())}</p>
                        {log.reason && (
                          <p className="text-xs italic text-muted-foreground mt-0.5">« {log.reason} »</p>
                        )}
                      </div>
                      <div className="text-center text-sm line-through text-muted-foreground">{log.old_price.toFixed(2)} €</div>
                      <div className="text-center text-sm font-semibold">{log.new_price.toFixed(2)} €</div>
                      <div className="text-center">{diffBadge(log.old_price, log.new_price)}</div>
                      <div className="text-sm text-muted-foreground">{log.admin_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.changed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        <br />
                        {new Date(log.changed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editState} onOpenChange={(o) => !o && setEditState(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>

          {editState && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <p className="font-semibold">{editState.serviceName}</p>
                <p className="text-sm text-muted-foreground">{editState.universeName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/20 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-1">Prix actuel</p>
                  <p className="font-bold text-lg">{editState.currentPrice.toFixed(2)} €</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/20">
                  <p className="text-muted-foreground text-xs mb-1">Nouveau prix</p>
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editState.newPrice}
                      onChange={(e) => setEditState((s) => s ? { ...s, newPrice: e.target.value } : s)}
                      className="w-20 text-center font-bold border-primary/30 h-8 text-base"
                    />
                    <span className="text-muted-foreground font-medium">€</span>
                  </div>
                </div>
              </div>

              {editState.newPrice && !isNaN(parseFloat(editState.newPrice)) && (
                <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span>Part prestataire (72 %) :</span>
                    <span className="font-medium">{calculateProviderPrice(parseFloat(editState.newPrice)).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Variation :</span>
                    <span className={parseFloat(editState.newPrice) > editState.currentPrice ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                      {(parseFloat(editState.newPrice) - editState.currentPrice) >= 0 ? "+" : ""}
                      {(parseFloat(editState.newPrice) - editState.currentPrice).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Raison du changement <span className="text-muted-foreground font-normal">(optionnel)</span>
                </label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ex : Hausse des coûts prestataires, ajustement concurrentiel..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Ce changement sera effectif immédiatement sur tous les formulaires de réservation et enregistré dans le journal d'audit.</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState(null)}>Annuler</Button>
            <Button
              onClick={savePrice}
              disabled={!!saving || !editState?.newPrice || isNaN(parseFloat(editState?.newPrice || ""))}
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sauvegarde…</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Confirmer le changement</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPricing;
