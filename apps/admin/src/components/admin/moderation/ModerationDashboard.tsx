import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, XCircle, Eye, Flag, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ContentReport {
  id: string;
  reported_by: string;
  reported_content_type: string;
  reported_content_id: string;
  report_reason: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  client: { first_name: string; last_name: string };
  provider: { business_name: string };
  created_at: string;
}

interface Complaint {
  id: string;
  client_id: string;
  provider_id: string | null;
  booking_id: string | null;
  complaint_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  response_time_hours: number | null;
  client: { first_name: string; last_name: string };
  provider: { business_name: string } | null;
}

interface ModerationData {
  stats: { openReports: number; pendingReviews: number; suspendedUsers: number; weeklyActions: number; openComplaints: number };
  reports: ContentReport[];
  reviews: Review[];
  complaints: Complaint[];
}

const QUERY_KEY = ['admin-moderation'] as const;

async function fetchModerationData(): Promise<ModerationData> {
  const { data: statsData } = await supabase.rpc('calculate_moderation_stats');
  const rawStats = (statsData && typeof statsData === 'object') ? (statsData as any) : {};

  let reports: ContentReport[] = [];
  try {
    const { data } = await supabase
      .from('content_reports')
      .select('*')
      .in('status', ['pending', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(20);
    reports = data || [];
  } catch (_) {}

  const [{ data: reviewsRaw }, { data: complaintsRaw }] = await Promise.all([
    supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('complaints')
      .select('*')
      .in('status', ['new', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  // Batch fetch — 2 requêtes au lieu de jusqu'à 80
  const allClientIds = [...new Set([
    ...(reviewsRaw  || []).map((r) => r.client_id),
    ...(complaintsRaw || []).map((c) => c.client_id),
  ].filter(Boolean))];

  const allProviderIds = [...new Set([
    ...(reviewsRaw  || []).map((r) => r.provider_id),
    ...(complaintsRaw || []).map((c) => c.provider_id),
  ].filter(Boolean))];

  const [profilesResult, providersResult] = await Promise.all([
    allClientIds.length  > 0
      ? supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', allClientIds)
      : Promise.resolve({ data: [] as { user_id: string; first_name: string; last_name: string }[] }),
    allProviderIds.length > 0
      ? supabase.from('providers').select('id, business_name').in('id', allProviderIds)
      : Promise.resolve({ data: [] as { id: string; business_name: string }[] }),
  ]);

  const profilesMap  = new Map((profilesResult.data  || []).map((p) => [p.user_id, p]));
  const providersMap = new Map((providersResult.data || []).map((p) => [p.id, p]));

  const reviews: Review[] = (reviewsRaw || []).map((review) => ({
    ...review,
    client:   profilesMap.get(review.client_id)     || { first_name: '', last_name: '' },
    provider: providersMap.get(review.provider_id)  || { business_name: '' },
  }));

  const complaints: Complaint[] = (complaintsRaw || []).map((complaint) => ({
    ...complaint,
    client:   profilesMap.get(complaint.client_id)                                        || { first_name: '', last_name: '' },
    provider: complaint.provider_id ? (providersMap.get(complaint.provider_id) ?? null) : null,
  }));

  return {
    stats: {
      openReports:    rawStats.open_reports    || 0,
      pendingReviews: rawStats.pending_reviews || 0,
      suspendedUsers: rawStats.suspended_users || 0,
      weeklyActions:  rawStats.weekly_actions  || 0,
      openComplaints: complaintsRaw?.length    || 0,
    },
    reports,
    reviews,
    complaints,
  };
}

export const ModerationDashboard = () => {
  const qc = useQueryClient();

  const { data, isLoading: loading } = useQuery<ModerationData>({
    queryKey: QUERY_KEY,
    queryFn: fetchModerationData,
  });

  const stats     = data?.stats     ?? { openReports: 0, pendingReviews: 0, suspendedUsers: 0, weeklyActions: 0, openComplaints: 0 };
  const reports   = data?.reports   ?? [];
  const reviews   = data?.reviews   ?? [];
  const complaints = data?.complaints ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  useEffect(() => {
    const channel = supabase
      .channel('moderation-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        qc.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', reviewId);
      if (error) throw error;
      toast.success('Avis approuvé');
      invalidate();
    } catch { toast.error("Erreur d'approbation"); }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      toast.success('Avis rejeté et supprimé');
      invalidate();
    } catch { toast.error('Erreur de rejet'); }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase.from('content_reports').update({ status: 'resolved' }).eq('id', reportId);
      if (error) throw error;
      toast.success('Signalement résolu');
      invalidate();
    } catch { toast.error('Erreur de résolution'); }
  };

  const handleResolveComplaint = async (complaintId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: 'resolved', resolution_notes: notes, resolved_at: new Date().toISOString() })
        .eq('id', complaintId);
      if (error) throw error;
      toast.success('Réclamation résolue');
      invalidate();
    } catch { toast.error('Erreur de résolution'); }
  };

  const handleRejectComplaint = async (complaintId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: 'rejected', resolution_notes: notes, resolved_at: new Date().toISOString() })
        .eq('id', complaintId);
      if (error) throw error;
      toast.success('Réclamation rejetée');
      invalidate();
    } catch { toast.error('Erreur de rejet'); }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Modération & Qualité</h1>
        <p className="text-muted-foreground">Gérez les signalements, avis et maintenez la qualité de la plateforme</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Signalements Ouverts</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openReports}</div>
            <Badge variant="destructive" className="mt-2"><AlertTriangle className="w-3 h-3 mr-1" />À traiter</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avis en Attente</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <Badge variant="secondary" className="mt-2"><Eye className="w-3 h-3 mr-1" />À modérer</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Réclamations Ouvertes</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openComplaints}</div>
            <Badge variant="destructive" className="mt-2"><MessageSquare className="w-3 h-3 mr-1" />Clients</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Utilisateurs Suspendus</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.suspendedUsers}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Actions (7j)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.weeklyActions}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews"><Eye className="w-4 h-4 mr-2" />Avis à modérer ({reviews.length})</TabsTrigger>
          <TabsTrigger value="complaints"><MessageSquare className="w-4 h-4 mr-2" />Réclamations ({complaints.length})</TabsTrigger>
          <TabsTrigger value="reports"><Flag className="w-4 h-4 mr-2" />Signalements ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {reviews.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Aucun avis en attente de modération</CardContent></Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.client.first_name} {review.client.last_name}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground">{review.provider.business_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>⭐</span>
                        ))}
                      </div>
                      <p className="text-sm">{review.comment}</p>
                      <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleApproveReview(review.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approuver
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectReview(review.id)}>
                        <XCircle className="w-4 h-4 mr-1" />Rejeter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          {complaints.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Aucune réclamation active</CardContent></Card>
          ) : (
            complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={complaint.priority === 'urgent' || complaint.priority === 'high' ? 'destructive' : 'secondary'}>
                          {complaint.priority}
                        </Badge>
                        <Badge variant="outline">{complaint.complaint_type}</Badge>
                        <Badge variant={complaint.status === 'new' ? 'destructive' : 'secondary'}>
                          {complaint.status === 'new' ? 'Nouveau' : 'En cours'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{complaint.title}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{complaint.client.first_name} {complaint.client.last_name}</span>
                        {complaint.provider && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-muted-foreground">{complaint.provider.business_name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm">{complaint.description}</p>
                      <p className="text-xs text-muted-foreground">Créée le {new Date(complaint.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => {
                        const notes = window.prompt('Notes de résolution:');
                        if (notes) handleResolveComplaint(complaint.id, notes);
                      }}>
                        <CheckCircle className="w-4 h-4 mr-1" />Résoudre
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        const notes = window.prompt('Raison du rejet:');
                        if (notes) handleRejectComplaint(complaint.id, notes);
                      }}>
                        <XCircle className="w-4 h-4 mr-1" />Rejeter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Aucun signalement actif</CardContent></Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Badge variant="destructive">{report.reported_content_type}</Badge>
                      <p className="font-medium">{report.report_reason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <Button size="sm" onClick={() => handleResolveReport(report.id)}>Résoudre</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
