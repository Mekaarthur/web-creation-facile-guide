import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  reported_by: string | null;
  booking_id: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export const IncidentsPanel = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
    const channel = supabase
      .channel("admin-incidents")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incidents" }, (payload) => {
        toast.error("🚨 Nouvel incident signalé!", { description: (payload.new as Incident).description, duration: 8000 });
        loadIncidents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadIncidents = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .in("status", ["open", "investigating"])
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement incidents"); }
    else setIncidents(data || []);
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from("incidents")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Erreur résolution");
    else { toast.success("Incident résolu"); loadIncidents(); }
  };

  const getSeverityVariant = (severity: string) => {
    if (severity === "critical") return "destructive" as const;
    if (severity === "high") return "destructive" as const;
    return "secondary" as const;
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Incidents Signalés par les Prestataires ({incidents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Aucun incident en cours</p>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityVariant(incident.severity)}>
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{incident.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(incident.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm">{incident.description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleResolve(incident.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Résoudre
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
