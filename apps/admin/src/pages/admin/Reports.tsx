import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Flag, Eye, CheckCircle, XCircle, Clock, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  // Réclamations clients (table complaints)
  const { data: complaints = [], isLoading: loadingComplaints } = useQuery({
    queryKey: ['admin-complaints-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  // Signalements de contenu (table content_reports)
  const { data: contentReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['admin-content-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    }
  });

  const resolveComplaint = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || 'Résolu par l\'admin',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Réclamation résolue");
      queryClient.invalidateQueries({ queryKey: ['admin-complaints-reports'] });
    },
    onError: () => toast.error("Erreur lors de la résolution"),
  });

  const resolveContentReport = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || 'Résolu par l\'admin',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signalement résolu");
      queryClient.invalidateQueries({ queryKey: ['admin-content-reports'] });
    },
    onError: () => toast.error("Erreur lors de la résolution"),
  });

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      urgent: { label: "Urgent", variant: "destructive" },
      high: { label: "Haute", variant: "destructive" },
      medium: { label: "Moyenne", variant: "default" },
      low: { label: "Faible", variant: "secondary" },
      normal: { label: "Normal", variant: "secondary" },
    };
    const c = config[priority] || { label: priority, variant: "outline" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      open: { label: "Ouvert", variant: "destructive" },
      pending: { label: "En attente", variant: "outline" },
      reviewing: { label: "En cours", variant: "secondary" },
      in_progress: { label: "En cours", variant: "secondary" },
      resolved: { label: "Résolu", variant: "default" },
      dismissed: { label: "Rejeté", variant: "outline" },
    };
    const c = config[status] || { label: status, variant: "secondary" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const openComplaints = complaints.filter(c => c.status !== 'resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
  const openContentReports = contentReports.filter(r => r.status !== 'resolved');
  const resolvedContentReports = contentReports.filter(r => r.status === 'resolved');

  const totalOpen = openComplaints.length + openContentReports.length;
  const totalUrgent = complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length;

  const isLoading = loadingComplaints || loadingReports;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Signalements & Réclamations</h1>
        <p className="text-muted-foreground">Vue unifiée des réclamations clients et signalements de contenu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ouvert</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réclamations</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openComplaints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signalements contenu</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openContentReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUrgent}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="complaints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="complaints">
              Réclamations ({openComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="content">
              Signalements ({openContentReports.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Résolus ({resolvedComplaints.length + resolvedContentReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-4">
            {openComplaints.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune réclamation en cours</p>
                </CardContent>
              </Card>
            ) : (
              openComplaints.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{c.title}</CardTitle>
                          {getPriorityBadge(c.priority)}
                          <Badge variant="outline">{c.complaint_type}</Badge>
                        </div>
                        <CardDescription>{c.description}</CardDescription>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(c.created_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 items-end">
                      <Textarea
                        placeholder="Notes de résolution..."
                        value={resolutionNotes[c.id] || ""}
                        onChange={(e) => setResolutionNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="flex-1 h-16"
                      />
                      <Button
                        size="sm"
                        onClick={() => resolveComplaint.mutate({ id: c.id, notes: resolutionNotes[c.id] || "" })}
                        disabled={resolveComplaint.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Résoudre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {openContentReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun signalement en cours</p>
                </CardContent>
              </Card>
            ) : (
              openContentReports.map((r) => (
                <Card key={r.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{r.report_reason}</CardTitle>
                          <Badge variant="outline">{r.report_category}</Badge>
                        </div>
                        <CardDescription>
                          {r.additional_details || 'Pas de détails supplémentaires'}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(r.created_at), 'PPp', { locale: fr })}
                          {' • '}Type: {r.reported_content_type}
                        </p>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 items-end">
                      <Textarea
                        placeholder="Notes de résolution..."
                        value={resolutionNotes[r.id] || ""}
                        onChange={(e) => setResolutionNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="flex-1 h-16"
                      />
                      <Button
                        size="sm"
                        onClick={() => resolveContentReport.mutate({ id: r.id, notes: resolutionNotes[r.id] || "" })}
                        disabled={resolveContentReport.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Résoudre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {[...resolvedComplaints, ...resolvedContentReports]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 20)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg opacity-70">
                  <div>
                    <p className="font-medium text-sm">
                      {'title' in item ? item.title : ('report_reason' in item ? (item as any).report_reason : 'Signalement')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.resolution_notes || 'Résolu'}
                      {' • '}{format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant="outline">Résolu</Badge>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminReports;
