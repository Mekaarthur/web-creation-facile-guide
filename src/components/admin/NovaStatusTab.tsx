import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, AlertTriangle, Shield, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProviderNova {
  id: string;
  business_name: string | null;
  nova_status: string | null;
  nova_validated_at: string | null;
  nova_expires_at: string | null;
  status: string | null;
}

const QUERY_KEY = ['admin-nova-status'] as const;

const NovaStatusTab = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: providers = [], isLoading: loading } = useQuery<ProviderNova[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, business_name, nova_status, nova_validated_at, nova_expires_at, status")
        .order("business_name");
      if (error) throw error;
      const now = new Date();
      return (data || []).map((p: any) => ({
        ...p,
        nova_status: p.nova_status === "validated" && p.nova_expires_at && new Date(p.nova_expires_at) < now
          ? "expired"
          : p.nova_status,
      }));
    },
  });

  const stats = useMemo(() => ({
    validated: providers.filter(p => p.nova_status === "validated").length,
    pending:   providers.filter(p => p.nova_status === "pending").length,
    expired:   providers.filter(p => p.nova_status === "expired").length,
    missing:   providers.filter(p => !p.nova_status || p.nova_status === "missing").length,
  }), [providers]);

  const handleUpdateStatus = async (providerId: string, newStatus: string) => {
    const updates: any = { nova_status: newStatus };
    if (newStatus === "validated") {
      updates.nova_validated_at = new Date().toISOString();
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      updates.nova_expires_at = exp.toISOString();
    }
    const { error } = await supabase.from("providers").update(updates).eq("id", providerId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut Nova mis à jour" }); qc.invalidateQueries({ queryKey: QUERY_KEY }); }
  };

  const filtered = filter === "all" ? providers : providers.filter(p => (p.nova_status || "missing") === filter);

  const getNovaIcon = (status: string | null) => {
    if (status === "validated") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "pending")   return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === "expired")   return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  };

  const getNovaLabel = (status: string | null) => {
    if (status === "validated") return "Validé ✅";
    if (status === "pending")   return "En attente ⏳";
    if (status === "expired")   return "Expiré ❌";
    return "Sans Nova";
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/60 rounded animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("validated")}>
          <CardContent className="p-4 text-center"><CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.validated}</p><p className="text-xs text-muted-foreground">Nova validé</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("pending")}>
          <CardContent className="p-4 text-center"><Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">En attente</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-destructive/30" onClick={() => setFilter("expired")}>
          <CardContent className="p-4 text-center"><XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" /><p className="text-2xl font-bold text-destructive">{stats.expired}</p><p className="text-xs text-muted-foreground">Expiré</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-300/50" onClick={() => setFilter("missing")}>
          <CardContent className="p-4 text-center"><AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold text-orange-600">{stats.missing}</p><p className="text-xs text-muted-foreground">Sans Nova</p></CardContent>
        </Card>
      </div>

      {filter !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Filtre: {getNovaLabel(filter)}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>Tout afficher</Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Détail par prestataire ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">Aucun prestataire dans cette catégorie</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    {getNovaIcon(p.nova_status)}
                    <div>
                      <p className="font-medium text-sm">{p.business_name || "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.nova_validated_at ? `Validé le ${new Date(p.nova_validated_at).toLocaleDateString("fr-FR")}` : "Jamais validé"}
                        {p.nova_expires_at && ` • Expire le ${new Date(p.nova_expires_at).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.nova_status === "validated" ? "default" : p.nova_status === "expired" ? "destructive" : "secondary"}>
                      {getNovaLabel(p.nova_status)}
                    </Badge>
                    {(p.nova_status === "pending" || p.nova_status === "expired") && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(p.id, "validated")}>
                        <CheckCircle className="h-3 w-3 mr-1" />Valider
                      </Button>
                    )}
                    {(!p.nova_status || p.nova_status === "missing") && (
                      <Button size="sm" variant="destructive" disabled><Ban className="h-3 w-3 mr-1" />Bloqué missions</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaStatusTab;
