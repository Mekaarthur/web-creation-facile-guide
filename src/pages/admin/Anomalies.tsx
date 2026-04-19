import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldAlert,
  ServerCog,
  Briefcase,
  MessageSquareWarning,
  Lock,
  TrendingDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  useAnomaliesCenter,
  type Anomaly,
  type AnomalySeverity,
  type AnomalyCategory,
} from '@/hooks/useAnomaliesCenter';
import { playCriticalAlertSound } from '@/lib/playAlertSound';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const severityConfig: Record<
  AnomalySeverity,
  { label: string; className: string; dot: string }
> = {
  critical: {
    label: 'Critique',
    className: 'bg-destructive text-destructive-foreground border-destructive',
    dot: 'bg-destructive',
  },
  high: {
    label: 'Élevé',
    className:
      'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Moyen',
    className:
      'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/40',
    dot: 'bg-yellow-500',
  },
  info: {
    label: 'Info',
    className:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40',
    dot: 'bg-blue-500',
  },
};

const categoryConfig: Record<
  AnomalyCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  system: { label: 'Système', icon: ServerCog },
  mission: { label: 'Missions', icon: Briefcase },
  compliance: { label: 'Conformité', icon: ShieldAlert },
  security: { label: 'Sécurité', icon: Lock },
  business: { label: 'Métier', icon: TrendingDown },
  communication: { label: 'Communication', icon: MessageSquareWarning },
};

const Anomalies = () => {
  const { data: anomalies = [], isLoading, refetch, isFetching, dataUpdatedAt } =
    useAnomaliesCenter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const previousCriticalIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Détection des nouveaux critiques pour son
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      previousCriticalIds.current = new Set(
        anomalies.filter((a) => a.severity === 'critical').map((a) => a.id)
      );
      return;
    }
    const currentCritical = anomalies.filter((a) => a.severity === 'critical');
    const newOnes = currentCritical.filter(
      (a) => !previousCriticalIds.current.has(a.id)
    );
    if (newOnes.length > 0) {
      if (soundEnabled) playCriticalAlertSound();
      toast.error(
        `${newOnes.length} nouvelle(s) anomalie(s) critique(s) détectée(s)`,
        {
          description: newOnes.map((a) => a.title).join(' · '),
        }
      );
    }
    previousCriticalIds.current = new Set(currentCritical.map((a) => a.id));
  }, [anomalies, soundEnabled]);

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, info: 0 };
    anomalies.forEach((a) => c[a.severity]++);
    return c;
  }, [anomalies]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return anomalies;
    return anomalies.filter((a) => a.category === activeTab);
  }, [anomalies, activeTab]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Centre d'anomalies
          </h1>
          <p className="text-muted-foreground">
            Vue temps réel de toutes les anomalies détectées sur la plateforme
            {dataUpdatedAt > 0 && (
              <span className="ml-2 text-xs">
                · Dernière mise à jour{' '}
                {formatDistanceToNow(new Date(dataUpdatedAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
            <Label
              htmlFor="sound-toggle"
              className="flex items-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Son critique
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['critical', 'high', 'medium', 'info'] as AnomalySeverity[]).map(
          (sev) => {
            const cfg = severityConfig[sev];
            return (
              <Card key={sev}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {cfg.label}
                      </p>
                      <p className="text-3xl font-bold mt-1">{counts[sev]}</p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${cfg.dot}/20`}
                    >
                      <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Filtre par catégorie */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
          <TabsTrigger value="all">Toutes ({anomalies.length})</TabsTrigger>
          {(Object.keys(categoryConfig) as AnomalyCategory[]).map((cat) => {
            const Icon = categoryConfig[cat].icon;
            const count = anomalies.filter((a) => a.category === cat).length;
            return (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">
                  {categoryConfig[cat].label}
                </span>
                <span className="text-xs opacity-70">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold">Aucune anomalie</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tout fonctionne normalement dans cette catégorie.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((anomaly) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnomalyCard = ({ anomaly }: { anomaly: Anomaly }) => {
  const sev = severityConfig[anomaly.severity];
  const cat = categoryConfig[anomaly.category];
  const Icon = cat.icon;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: '' }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${sev.dot}/15`}
            >
              <Icon className={`h-5 w-5 ${sev.dot.replace('bg-', 'text-')}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-base">{anomaly.title}</CardTitle>
                <Badge variant="outline" className={sev.className}>
                  {sev.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {cat.label}
                </Badge>
                {typeof anomaly.count === 'number' && anomaly.count > 1 && (
                  <Badge variant="outline" className="text-xs">
                    ×{anomaly.count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {anomaly.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Détecté{' '}
                {formatDistanceToNow(new Date(anomaly.detectedAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
          {anomaly.actionHref && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to={anomaly.actionHref}>
                {anomaly.actionLabel || 'Voir'}
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default Anomalies;
