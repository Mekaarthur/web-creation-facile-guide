import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  RefreshCw,
  Search,
  TrendingUp,
  Ban,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function fetchDeclarations(statusFilter: string): Promise<any[]> {
  let query = supabase
    .from("urssaf_declarations")
    .select("*")
    .order("created_at", { ascending: false });
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchIncidents(): Promise<any[]> {
  const { data } = await supabase
    .from("urssaf_declarations")
    .select(`
      *,
      bookings (
        booking_date, start_time, end_time, total_price, address,
        services ( name )
      )
    `)
    .in("status", ["rejected", "error", "pending"])
    .order("created_at", { ascending: false });
  return data || [];
}

interface FinancialStats {
  totalDeclared: number;
  totalStateAmount: number;
  totalClientAmount: number;
  monthlyCount: number;
}

const DEFAULT_FINANCIAL_STATS: FinancialStats = {
  totalDeclared: 0,
  totalStateAmount: 0,
  totalClientAmount: 0,
  monthlyCount: 0,
};

async function fetchFinancialStats(): Promise<FinancialStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("urssaf_declarations")
    .select("total_amount, client_amount, state_amount")
    .gte("created_at", startOfMonth.toISOString())
    .eq("status", "validated");
  if (!data) return DEFAULT_FINANCIAL_STATS;
  return {
    totalDeclared: data.reduce((s, d) => s + Number(d.total_amount), 0),
    totalStateAmount: data.reduce((s, d) => s + Number(d.state_amount), 0),
    totalClientAmount: data.reduce((s, d) => s + Number(d.client_amount), 0),
    monthlyCount: data.length,
  };
}

const getDeclarationStatusBadge = (status: string) => {
  const map: Record<string, { variant: any; label: string; icon: any }> = {
    created: { variant: "outline", label: "Créée", icon: Clock },
    sent: { variant: "secondary", label: "Envoyée", icon: Send },
    pending_client_validation: { variant: "outline", label: "Attente validation client", icon: Clock },
    validated: { variant: "default", label: "Validée", icon: CheckCircle },
    rejected: { variant: "destructive", label: "Rejetée", icon: XCircle },
    expired: { variant: "destructive", label: "Expirée (48h)", icon: Ban },
    retry: { variant: "secondary", label: "Relance", icon: RefreshCw },
    paid: { variant: "default", label: "Payée", icon: Euro },
    archived: { variant: "secondary", label: "Archivée", icon: CheckCircle },
    error: { variant: "destructive", label: "Erreur", icon: AlertTriangle },
  };
  const config = map[status] || { variant: "secondary", label: status, icon: Clock };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// Bloc 1 — Statut Habilitation
const HabilitationStatus = () => {
  const hasCredentials = false;
  const sapNumber = "SAP 880491436";
  const environment = "sandbox";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Statut de l'habilitation URSSAF
        </CardTitle>
        <CardDescription>État de la connexion API Avance Immédiate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Habilitation</p>
            {hasCredentials ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" /> Non configurée
              </Badge>
            )}
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Environnement</p>
            <Badge variant={environment as string === "production" ? "default" : "secondary"}>
              {(environment as string) === "production" ? "Production" : "Sandbox"}
            </Badge>
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">N° SAP</p>
            <p className="font-semibold text-sm">{sapNumber}</p>
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Expiration credentials</p>
            {hasCredentials ? (
              <p className="font-semibold text-sm">—</p>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-sm font-medium">Non configuré</span>
              </div>
            )}
          </div>
        </div>
        {!hasCredentials && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">API URSSAF non connectée</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les secrets URSSAF_API_URL, URSSAF_CLIENT_ID, URSSAF_CLIENT_SECRET et URSSAF_SIRET
                  doivent être configurés pour activer l'avance immédiate.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bloc 2 — Suivi des déclarations
const DeclarationsTracking = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: declarations = [], isLoading: loading } = useQuery<any[]>({
    queryKey: ['urssaf-declarations', statusFilter],
    queryFn: () => fetchDeclarations(statusFilter),
  });

  const filtered = declarations.filter(
    (d) =>
      !searchTerm ||
      d.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.urssaf_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Suivi des déclarations URSSAF
        </CardTitle>
        <CardDescription>{declarations.length} déclaration(s) enregistrée(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="created">Créée</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="pending_client_validation">Attente validation</SelectItem>
              <SelectItem value="validated">Validée</SelectItem>
              <SelectItem value="rejected">Rejetée</SelectItem>
              <SelectItem value="expired">Expirée</SelectItem>
              <SelectItem value="retry">Relance</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="archived">Archivée</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Euro className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune déclaration trouvée</p>
            <p className="text-xs mt-1">Les déclarations apparaîtront ici après activation de l'API URSSAF</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Montant total</th>
                  <th className="pb-2 font-medium">Part client</th>
                  <th className="pb-2 font-medium">Part État</th>
                  <th className="pb-2 font-medium">Référence</th>
                  <th className="pb-2 font-medium">Deadline 48h</th>
                  <th className="pb-2 font-medium">Tentatives</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const deadlineDate = d.client_validation_deadline ? new Date(d.client_validation_deadline) : null;
                  const isUrgent = deadlineDate && deadlineDate.getTime() - Date.now() < 12 * 60 * 60 * 1000 && deadlineDate.getTime() > Date.now();
                  const isExpiredDeadline = deadlineDate && deadlineDate.getTime() < Date.now();

                  return (
                    <tr key={d.id} className={`border-b last:border-0 hover:bg-muted/30 ${isUrgent ? 'bg-amber-50' : ''} ${isExpiredDeadline && d.status !== 'expired' ? 'bg-red-50' : ''}`}>
                      <td className="py-2">{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="py-2">
                        <div>{d.client_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{d.client_email}</div>
                      </td>
                      <td className="py-2 font-medium">{Number(d.total_amount).toFixed(2)}€</td>
                      <td className="py-2">{Number(d.client_amount).toFixed(2)}€</td>
                      <td className="py-2 text-green-600">{Number(d.state_amount).toFixed(2)}€</td>
                      <td className="py-2 font-mono text-xs">{d.urssaf_reference || "—"}</td>
                      <td className="py-2 text-xs">
                        {deadlineDate ? (
                          <span className={isExpiredDeadline ? 'text-red-600 font-semibold' : isUrgent ? 'text-amber-600 font-semibold' : ''}>
                            {deadlineDate.toLocaleString("fr-FR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {isUrgent && ' ⚠️'}
                            {isExpiredDeadline && ' ❌'}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-xs">{d.retry_count ?? 0}/3</td>
                      <td className="py-2">{getDeclarationStatusBadge(d.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bloc 3 — Monitoring incidents
const IncidentsMonitoring = () => {
  const qc = useQueryClient();
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: incidents = [] } = useQuery<any[]>({
    queryKey: ['urssaf-incidents'],
    queryFn: fetchIncidents,
  });

  const handleRetry = async (inc: any) => {
    setRetrying(inc.id);
    try {
      await supabase
        .from("urssaf_declarations")
        .update({
          status: "sent",
          retry_count: (inc.retry_count || 0) + 1,
          client_validation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", inc.id);

      const booking = inc.bookings;
      if (booking) {
        const { error } = await supabase.functions.invoke("urssaf-register-service", {
          body: {
            bookingId: inc.booking_id,
            providerId: inc.provider_id,
            clientInfo: {
              email: inc.client_email,
              firstName: inc.client_name?.split(" ")[0] || "",
              lastName: inc.client_name?.split(" ").slice(1).join(" ") || "",
            },
            services: [{
              serviceName: booking.services?.name || "Prestation",
              price: booking.total_price || 0,
              quantity: 1,
              customBooking: {
                date: booking.booking_date,
                startTime: booking.start_time,
                endTime: booking.end_time,
              },
            }],
            totalAmount: inc.total_amount,
            clientAmount: inc.client_amount,
            stateAmount: inc.state_amount,
          },
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "API URSSAF non disponible",
            description: "La déclaration est marquée 'sent' mais l'API n'a pas répondu. Vérifiez la configuration des credentials.",
          });
        } else {
          toast({ title: "Déclaration renvoyée", description: `Relance ${(inc.retry_count || 0) + 1}/3 effectuée.` });
        }
      } else {
        toast({
          title: "Statut mis à jour",
          description: "Déclaration marquée comme renvoyée (réservation introuvable pour l'appel API).",
        });
      }

      qc.invalidateQueries({ queryKey: ['urssaf-incidents'] });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de relancer la déclaration." });
    } finally {
      setRetrying(null);
    }
  };

  const handleCancel = async (id: string) => {
    await supabase
      .from("urssaf_declarations")
      .update({ status: "archived" })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ['urssaf-incidents'] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Incidents de déclaration
        </CardTitle>
        <CardDescription>{incidents.length} incident(s) à traiter</CardDescription>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Aucun incident en cours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={inc.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                      {inc.status === "rejected" ? "Rejeté" : inc.status === "pending" ? "En attente" : "Erreur"}
                    </Badge>
                    <span className="text-sm font-medium">{inc.client_name || inc.client_email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inc.error_code && <span className="font-mono mr-2">[{inc.error_code}]</span>}
                    {inc.error_message || inc.rejection_reason || "En attente de soumission à l'URSSAF"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tentatives: {inc.retry_count || 0}/3 • {new Date(inc.created_at).toLocaleDateString("fr-FR")}
                    {inc.total_amount && ` • ${Number(inc.total_amount).toFixed(2)}€`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(inc)}
                    disabled={retrying === inc.id || (inc.retry_count || 0) >= 3}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${retrying === inc.id ? "animate-spin" : ""}`} />
                    {retrying === inc.id ? "Envoi..." : "Renvoyer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleCancel(inc.id)}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    Archiver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bloc 4 — Vue financière
const FinancialOverview = () => {
  const { data: stats = DEFAULT_FINANCIAL_STATS } = useQuery<FinancialStats>({
    queryKey: ['urssaf-financial-overview'],
    queryFn: fetchFinancialStats,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Vue financière — Avance Immédiate
        </CardTitle>
        <CardDescription>Données du mois en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{stats.monthlyCount}</p>
            <p className="text-xs text-muted-foreground">Déclarations validées</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalDeclared.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground">Total déclaré</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalStateAmount.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground">Versé par URSSAF</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.totalClientAmount.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground">Reste à charge clients</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Page principale
const AdminAvanceImmediate = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Avance Immédiate URSSAF</h1>
        <p className="text-muted-foreground text-sm">
          Suivi des déclarations, habilitation API et monitoring financier
        </p>
      </div>

      <HabilitationStatus />

      <Tabs defaultValue="declarations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="declarations">Déclarations</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="finance">Vue financière</TabsTrigger>
        </TabsList>
        <TabsContent value="declarations" className="mt-4">
          <DeclarationsTracking />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <IncidentsMonitoring />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinancialOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAvanceImmediate;
