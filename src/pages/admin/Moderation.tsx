import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Users, MessageSquare, Flag, Eye, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminModeration = () => {
  const { toast } = useToast();
  const [reportedContent, setReportedContent] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const moderationStats = [
    { label: "Signalements ouverts", value: reportedContent.length, icon: Flag, color: "text-red-600" },
    { label: "Avis en attente", value: pendingReviews.length, icon: MessageSquare, color: "text-orange-600" },
    { label: "Utilisateurs suspendus", value: 3, icon: Users, color: "text-gray-600" },
    { label: "Actions cette semaine", value: 42, icon: Shield, color: "text-green-600" }
  ];

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch statistics
      const statsResponse = await supabase.functions.invoke('admin-moderation', {
        body: { action: 'get_stats' }
      });

      // Fetch reports
      const reportsResponse = await supabase.functions.invoke('admin-moderation', {
        body: { action: 'list_reports' }
      });

      // Fetch pending reviews
      const reviewsResponse = await supabase.functions.invoke('admin-moderation', {
        body: { action: 'list_reviews' }
      });

      if (statsResponse.data?.success) {
        // Update stats with real data
        const realStats = statsResponse.data.data;
        moderationStats[0].value = realStats.open_reports;
        moderationStats[1].value = realStats.pending_reviews;
        moderationStats[2].value = realStats.suspended_users;
        moderationStats[3].value = realStats.weekly_actions;
      }

      if (reportsResponse.data?.success) {
        setReportedContent(reportsResponse.data.data);
      }

      if (reviewsResponse.data?.success) {
        setPendingReviews(reviewsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de modération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (action: 'approve' | 'reject' | 'examine', type: 'review' | 'report', id: string) => {
    try {
      const { data: response } = await supabase.functions.invoke('admin-moderation', {
        body: { 
          action, 
          type, 
          id,
          reason: `Action ${action} effectuée par l'administrateur`
        }
      });

      if (response?.success) {
        toast({
          title: action === 'approve' ? "Contenu approuvé" : action === 'reject' ? "Contenu rejeté" : "Examen effectué",
          description: response.message || `${type} ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'examiné'} avec succès`
        });
        
        // Refresh data
        fetchModerationData();
      } else {
        throw new Error(response?.error || 'Action échouée');
      }
    } catch (error) {
      console.error('Moderation action error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modération</h1>
        <p className="text-muted-foreground">Gestion de la modération des contenus et utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {moderationStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
          <TabsTrigger value="reviews">Avis en attente</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Signalements en cours
              </CardTitle>
              <CardDescription>
                Contenus signalés par les utilisateurs nécessitant une modération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportedContent.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">{report.type}</Badge>
                          <span className="font-medium">{report.user}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{report.content}</p>
                        <p className="text-xs text-red-600">Motif: {report.reason}</p>
                      </div>
                      <Badge variant={report.status === "pending" ? "destructive" : "secondary"}>
                        {report.status === "pending" ? "En attente" : "En cours"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleModerationAction('examine', 'report', report.id.toString())}>
                        <Eye className="w-4 h-4 mr-1" />
                        Examiner
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleModerationAction('approve', 'report', report.id.toString())}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleModerationAction('reject', 'report', report.id.toString())}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Avis en attente de modération
              </CardTitle>
              <CardDescription>
                Avis clients nécessitant une validation avant publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                        {pendingReviews.map((review) => (
                          <div key={review.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">
                                    {review.profiles?.first_name} {review.profiles?.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    → {review.providers?.business_name}
                                  </span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Créé le {new Date(review.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">En attente</Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleModerationAction('approve', 'review', review.id)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Publier
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleModerationAction('reject', 'review', review.id)}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestion des utilisateurs
              </CardTitle>
              <CardDescription>
                Actions de modération sur les comptes utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  La gestion détaillée des utilisateurs est disponible dans la section "Utilisateurs"
                </p>
                <Button className="mt-4" variant="outline">
                  Aller aux utilisateurs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminModeration;