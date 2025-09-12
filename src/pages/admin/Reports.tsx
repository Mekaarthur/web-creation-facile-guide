import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Flag, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  type: 'user' | 'provider' | 'booking' | 'review';
  reporter_name: string;
  reported_entity: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      type: 'provider',
      reporter_name: 'Marie Dubois',
      reported_entity: 'Jean Martin (Prestataire)',
      reason: 'Service non conforme',
      description: 'Le prestataire n\'a pas respecté les horaires convenus et le service était de mauvaise qualité.',
      status: 'pending',
      priority: 'high',
      created_at: '2024-12-10T14:30:00Z'
    },
    {
      id: '2',
      type: 'user',
      reporter_name: 'Sophie Bernard',
      reported_entity: 'Pierre Durand (Client)',
      reason: 'Comportement inapproprié',
      description: 'Le client a tenu des propos déplacés et irrespectueux.',
      status: 'investigating',
      priority: 'critical',
      created_at: '2024-12-09T11:20:00Z'
    },
    {
      id: '3',
      type: 'review',
      reporter_name: 'Admin System',
      reported_entity: 'Avis #1234',
      reason: 'Contenu inapproprié',
      description: 'L\'avis contient des propos diffamatoires.',
      status: 'resolved',
      priority: 'medium',
      created_at: '2024-12-08T09:15:00Z'
    }
  ]);

  const { toast } = useToast();

  const getStatusBadge = (status: Report['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente', color: 'text-yellow-600' },
      investigating: { variant: 'secondary' as const, label: 'En cours', color: 'text-blue-600' },
      resolved: { variant: 'default' as const, label: 'Résolu', color: 'text-green-600' },
      dismissed: { variant: 'destructive' as const, label: 'Rejeté', color: 'text-red-600' }
    };

    const config = variants[status];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: Report['priority']) => {
    const variants = {
      low: { variant: 'outline' as const, label: 'Faible', color: 'text-green-600' },
      medium: { variant: 'secondary' as const, label: 'Moyenne', color: 'text-yellow-600' },
      high: { variant: 'default' as const, label: 'Haute', color: 'text-orange-600' },
      critical: { variant: 'destructive' as const, label: 'Critique', color: 'text-red-600' }
    };

    const config = variants[priority];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'user': return Shield;
      case 'provider': return Shield;
      case 'booking': return Flag;
      case 'review': return Eye;
      default: return AlertTriangle;
    }
  };

  const handleStatusChange = (id: string, newStatus: Report['status']) => {
    setReports(prev => prev.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));
    
    const statusLabels = {
      investigating: 'en cours d\'investigation',
      resolved: 'résolu',
      dismissed: 'rejeté'
    };
    
    toast({
      title: "Statut mis à jour",
      description: `Le signalement a été marqué comme ${statusLabels[newStatus]}.`,
    });
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return reports.length;
    return reports.filter(report => report.status === status).length;
  };

  const filteredReports = (status: string) => {
    if (status === 'all') return reports;
    return reports.filter(report => report.status === status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Signalements</h1>
        <p className="text-muted-foreground">Gestion des signalements et modération</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('investigating')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.priority === 'critical').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous ({getStatusCount('all')})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({getStatusCount('pending')})</TabsTrigger>
          <TabsTrigger value="investigating">En cours ({getStatusCount('investigating')})</TabsTrigger>
          <TabsTrigger value="resolved">Résolus ({getStatusCount('resolved')})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'investigating', 'resolved'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {filteredReports(tabValue).map((report) => {
              const IconComponent = getTypeIcon(report.type);
              return (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.reason}</CardTitle>
                          <CardDescription>
                            Signalé par {report.reporter_name} • {report.reported_entity}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(report.priority)}
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('fr-FR')} à {new Date(report.created_at).toLocaleTimeString('fr-FR')}
                      </span>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(report.id, 'investigating')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Investiguer
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Résoudre
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                      
                      {report.status === 'investigating' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Résoudre
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredReports(tabValue).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Aucun signalement trouvé
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tabValue === 'all' 
                      ? "Aucun signalement pour le moment"
                      : `Aucun signalement ${tabValue === 'pending' ? 'en attente' : tabValue === 'investigating' ? 'en cours' : 'résolu'}`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminReports;