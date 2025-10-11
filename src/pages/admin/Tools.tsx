import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Server, 
  Database, 
  Shield, 
  Trash2, 
  Download, 
  Mail,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

interface DatabaseStats {
  table_stats: Record<string, { count: number; status: string }>;
  growth_stats: Record<string, number>;
}

const AdminTools = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupType, setCleanupType] = useState('expired_carts');
  const [testEmail, setTestEmail] = useState('');
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-system', {
        body: { action: 'get_system_health' }
      });
      
      if (error) throw error;
      setSystemHealth(data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'état du système",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-system', {
        body: { action: 'get_database_stats' }
      });
      
      if (error) throw error;
      setDatabaseStats(data);
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les statistiques de la base",
        variant: "destructive",
      });
    }
  };

  const runCleanup = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir nettoyer : ${cleanupType} ?`)) return;
    
    try {
      const { data, error } = await supabase.rpc('cleanup_data', {
        cleanup_type: cleanupType
      });
      
      if (error) throw error;
      
      toast({
        title: "Nettoyage terminé",
        description: `${data} éléments supprimés`,
      });
      
      fetchDatabaseStats(); // Refresh stats
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Erreur de nettoyage",
        description: "Impossible d'effectuer le nettoyage",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir un email de test",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { 
          action: 'send_test_email',
          email: testEmail,
          testType: 'basic',
          adminUserId: (await supabase.auth.getUser()).data.user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email envoyé",
        description: `Email de test envoyé à ${testEmail}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive",
      });
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('run_system_diagnostics');
      
      if (error) throw error;
      setDiagnosticsResult(data);
      
      toast({
        title: "Diagnostics terminés",
        description: `Taille DB: ${(data as any).database_size}, Statut: ${(data as any).health_status}`,
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Erreur de diagnostic",
        description: "Impossible d'exécuter les diagnostics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    fetchDatabaseStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Avancée</h1>
          <p className="text-muted-foreground">Outils système et diagnostics avancés</p>
        </div>
        <Button onClick={() => { fetchSystemHealth(); fetchDatabaseStats(); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="health">Santé Système</TabsTrigger>
          <TabsTrigger value="database">Base de Données</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                État du Système
              </CardTitle>
              <CardDescription>
                Surveillance en temps réel des composants critiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {getStatusIcon(systemHealth.overall_status)}
                    <span className={`font-semibold ${getStatusColor(systemHealth.overall_status)}`}>
                      Statut global : {systemHealth.overall_status}
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    {systemHealth.checks.map((check, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(check.status)}
                          <div>
                            <h4 className="font-medium">{check.name}</h4>
                            <p className="text-sm text-muted-foreground">{check.message}</p>
                          </div>
                        </div>
                        <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                          {check.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement de l'état du système...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Statistiques Base de Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              {databaseStats ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Tables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(databaseStats.table_stats).map(([table, stats]) => (
                        <div key={table} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{table}</span>
                            {getStatusIcon(stats.status)}
                          </div>
                          <p className="text-2xl font-bold text-primary">{stats.count}</p>
                          <p className="text-sm text-muted-foreground">enregistrements</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Croissance (30 derniers jours)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(databaseStats.growth_stats).map(([table, count]) => (
                        <div key={table} className="p-3 border rounded-lg text-center">
                          <p className="font-medium">{table}</p>
                          <p className="text-2xl font-bold text-green-600">+{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Chargement des statistiques...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Nettoyage des Données
              </CardTitle>
              <CardDescription>
                Supprimer les données obsolètes et améliorer les performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={cleanupType} onValueChange={setCleanupType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expired_carts">Paniers expirés</SelectItem>
                    <SelectItem value="old_notifications">Notifications anciennes</SelectItem>
                    <SelectItem value="incomplete_applications">Candidatures incomplètes</SelectItem>
                    <SelectItem value="resolved_incidents">Incidents résolus</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={runCleanup} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Nettoyer
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cette opération est irréversible. Les données supprimées ne pourront pas être récupérées.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Diagnostics Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runDiagnostics} disabled={loading}>
                <Activity className="h-4 w-4 mr-2" />
                Exécuter les diagnostics
              </Button>

              {diagnosticsResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Statut de santé :</span>
                      <Badge variant={diagnosticsResult.health_status === 'excellent' ? 'default' : 'destructive'}>
                        {diagnosticsResult.health_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Taille DB: {diagnosticsResult.database_size}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Métriques de performance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {diagnosticsResult.performance_metrics && Object.entries(diagnosticsResult.performance_metrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xl font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Outils Utilitaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Test d'Email</h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendTestEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer Test
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Sauvegarde Système</h4>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Créer Sauvegarde
                  <Badge variant="secondary" className="ml-2">Bientôt</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTools;