import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAdminMatching } from '@/hooks/useAdminMatching';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const IntelligentMatchingDashboard = () => {
  const { metrics, activeMatches, loading, triggerMatching, refreshData } = useAdminMatching();
  const [selectedRequest, setSelectedRequest] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'timeout': return 'bg-orange-500';
      case 'backup': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Refusé';
      case 'timeout': return 'Expiré';
      case 'backup': return 'Backup';
      default: return status;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'Expiré';
    if (minutes === 0) return '< 1 min';
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            Matching Intelligent IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Attribution automatique et monitoring en temps réel
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Demandes aujourd'hui</p>
                <p className="text-3xl font-bold">{metrics.totalRequests}</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matchs en attente</p>
                <p className="text-3xl font-bold">{metrics.pendingMatches}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-3xl font-bold">{metrics.successRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
                <p className="text-3xl font-bold">{metrics.averageResponseTime}min</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Prestataires actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Principal</span>
                <Badge variant="default">{metrics.activeProviders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup disponibles</span>
                <Badge variant="secondary">{metrics.backupProviders}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Algorithme IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Modèle</span>
                <Badge variant="outline">Gemini 2.5 Flash</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Scoring</span>
                <Badge variant="outline">Multi-critères</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Attribution</span>
                <Badge variant="outline">Cascade automatique</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matchs actifs en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Attributions en cours
          </CardTitle>
          <CardDescription>
            Surveillance temps réel des missions en attente de réponse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune attribution en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMatches.map((match) => (
                <div 
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={getStatusColor(match.status)}
                      >
                        {getStatusLabel(match.status)}
                      </Badge>
                      {match.priority === 1 && (
                        <Badge variant="default">Principal</Badge>
                      )}
                      {match.priority > 1 && (
                        <Badge variant="secondary">Backup #{match.priority}</Badge>
                      )}
                    </div>
                    <p className="font-medium">{match.providerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {match.score} • Assigné {formatDistanceToNow(new Date(match.assignedAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {getTimeRemaining(match.expiresAt)}
                      </span>
                    </div>
                    {match.status === 'pending' && (
                      <Progress 
                        value={(30 - parseInt(getTimeRemaining(match.expiresAt))) / 30 * 100} 
                        className="w-32 h-2"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Système de backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Système de backup automatique
          </CardTitle>
          <CardDescription>
            En cas de refus ou timeout, le système active automatiquement le prestataire suivant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <span className="font-medium">Attribution initiale</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Meilleur match selon l'IA • Timeout: 30 min
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <span className="font-medium">Backup #1</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Activation auto si refus/timeout • Timeout: 30 min
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <span className="font-medium">Backup #2</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Dernier recours • Alerte admin si échec
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentMatchingDashboard;