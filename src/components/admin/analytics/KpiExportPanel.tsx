/**
 * KpiExportPanel — Export CSV des indicateurs business (Chantier 6)
 *
 * Permet à l'admin de télécharger en CSV :
 *   - synthèse KPIs
 *   - top services
 *   - top prestataires
 *
 * Génération côté client (pas de dépendance externe).
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, TrendingUp, Users, ShoppingCart, Euro } from "lucide-react";
import { toast } from "sonner";
import { useAdminKpis, type KpiPeriod } from "@/hooks/queries/useAdminKpis";

const periodLabels: Record<KpiPeriod, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "3 derniers mois",
  "365d": "12 derniers mois",
};

function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const KpiExportPanel = () => {
  const [period, setPeriod] = useState<KpiPeriod>("30d");
  const { data: kpis, isLoading, refetch, isFetching } = useAdminKpis(period);

  const handleExportSynthese = () => {
    if (!kpis) return;
    const rows = [
      { Indicateur: "Période", Valeur: periodLabels[kpis.period] },
      { Indicateur: "CA total (€)", Valeur: kpis.revenue.total.toFixed(2) },
      { Indicateur: "Commission plateforme (€)", Valeur: kpis.revenue.commission.toFixed(2) },
      { Indicateur: "Reversé prestataires (€)", Valeur: kpis.revenue.providerPayout.toFixed(2) },
      { Indicateur: "Transactions payées", Valeur: kpis.revenue.transactionCount },
      { Indicateur: "Bookings total", Valeur: kpis.bookings.total },
      { Indicateur: "Bookings complétés", Valeur: kpis.bookings.completed },
      { Indicateur: "Bookings annulés", Valeur: kpis.bookings.cancelled },
      { Indicateur: "Paniers créés", Valeur: kpis.conversion.cartsCreated },
      { Indicateur: "Paniers convertis", Valeur: kpis.conversion.cartsConverted },
      { Indicateur: "Taux conversion (%)", Valeur: (kpis.conversion.rate * 100).toFixed(2) },
    ];
    downloadCSV(`bikawo-synthese-${kpis.period}-${Date.now()}.csv`, toCSV(rows));
    toast.success("Synthèse exportée");
  };

  const handleExportServices = () => {
    if (!kpis || kpis.topServices.length === 0) {
      toast.info("Aucune donnée à exporter");
      return;
    }
    const rows = kpis.topServices.map((s, i) => ({
      Rang: i + 1,
      Service: s.name,
      Réservations: s.count,
      "CA (€)": s.revenue.toFixed(2),
    }));
    downloadCSV(`bikawo-top-services-${kpis.period}-${Date.now()}.csv`, toCSV(rows));
    toast.success("Top services exporté");
  };

  const handleExportProviders = () => {
    if (!kpis || kpis.topProviders.length === 0) {
      toast.info("Aucune donnée à exporter");
      return;
    }
    const rows = kpis.topProviders.map((p, i) => ({
      Rang: i + 1,
      Prestataire: p.name,
      Missions: p.missions,
      "CA généré (€)": p.revenue.toFixed(2),
    }));
    downloadCSV(`bikawo-top-providers-${kpis.period}-${Date.now()}.csv`, toCSV(rows));
    toast.success("Top prestataires exporté");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              KPIs temps réel & exports
            </CardTitle>
            <CardDescription>
              Indicateurs business consolidés — refresh auto 30s
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as KpiPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(periodLabels) as KpiPeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {periodLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading || !kpis ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <StatCard
                icon={<Euro className="h-4 w-4" />}
                label="CA encaissé"
                value={fmtEur(kpis.revenue.total)}
                hint={`${kpis.revenue.transactionCount} transactions`}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Commission"
                value={fmtEur(kpis.revenue.commission)}
                hint={`Reversé : ${fmtEur(kpis.revenue.providerPayout)}`}
              />
              <StatCard
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Bookings"
                value={String(kpis.bookings.total)}
                hint={`${kpis.bookings.completed} complétés`}
              />
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Conversion"
                value={`${(kpis.conversion.rate * 100).toFixed(1)}%`}
                hint={`${kpis.conversion.cartsConverted}/${kpis.conversion.cartsCreated} paniers`}
              />
            </div>

            {/* Top services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Top 5 services</h3>
                <Button size="sm" variant="outline" onClick={handleExportServices}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
              {kpis.topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>
              ) : (
                <div className="space-y-1">
                  {kpis.topServices.map((s, i) => (
                    <div
                      key={s.service_id}
                      className="flex items-center justify-between rounded border bg-card px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{i + 1}</Badge>
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{s.count} réservations</span>
                        <span className="font-semibold text-foreground">{fmtEur(s.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top providers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Top 5 prestataires</h3>
                <Button size="sm" variant="outline" onClick={handleExportProviders}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
              {kpis.topProviders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>
              ) : (
                <div className="space-y-1">
                  {kpis.topProviders.map((p, i) => (
                    <div
                      key={p.provider_id}
                      className="flex items-center justify-between rounded border bg-card px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{i + 1}</Badge>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{p.missions} missions</span>
                        <span className="font-semibold text-foreground">{fmtEur(p.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Synthèse export */}
            <div className="flex justify-end pt-2 border-t">
              <Button onClick={handleExportSynthese}>
                <Download className="h-4 w-4 mr-2" />
                Exporter la synthèse complète (CSV)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-lg border bg-card p-3">
    <div className="flex items-center justify-between mb-1 text-muted-foreground">
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

export default KpiExportPanel;
