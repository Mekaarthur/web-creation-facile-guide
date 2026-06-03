/**
 * PlatformHealthWidget — Carte santé plateforme temps réel (Chantier 7)
 *
 * Affiche :
 *   - Score global (0..100) avec code couleur
 *   - Niveau qualitatif (healthy / degraded / warning / critical)
 *   - Liste des signaux actifs triés par sévérité
 *   - Lien vers le centre d'anomalies pour traitement
 *
 * Refresh automatique 60s via usePlatformHealth.
 */

import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformHealth, type HealthLevel } from "@/hooks/queries/usePlatformHealth";
import { cn } from "@/lib/utils";

const levelConfig: Record<
  HealthLevel,
  { label: string; badgeClass: string; icon: typeof CheckCircle2; progressClass: string }
> = {
  healthy: {
    label: "Optimal",
    badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    icon: CheckCircle2,
    progressClass: "[&>div]:bg-emerald-500",
  },
  degraded: {
    label: "Dégradé",
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    icon: Activity,
    progressClass: "[&>div]:bg-amber-500",
  },
  warning: {
    label: "Alerte",
    badgeClass: "bg-orange-500/15 text-orange-700 border-orange-500/30",
    icon: AlertTriangle,
    progressClass: "[&>div]:bg-orange-500",
  },
  critical: {
    label: "Critique",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    icon: ShieldAlert,
    progressClass: "[&>div]:bg-destructive",
  },
};

const severityBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

export const PlatformHealthWidget = () => {
  const navigate = useNavigate();
  const { data, isLoading } = usePlatformHealth();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const cfg = levelConfig[data.level];
  const Icon = cfg.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Santé plateforme
          </CardTitle>
          <Badge variant="outline" className={cn("gap-1", cfg.badgeClass)}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Score global</span>
            <span className="text-3xl font-bold tabular-nums">
              {data.score}
              <span className="text-base text-muted-foreground">/100</span>
            </span>
          </div>
          <Progress value={data.score} className={cn("h-2", cfg.progressClass)} />
        </div>

        {/* Stats anomalies compactes */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg border border-border bg-card p-2">
            <div className="text-lg font-bold tabular-nums">{data.anomalies.total}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2">
            <div className="text-lg font-bold tabular-nums text-destructive">
              {data.anomalies.critical}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critique
            </div>
          </div>
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2">
            <div className="text-lg font-bold tabular-nums text-orange-600">
              {data.anomalies.high}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Élevé
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
            <div className="text-lg font-bold tabular-nums text-amber-600">
              {data.anomalies.slaBreached}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SLA</div>
          </div>
        </div>

        {/* Signaux actifs */}
        {data.signals.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Aucun signal d'alerte actif. Plateforme saine.
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Signaux actifs ({data.signals.length})
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {data.signals.map((s) => (
                <div
                  key={s.key}
                  className="flex items-start gap-2 rounded-md border border-border p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <AlertCircle
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      s.severity === "critical" && "text-destructive",
                      s.severity === "high" && "text-orange-500",
                      s.severity === "medium" && "text-amber-500",
                      s.severity === "low" && "text-muted-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{s.label}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", severityBadge[s.severity])}
                      >
                        {s.count}
                      </Badge>
                    </div>
                    {s.hint && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA centre d'anomalies */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => navigate("/modern-admin/anomalies")}
        >
          Ouvrir le centre d'anomalies
          <ChevronRight className="h-4 w-4" />
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Mis à jour {new Date(data.computedAt).toLocaleTimeString("fr-FR")} · refresh 60s
        </p>
      </CardContent>
    </Card>
  );
};

export default PlatformHealthWidget;
