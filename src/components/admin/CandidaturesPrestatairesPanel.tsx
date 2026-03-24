import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";

interface Candidature {
  id: string;
  provider_id: string;
  mission_assignment_id: string;
  response_type: string;
  response_time: string | null;
  created_at: string | null;
  provider?: { business_name: string; rating: number | null };
  mission?: { status: string; client_request_id: string };
}

export const CandidaturesPrestatairesPanel = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidatures();
  }, []);

  const loadCandidatures = async () => {
    const { data, error } = await supabase
      .from("candidatures_prestataires")
      .select(`
        *,
        provider:providers!provider_responses_provider_id_fkey(business_name, rating),
        mission:missions!provider_responses_mission_assignment_id_fkey(status, client_request_id)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { console.error(error); toast.error("Erreur chargement candidatures"); }
    else setCandidatures(data || []);
    setLoading(false);
  };

  const handleAccept = async (candidature: Candidature) => {
    try {
      // Update mission status
      await supabase
        .from("missions")
        .update({ status: "assigned", assigned_provider_id: candidature.provider_id })
        .eq("id", candidature.mission_assignment_id);

      toast.success("Candidature acceptée");
      loadCandidatures();
    } catch (error) {
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = async (candidature: Candidature) => {
    try {
      await supabase
        .from("candidatures_prestataires")
        .delete()
        .eq("id", candidature.id);

      toast.success("Candidature refusée");
      loadCandidatures();
    } catch (error) {
      toast.error("Erreur lors du refus");
    }
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case "accepted": return <Badge className="bg-primary/10 text-primary">Acceptée</Badge>;
      case "declined": return <Badge variant="destructive">Refusée</Badge>;
      default: return <Badge variant="secondary">En attente</Badge>;
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Candidatures Missions ({candidatures.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {candidatures.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Aucune candidature en attente</p>
        ) : (
          <div className="space-y-3">
            {candidatures.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.provider?.business_name || "Prestataire"}</p>
                    {getStatusBadge(c.response_type)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mission: {c.mission_assignment_id.slice(0, 8)}
                    {c.provider?.rating && <span> • ⭐ {c.provider.rating}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : "—"}
                  </p>
                </div>
                {c.response_type === "applied" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(c)}>
                      <UserCheck className="h-4 w-4 mr-1" /> Accepter
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(c)}>
                      <UserX className="h-4 w-4 mr-1" /> Refuser
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
