import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, AlertCircle, CheckCircle, Clock, Users } from "lucide-react";
import SystemHealthCheck from "@/components/admin/SystemHealthCheck";

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface QualityIssue {
  id: string;
  type: 'service' | 'provider' | 'process';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  assigned_to?: string;
}

const AdminQuality = () => {
  const [metrics] = useState<QualityMetric[]>([
    { id: '1', name: 'Satisfaction client', value: 4.6, target: 4.5, trend: 'up', color: 'text-green-600' },
    { id: '2', name: 'Taux de complétion', value: 94, target: 95, trend: 'down', color: 'text-red-600' },
    { id: '3', name: 'Ponctualité', value: 87, target: 90, trend: 'up', color: 'text-yellow-600' },
    { id: '4', name: 'Taux de réclamation', value: 3.2, target: 5.0, trend: 'stable', color: 'text-green-600' }
  ]);

  const [issues] = useState<QualityIssue[]>([
    {
      id: '1',
      type: 'process',
      title: 'Validation des processus techniques',
      description: 'Vérification des systèmes de notifications, intégrations de paiement et gestion des fichiers',
      severity: 'high',
      status: 'in_progress',
      created_at: '2024-12-10T10:00:00Z',
      assigned_to: 'Marie Admin'
    },
    {
      id: '2',
      type: 'provider',
      title: 'Formation prestataires BikaSeniors',
      description: 'Besoin d\'améliorer la formation pour les services aux seniors',
      severity: 'medium',
      status: 'open',
      created_at: '2024-12-09T14:30:00Z'
    },
    {
      id: '3',
      type: 'process',
      title: 'Processus de validation documents',
      description: 'Temps de validation des documents trop long',
      severity: 'low',
      status: 'resolved',
      created_at: '2024-12-08T09:15:00Z',
      assigned_to: 'Pierre Admin'
    }
  ]);

  const getSeverityBadge = (severity: QualityIssue['severity']) => {
    const variants = {
      low: { variant: 'outline' as const, label: 'Faible', color: 'text-green-600' },
      medium: { variant: 'secondary' as const, label: 'Moyenne', color: 'text-yellow-600' },
      high: { variant: 'default' as const, label: 'Haute', color: 'text-orange-600' },
      critical: { variant: 'destructive' as const, label: 'Critique', color: 'text-red-600' }
    };

    const config = variants[severity];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: QualityIssue['status']) => {
    const variants = {
      open: { variant: 'outline' as const, label: 'Ouvert', icon: AlertCircle },
      in_progress: { variant: 'secondary' as const, label: 'En cours', icon: Clock },
      resolved: { variant: 'default' as const, label: 'Résolu', icon: CheckCircle }
    };

    const config = variants[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTrendIcon = (trend: QualityMetric['trend']) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getProgressColor = (value: number, target: number) => {
    if (value >= target) return "bg-green-500";
    if (value >= target * 0.8) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Qualité</h1>
        <p className="text-muted-foreground">Suivi de la qualité des services et amélioration continue</p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.name.includes('Satisfaction') ? metric.value.toFixed(1) : `${metric.value}%`}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Objectif: {metric.name.includes('Satisfaction') ? metric.target.toFixed(1) : `${metric.target}%`}</span>
                </div>
                <Progress 
                  value={metric.name.includes('Satisfaction') ? (metric.value / 5) * 100 : metric.value} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="issues">Problèmes qualité</TabsTrigger>
          <TabsTrigger value="tests">Tests Système</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de performance</CardTitle>
                <CardDescription>Évolution des principaux KPIs qualité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${metric.color}`}>
                          {metric.name.includes('Satisfaction') ? metric.value.toFixed(1) : `${metric.value}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions prioritaires</CardTitle>
                <CardDescription>Problèmes nécessitant une attention immédiate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issues.filter(issue => issue.status !== 'resolved' && issue.severity !== 'low').map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(issue.severity)}
                        {getStatusBadge(issue.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Problèmes qualité</CardTitle>
              <CardDescription>Suivi des problèmes identifiés et actions correctives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.map((issue) => (
                  <Card key={issue.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          {getSeverityBadge(issue.severity)}
                          {getStatusBadge(issue.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Type: {issue.type}</span>
                          <span>Créé le: {new Date(issue.created_at).toLocaleDateString('fr-FR')}</span>
                          {issue.assigned_to && <span>Assigné à: {issue.assigned_to}</span>}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                        {issue.status === 'open' && (
                          <Button size="sm">
                            Prendre en charge
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <SystemHealthCheck />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendances qualité</CardTitle>
                <CardDescription>Évolution des métriques sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Graphiques d'analyse à venir</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des problèmes</CardTitle>
                <CardDescription>Distribution par type et sévérité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Services</span>
                      <span>1 problème</span>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Prestataires</span>
                      <span>1 problème</span>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processus</span>
                      <span>1 problème</span>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminQuality;