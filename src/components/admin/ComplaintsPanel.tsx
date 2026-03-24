import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquareWarning, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  client_id: string;
  provider_id: string | null;
  booking_id: string | null;
  title: string;
  description: string;
  complaint_type: string;
  priority: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

export const ComplaintsPanel = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});

  useEffect(() => { loadComplaints(); }, []);

  const loadComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { console.error(error); toast.error("Erreur chargement réclamations"); }
    else setComplaints(data || []);
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNote[id] || "Résolu par l'admin",
      })
      .eq("id", id);
    if (error) toast.error("Erreur résolution");
    else { toast.success("Réclamation résolue"); loadComplaints(); }
  };

  const getPriorityVariant = (priority: string) => {
    if (priority === "urgent" || priority === "high") return "destructive" as const;
    if (priority === "medium") return "default" as const;
    return "secondary" as const;
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  const openComplaints = complaints.filter(c => c.status !== "resolved");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-destructive" />
            Réclamations en cours ({openComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openComplaints.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucune réclamation en cours</p>
          ) : (
            <div className="space-y-4">
              {openComplaints.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{c.title}</h4>
                        <Badge variant={getPriorityVariant(c.priority)}>{c.priority}</Badge>
                        <Badge variant="outline">{c.complaint_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(c.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Notes de résolution..."
                      value={resolutionNote[c.id] || ""}
                      onChange={(e) => setResolutionNote(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="flex-1 h-16"
                    />
                    <Button size="sm" onClick={() => handleResolve(c.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Résoudre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {resolvedComplaints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Réclamations résolues ({resolvedComplaints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedComplaints.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.resolution_notes}</p>
                  </div>
                  <Badge variant="outline">Résolu</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
