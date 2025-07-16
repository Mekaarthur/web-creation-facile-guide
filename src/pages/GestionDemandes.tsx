import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientRequestsList } from "@/components/ClientRequestsList";
import { GoogleFormsAnalytics } from "@/components/GoogleFormsAnalytics";
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Users, 
  Calendar,
  MapPin,
  BarChart3,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestStats {
  total: number;
  new: number;
  assigned: number;
  converted: number;
  thisWeek: number;
}

export const GestionDemandes = () => {
  const [stats, setStats] = useState<RequestStats>({
    total: 0,
    new: 0,
    assigned: 0,
    converted: 0,
    thisWeek: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topLocations, setTopLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Statistiques générales
      const { data: allRequests, error } = await supabase
        .from('client_requests')
        .select('*');

      if (error) throw error;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const thisWeekRequests = allRequests?.filter(request => 
        new Date(request.created_at) >= oneWeekAgo
      ).length || 0;

      setStats({
        total: allRequests?.length || 0,
        new: allRequests?.filter(r => r.status === 'new').length || 0,
        assigned: allRequests?.filter(r => r.status === 'assigned').length || 0,
        converted: allRequests?.filter(r => r.status === 'converted').length || 0,
        thisWeek: thisWeekRequests
      });

      // Activité récente
      const { data: recent } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(recent || []);

      // Top locations
      const locationCounts = allRequests?.reduce((acc, request) => {
        const location = request.location;
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const sortedLocations = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      setTopLocations(sortedLocations);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Créer CSV
      const headers = [
        'Date', 'Client', 'Email', 'Service', 'Localisation', 
        'Statut', 'Urgence', 'Budget'
      ];
      
      const csvContent = [
        headers.join(','),
        ...data.map(request => [
          new Date(request.created_at).toLocaleDateString('fr-FR'),
          request.client_name,
          request.client_email,
          request.service_type,
          request.location,
          request.status,
          request.urgency_level,
          request.budget_range || 'Non spécifié'
        ].join(','))
      ].join('\n');

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `demandes-clients-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Export réussi",
        description: "Les demandes ont été exportées en CSV",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStats();

    // Mise à jour en temps réel
    const channel = supabase
      .channel('requests-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_requests'
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Demandes</h1>
            <p className="text-muted-foreground">
              Suivi et traitement des demandes clients via Google Forms
            </p>
          </div>
          <Button onClick={exportRequests} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nouvelles</p>
                  <p className="text-2xl font-bold text-green-600">{stats.new}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assignées</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.assigned}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Converties</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.thisWeek}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="demandes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demandes">Toutes les demandes</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="demandes" className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres et recherche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, email, service..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="new">Nouvelles</SelectItem>
                      <SelectItem value="assigned">Assignées</SelectItem>
                      <SelectItem value="converted">Converties</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterService} onValueChange={setFilterService}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les services</SelectItem>
                      <SelectItem value="Ménage">Ménage</SelectItem>
                      <SelectItem value="Garde d'enfants">Garde d'enfants</SelectItem>
                      <SelectItem value="Assistance seniors">Assistance seniors</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des demandes */}
            <ClientRequestsList />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics avancées */}
            <GoogleFormsAnalytics />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Activité récente */}
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>
                    Dernières demandes reçues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium">{activity.client_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.service_type} - {activity.location}
                          </p>
                        </div>
                        <Badge variant={
                          activity.status === 'new' ? 'default' :
                          activity.status === 'assigned' ? 'secondary' :
                          'outline'
                        }>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top locations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zones les plus demandées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topLocations.map((location, index) => (
                      <div key={location.location} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span>{location.location}</span>
                        </div>
                        <Badge variant="outline">{location.count} demandes</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Google Forms</CardTitle>
                <CardDescription>
                  Paramètres d'intégration avec Google Forms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">URL du Webhook</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configurez cette URL dans votre Google Form pour recevoir les données :
                  </p>
                  <code className="block p-2 bg-white border rounded text-sm">
                    https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/google-forms-webhook
                  </code>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Champs requis dans le formulaire</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Nom complet (obligatoire)</li>
                    <li>• Email (obligatoire)</li>
                    <li>• Type de service (obligatoire)</li>
                    <li>• Description du service (obligatoire)</li>
                    <li>• Localisation (obligatoire)</li>
                    <li>• Téléphone (optionnel)</li>
                    <li>• Date souhaitée (optionnel)</li>
                    <li>• Budget (optionnel)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};