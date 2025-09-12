import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Users, MessageSquare, Flag, Eye, CheckCircle, XCircle } from "lucide-react";

const AdminModeration = () => {
  const { toast } = useToast();

  const moderationStats = [
    { label: "Signalements ouverts", value: 8, icon: Flag, color: "text-red-600" },
    { label: "Avis en attente", value: 15, icon: MessageSquare, color: "text-orange-600" },
    { label: "Utilisateurs suspendus", value: 3, icon: Users, color: "text-gray-600" },
    { label: "Actions cette semaine", value: 42, icon: Shield, color: "text-green-600" }
  ];

  const reportedContent = [
    { id: 1, type: "Avis", user: "Marie D.", content: "Service décevant, prestataire...", reason: "Langage inapproprié", status: "pending" },
    { id: 2, type: "Profil", user: "Jean M.", content: "Description du prestataire", reason: "Informations trompeuses", status: "pending" },
    { id: 3, type: "Message", user: "Sophie L.", content: "Conversation client", reason: "Harcèlement", status: "reviewing" }
  ];

  const pendingReviews = [
    { id: 1, user: "Client A.", provider: "Marie P.", rating: 2, content: "Le ménage n'était pas fait correctement...", reported: true },
    { id: 2, user: "Client B.", provider: "Paul D.", rating: 5, content: "Excellent service, très professionnel", reported: false },
    { id: 3, user: "Client C.", provider: "Anne M.", rating: 1, content: "Prestataire en retard et travail bâclé", reported: true }
  ];

  const handleApproveContent = (id: number, type: string) => {
    toast({
      title: "Contenu approuvé",
      description: `${type} #${id} a été approuvé et publié`
    });
  };

  const handleRejectContent = (id: number, type: string) => {
    toast({
      title: "Contenu rejeté",
      description: `${type} #${id} a été rejeté et supprimé`
    });
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
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Examiner
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleApproveContent(report.id, report.type)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectContent(report.id, report.type)}>
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
                          <span className="font-medium">{review.user}</span>
                          <span className="text-sm text-muted-foreground">→ {review.provider}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {review.reported && (
                          <Badge variant="destructive" className="text-xs">Signalé</Badge>
                        )}
                        <Badge variant="secondary">En attente</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleApproveContent(review.id, 'Avis')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Publier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectContent(review.id, 'Avis')}>
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